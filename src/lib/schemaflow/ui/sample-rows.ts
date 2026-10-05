import { clipIdentifier, quote } from '../dialects/names';
import { defaultSql, identitySql } from '../dialects/sql-generate';
import type { Column, LogicalType, Relation, Schema, Table } from '../model/types';
import { checksOf, referenced, repair, type Cell, type Check, type Field } from './sample-checks';

export type SampleLang = 'es' | 'en';
export type SkipReason = 'unknown-type' | 'cycle' | 'parent' | 'generated-key';

export const SKIP_REASONS: readonly SkipReason[] = ['unknown-type', 'cycle', 'parent', 'generated-key'];

export interface SampleResult {
	sql: string;
	skipped: string[];
	reasons: Record<string, SkipReason>;
	rows: Record<string, number>;
}

export const SAMPLE_ROWS = 3;

interface Link {
	relation: Relation;
	index: number;
}

interface Grid {
	columns: Column[];
	rows: Cell[][];
}

type Named = { kind: 'enum'; labels: string[] } | { kind: 'domain'; base: string };

interface Context {
	lang: SampleLang;
	tables: Map<string, Table>;
	links: Map<string, Link>;
	outgoing: Map<string, Relation[]>;
	order: Table[];
	loose: Set<string>;
	explicit: Map<string, Set<string>>;
	related: Map<string, Set<string>>;
	types: Map<string, LogicalType>;
	named: Map<string, Named>;
	checks: Map<string, Check[]>;
	checked: Map<string, Set<string>>;
	grids: Map<string, Grid>;
	reasons: Map<string, SkipReason>;
}

interface Sampling {
	ctx: Context;
	blocks: Map<string, string>;
}

const NUMERIC = new Set(['smallint', 'int', 'bigint', 'decimal', 'real', 'double']);
const TEMPORAL = new Set(['date', 'timestamp', 'timestamptz']);

const q = (name: string) => quote('postgres', name);
const literal = (text: string) => `'${text.replaceAll("'", "''")}'`;
const pad = (n: number, width: number) => String(n).padStart(width, '0');
const joined = (values: readonly Cell[]) => values.join('\u0001');

const HINTS: { test: RegExp; make: (n: number, lang: SampleLang) => string }[] = [
	{ test: /(^|_)(e?mail|correo)($|_)/i, make: (n) => `user${n}@example.com` },
	{ test: /(^|_)(url|link|website|sitio|image|img|photo|foto|avatar)($|_)/i, make: (n) => `https://example.com/${n}` },
	{ test: /(^|_)(phone|telefono|tel|mobile|celular)($|_)/i, make: (n) => `555-010${n}` },
	{ test: /(^|_)(status|estado|state|type|tipo|role|rol|plan|level|nivel)($|_)/i, make: (n) => ['active', 'pending', 'closed'][(n - 1) % 3] ?? 'active' },
	{ test: /(^|_)(name|nombre|title|titulo|label|etiqueta|description|descripcion|comment|comentario|note|nota|bio|body|content|contenido|summary|resumen|text|texto|message|mensaje)($|_)/i, make: (n, lang) => (lang === 'es' ? `Ejemplo ${n}` : `Example ${n}`) }
];

function fit(base: string, n: number, length: number | undefined): string {
	const suffix = String(n);
	if (length === undefined) return base + suffix;
	if (length <= suffix.length) return suffix.slice(-length);
	return base.slice(0, length - suffix.length) + suffix;
}

function words(name: string, n: number, lang: SampleLang, length: number | undefined): string {
	const value = HINTS.find((hint) => hint.test.test(name))?.make(n, lang);
	if (value !== undefined && (length === undefined || value.length <= length)) return value;
	return fit(`${name}_`, n, length);
}

function decimal(precision: number | undefined, scale: number | undefined, n: number): string {
	const decimals = scale ?? 2;
	const room = (precision ?? 12) - decimals;
	if (room >= 2) return decimals === 0 ? String(n * 10) : `${n * 10}.${'5'.padEnd(decimals, '0')}`;
	if (room === 1) return decimals === 0 ? String(n) : `${n}.${'5'.padEnd(decimals, '0')}`;
	return decimals === 0 ? '0' : `0.${'0'.repeat(-room)}${n}`.padEnd(decimals + 2, '0');
}

function normal(sql: string): { name: string; args: number[]; array: boolean } {
	const array = /\[\s*\d*\s*\]\s*$|\barray\s*(\[\s*\d*\s*\])?\s*$/i.test(sql);
	const first = /\(([^)]*)\)/.exec(sql);
	const args = first ? [...(first[1] ?? '').matchAll(/\d+/g)].map((m) => Number(m[0])) : [];
	const text = sql
		.replace(/\[\s*\d*\s*\]/g, '')
		.replace(/\([^)]*\)/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/ (without|with) time zone$/i, (_all, kind: string) => (kind.toLowerCase() === 'with' ? 'tz' : ''))
		.replace(/ array$/i, '');
	const last = text.split('.').pop() ?? '';
	const quoted = /^"(.*)"$/.exec(last);
	return { name: quoted ? (quoted[1] ?? '').replaceAll('""', '"') : last.toLowerCase(), args, array };
}

const example = (n: number, lang: SampleLang) => (lang === 'es' ? `Ejemplo ${n}` : `Example ${n}`);
const whole = (n: number) => String(n * 10);
const fraction = (n: number) => String(n * 1.5);

const BUILTIN: Record<string, (n: number, args: number[], lang: SampleLang) => string> = {
	int: whole,
	int2: whole,
	int4: whole,
	int8: whole,
	integer: whole,
	smallint: whole,
	bigint: whole,
	oid: whole,
	numeric: (n, args) => decimal(args[0], args[1], n),
	decimal: (n, args) => decimal(args[0], args[1], n),
	real: fraction,
	float4: fraction,
	float8: fraction,
	float: fraction,
	'double precision': fraction,
	text: (n, _args, lang) => literal(example(n, lang)),
	citext: (n, _args, lang) => literal(example(n, lang)),
	varchar: (n, args, lang) => literal(fit(example(n, lang).slice(0, -String(n).length), n, args[0])),
	'character varying': (n, args, lang) => literal(fit(example(n, lang).slice(0, -String(n).length), n, args[0])),
	char: (n, args) => literal(fit('c', n, args[0] ?? 1)),
	character: (n, args) => literal(fit('c', n, args[0] ?? 1)),
	bpchar: (n, args) => literal(fit('c', n, args[0] ?? 1)),
	boolean: (n) => (n % 2 === 1 ? 'true' : 'false'),
	bool: (n) => (n % 2 === 1 ? 'true' : 'false'),
	date: (n) => literal(`2026-01-${pad(n, 2)}`),
	time: (n) => literal(`${pad(8 + n, 2)}:00:00`),
	timetz: (n) => literal(`${pad(8 + n, 2)}:00:00+00`),
	timestamp: (n) => literal(`2026-01-${pad(n, 2)} 09:00:00`),
	timestamptz: (n) => literal(`2026-01-${pad(n, 2)} 09:00:00+00`),
	interval: (n) => literal(`${n} day`),
	uuid: (n) => literal(`00000000-0000-4000-8000-${pad(n, 12)}`),
	json: (n) => literal(`{"n": ${n}}`),
	jsonb: (n) => literal(`{"n": ${n}}`),
	bytea: (n) => literal(`\\x${pad(n, 2)}`),
	inet: (n) => literal(`10.0.0.${n}`),
	cidr: (n) => literal(`10.${n}.0.0/16`),
	macaddr: (n) => literal(`08:00:2b:01:02:0${n}`),
	macaddr8: (n) => literal(`08:00:2b:01:02:03:04:0${n}`),
	money: (n) => literal(`${n * 10}.50`),
	tsvector: (n) => literal(`ejemplo${n}`),
	tsquery: (n) => literal(`ejemplo${n}`),
	point: (n) => literal(`(${n},${n})`),
	line: (n) => literal(`{1,-1,${n}}`),
	lseg: (n) => literal(`[(0,0),(${n},${n})]`),
	box: (n) => literal(`((0,0),(${n},${n}))`),
	path: (n) => literal(`((0,0),(${n},${n}))`),
	polygon: (n) => literal(`((0,0),(${n},0),(${n},${n}))`),
	circle: (n) => literal(`<(0,0),${n}>`),
	int4range: (n) => literal(`[${n},${n + 10})`),
	int8range: (n) => literal(`[${n},${n + 10})`),
	numrange: (n) => literal(`[${n},${n + 10})`),
	daterange: (n) => literal(`[2026-01-${pad(n, 2)},2026-02-${pad(n, 2)})`),
	tsrange: (n) => literal(`[2026-01-${pad(n, 2)} 00:00,2026-01-${pad(n, 2)} 12:00)`),
	tstzrange: (n) => literal(`[2026-01-${pad(n, 2)} 00:00+00,2026-01-${pad(n, 2)} 12:00+00)`),
	bit: (n, args) => `B'${(n % 2 === 1 ? '10' : '01').repeat(Math.ceil((args[0] ?? 1) / 2)).slice(0, args[0] ?? 1)}'`,
	varbit: (n, args) => `B'${(n % 2 === 1 ? '101' : '010').slice(0, args[0] ?? 3)}'`,
	'bit varying': (n, args) => `B'${(n % 2 === 1 ? '101' : '010').slice(0, args[0] ?? 3)}'`,
	name: (n, _args, lang) => literal(example(n, lang))
};

function rawLiteral(ctx: Context, sql: string, n: number, depth = 0): Cell {
	const { name, args, array } = normal(sql);
	if (array) return "'{}'";
	const named = ctx.named.get(name);
	if (named?.kind === 'enum') return named.labels.length > 0 ? literal(named.labels[(n - 1) % named.labels.length] ?? '') : null;
	if (named?.kind === 'domain') return depth < 4 ? rawLiteral(ctx, named.base, n, depth + 1) : null;
	return BUILTIN[name]?.(n, args, ctx.lang) ?? null;
}

function namedTypes(schema: Schema): Map<string, Named> {
	const out = new Map<string, Named>();
	for (const extra of schema.extras) {
		if (extra.dialect !== 'postgres') continue;
		const enumeration = /^\s*CREATE\s+TYPE\s+("(?:[^"]|"")+"|[\w.]+)\s+AS\s+ENUM\s*\(([\s\S]*)\)\s*;?\s*$/i.exec(extra.sql);
		if (enumeration) {
			out.set(normal(enumeration[1] ?? '').name, { kind: 'enum', labels: [...(enumeration[2] ?? '').matchAll(/'((?:[^']|'')*)'/g)].map((m) => (m[1] ?? '').replaceAll("''", "'")) });
			continue;
		}
		const domain = /^\s*CREATE\s+DOMAIN\s+("(?:[^"]|"")+"|[\w.]+)\s+(?:AS\s+)?([\s\S]+?)(?=\s+(?:DEFAULT|NOT\s+NULL|NULL|CHECK|COLLATE|CONSTRAINT)\b|\s*;?\s*$)/i.exec(extra.sql);
		if (domain) out.set(normal(domain[1] ?? '').name, { kind: 'domain', base: (domain[2] ?? '').trim() });
	}
	return out;
}

function uniqueSets(table: Table): string[][] {
	const sets: string[][] = [];
	if (table.primaryKey.length > 0) sets.push([...table.primaryKey]);
	for (const unique of table.uniques) if (unique.columns.length > 0) sets.push([...unique.columns]);
	for (const index of table.indexes) if (index.unique && index.columns.length > 0) sets.push([...index.columns]);
	return sets;
}

function mandatory(table: Table | undefined, columnId: string): boolean {
	const column = table?.columns.find((candidate) => candidate.id === columnId);
	return column !== undefined && (!column.nullable || table?.primaryKey.includes(columnId) === true);
}

function insertionOrder(schema: Schema, relations: readonly Relation[], tables: ReadonlyMap<string, Table>): { order: Table[]; loose: Set<string> } {
	const deps = new Map<string, Set<string>>();
	const loose = new Set<string>();
	const reaches = (from: string, goal: string, seen = new Set<string>()): boolean => {
		if (from === goal) return true;
		if (seen.has(from)) return false;
		seen.add(from);
		for (const next of deps.get(from) ?? []) if (reaches(next, goal, seen)) return true;
		return false;
	};
	const between = relations.filter((relation) => relation.fromTable !== relation.toTable);
	const required = (relation: Relation) => relation.fromColumns.length > 0 && relation.fromColumns.every((id) => mandatory(tables.get(relation.fromTable), id));
	for (const relation of [...between.filter(required), ...between.filter((each) => !required(each))]) {
		if (reaches(relation.toTable, relation.fromTable)) {
			loose.add(relation.id);
			continue;
		}
		deps.set(relation.fromTable, (deps.get(relation.fromTable) ?? new Set()).add(relation.toTable));
	}
	const order: Table[] = [];
	const done = new Set<string>();
	const visit = (table: Table) => {
		if (done.has(table.id)) return;
		done.add(table.id);
		for (const parent of deps.get(table.id) ?? []) {
			const found = tables.get(parent);
			if (found) visit(found);
		}
		order.push(table);
	};
	schema.tables.forEach(visit);
	return { order, loose };
}

function effectiveTypes(tables: readonly Table[], relations: readonly Relation[]): Map<string, LogicalType> {
	const parent = new Map<string, string>();
	const root = (key: string): string => {
		let top = key;
		while ((parent.get(top) ?? top) !== top) top = parent.get(top) as string;
		return top;
	};
	for (const relation of relations) {
		relation.fromColumns.forEach((id, index) => {
			const target = relation.toColumns[index];
			if (target === undefined) return;
			const a = root(`${relation.fromTable}:${id}`);
			const b = root(`${relation.toTable}:${target}`);
			if (a !== b) parent.set(a, b);
		});
	}
	const length = new Map<string, number>();
	const room = new Map<string, number>();
	const scale = new Map<string, number>();
	const kinds = new Map<string, Set<string>>();
	for (const table of tables) {
		for (const column of table.columns) {
			const top = root(`${table.id}:${column.id}`);
			const type = column.type;
			kinds.set(top, (kinds.get(top) ?? new Set()).add(type.kind));
			if ((type.kind === 'varchar' || type.kind === 'char') && type.length !== undefined) length.set(top, Math.min(length.get(top) ?? Infinity, type.length));
			if (type.kind === 'decimal') {
				const decimals = type.scale ?? 2;
				room.set(top, Math.min(room.get(top) ?? Infinity, (type.precision ?? 12) - decimals));
				scale.set(top, Math.min(scale.get(top) ?? Infinity, decimals));
			}
		}
	}
	const out = new Map<string, LogicalType>();
	for (const table of tables) {
		for (const column of table.columns) {
			const key = `${table.id}:${column.id}`;
			const top = root(key);
			const type = column.type;
			const group = [...(kinds.get(top) ?? [])];
			if (group.length > 1 && group.every((kind) => NUMERIC.has(kind)) && (type.kind !== 'decimal' || (type.precision ?? 12) - (type.scale ?? 2) >= 1)) out.set(key, { kind: 'bigint' });
			else if (group.length > 1 && group.every((kind) => TEMPORAL.has(kind))) out.set(key, { kind: group.includes('date') ? 'date' : 'timestamp' });
			else if ((type.kind === 'varchar' || type.kind === 'char') && (length.get(top) ?? Infinity) < (type.length ?? Infinity)) out.set(key, { kind: type.kind, length: length.get(top) });
			else if (type.kind === 'decimal' && room.has(top)) out.set(key, { kind: 'decimal', precision: (room.get(top) ?? 0) + (scale.get(top) ?? 0), scale: scale.get(top) });
		}
	}
	return out;
}

function context(schema: Schema, lang: SampleLang): Context {
	const tables = new Map(schema.tables.map((table) => [table.id, table]));
	const relations = schema.relations.filter((relation) => tables.has(relation.fromTable) && tables.has(relation.toTable));
	const links = new Map<string, Link>();
	const outgoing = new Map<string, Relation[]>();
	const explicit = new Map<string, Set<string>>(schema.tables.map((table) => [table.id, new Set(uniqueSets(table).flat())]));
	const related = new Map<string, Set<string>>(schema.tables.map((table) => [table.id, new Set<string>()]));
	for (const relation of relations) {
		outgoing.set(relation.fromTable, [...(outgoing.get(relation.fromTable) ?? []), relation]);
		relation.fromColumns.forEach((columnId, index) => {
			const key = `${relation.fromTable}:${columnId}`;
			if (!links.has(key)) links.set(key, { relation, index });
			explicit.get(relation.fromTable)?.add(columnId);
			related.get(relation.fromTable)?.add(columnId);
		});
		for (const columnId of relation.toColumns) {
			explicit.get(relation.toTable)?.add(columnId);
			related.get(relation.toTable)?.add(columnId);
		}
	}
	const { order, loose } = insertionOrder(schema, relations, tables);
	const checks = new Map(schema.tables.map((table) => [table.id, checksOf(table, schema.extras)]));
	const checked = new Map(
		schema.tables.map((table) => {
			const names = new Set((checks.get(table.id) ?? []).flatMap(referenced));
			return [table.id, new Set(table.columns.filter((column) => names.has(column.name)).map((column) => column.id))];
		})
	);
	return { lang, tables, links, outgoing, order, loose, explicit, related, types: effectiveTypes(schema.tables, relations), named: namedTypes(schema), checks, checked, grids: new Map(), reasons: new Map() };
}

function cell(ctx: Context, table: Table, column: Column, n: number, trail = new Set<string>()): Cell {
	const mark = `${table.id}:${column.id}:${n}`;
	if (trail.has(mark)) return null;
	trail.add(mark);
	try {
		const link = ctx.links.get(`${table.id}:${column.id}`);
		if (!link) return plain(ctx, table, column, n);
		const parent = ctx.tables.get(link.relation.toTable);
		const targetId = link.relation.toColumns[link.index];
		const target = parent?.columns.find((candidate) => candidate.id === targetId);
		if (!parent || !target) return null;
		if (ctx.loose.has(link.relation.id) || ctx.reasons.has(parent.id)) {
			const optional = link.relation.fromColumns.some((id) => !mandatory(table, id));
			return optional && mandatory(table, column.id) ? plain(ctx, parent, target, n) : null;
		}
		if (parent.id === table.id) return n === 1 && !mandatory(table, column.id) ? null : cell(ctx, parent, target, 1, trail);
		const grid = ctx.grids.get(parent.id);
		if (!grid) return cell(ctx, parent, target, n, trail);
		const at = grid.columns.findIndex((candidate) => candidate.id === target.id);
		return at < 0 ? null : (grid.rows[(n - 1) % grid.rows.length]?.[at] ?? null);
	} finally {
		trail.delete(mark);
	}
}

function plain(ctx: Context, table: Table, column: Column, n: number): Cell {
	const type = ctx.types.get(`${table.id}:${column.id}`) ?? column.type;
	const key = ctx.explicit.get(table.id)?.has(column.id) ?? false;
	switch (type.kind) {
		case 'smallint':
		case 'int':
		case 'bigint':
			return key ? String(n) : whole(n);
		case 'decimal':
			return decimal(type.precision, type.scale, n);
		case 'real':
		case 'double':
			return fraction(n);
		case 'boolean':
			return n % 2 === 1 ? 'true' : 'false';
		case 'varchar':
		case 'char':
			return literal(words(column.name, n, ctx.lang, type.length));
		case 'text':
			return literal(words(column.name, n, ctx.lang, undefined));
		case 'uuid':
			return literal(`00000000-0000-4000-8000-${pad(n, 12)}`);
		case 'date':
			return literal(`2026-01-${pad(n, 2)}`);
		case 'time':
			return literal(`${pad(8 + n, 2)}:00:00`);
		case 'timestamp':
			return literal(`2026-01-${pad(n, 2)} 09:00:00`);
		case 'timestamptz':
			return literal(`2026-01-${pad(n, 2)} 09:00:00+00`);
		case 'json':
			return literal(`{"n": ${n}}`);
		case 'binary':
			return literal(`\\x${pad(n, 2)}`);
		case 'raw':
			return rawLiteral(ctx, type.sql, n);
	}
}

function supplied(column: Column): boolean {
	const value = column.default;
	if (value.kind === 'none' || (value.kind === 'literal' && value.value === null)) return false;
	return identitySql('postgres', column) !== null || defaultSql('postgres', column) !== null;
}

function chosen(ctx: Context, table: Table): Column[] | SkipReason {
	const forced = ctx.explicit.get(table.id) ?? new Set<string>();
	const related = ctx.related.get(table.id) ?? new Set<string>();
	const checked = ctx.checked.get(table.id) ?? new Set<string>();
	const columns: Column[] = [];
	for (const column of table.columns) {
		const must = forced.has(column.id);
		if (column.default.kind === 'computed') {
			if (related.has(column.id)) return 'generated-key';
			continue;
		}
		if (!must && !checked.has(column.id) && supplied(column)) continue;
		const linked = ctx.links.has(`${table.id}:${column.id}`);
		if (!linked && column.type.kind === 'raw') {
			if (rawLiteral(ctx, column.type.sql, 1) === null) {
				if (must || !column.nullable) return 'unknown-type';
				continue;
			}
			if (!must && column.nullable) continue;
		}
		columns.push(column);
	}
	return columns;
}

function reasonOf(ctx: Context, table: Table, column: Column): SkipReason {
	const link = ctx.links.get(`${table.id}:${column.id}`);
	if (!link) return 'unknown-type';
	return ctx.loose.has(link.relation.id) ? 'cycle' : 'parent';
}

function leadingDistinct(table: Table, columns: readonly Column[], rows: readonly Cell[][]): number {
	let count = rows.length;
	for (const set of uniqueSets(table)) {
		const at = set.map((id) => columns.findIndex((column) => column.id === id));
		if (at.some((index) => index < 0)) continue;
		const seen = new Set<string>();
		for (let r = 0; r < count; r++) {
			const values = at.map((index) => rows[r]?.[index] ?? null);
			if (values.includes(null)) continue;
			const key = joined(values);
			if (seen.has(key)) {
				count = r;
				break;
			}
			seen.add(key);
		}
	}
	return count;
}

function leadingLinked(ctx: Context, table: Table, columns: readonly Column[], rows: readonly Cell[][]): number {
	let count = rows.length;
	for (const relation of ctx.outgoing.get(table.id) ?? []) {
		const parent = ctx.tables.get(relation.toTable);
		if (!parent || ctx.loose.has(relation.id) || ctx.reasons.has(parent.id)) continue;
		const own = relation.fromColumns.map((id) => columns.findIndex((column) => column.id === id));
		const grid = parent.id === table.id ? { columns: [...columns], rows: [...rows] } : ctx.grids.get(parent.id);
		if (!grid || own.some((index) => index < 0)) continue;
		const target = relation.toColumns.map((id) => grid.columns.findIndex((column) => column.id === id));
		if (target.some((index) => index < 0)) continue;
		const present = new Set(grid.rows.map((row) => joined(target.map((index) => row[index] ?? null))));
		for (let r = 0; r < count; r++) {
			const values = own.map((index) => rows[r]?.[index] ?? null);
			if (values.includes(null)) continue;
			if (!present.has(joined(values))) {
				count = r;
				break;
			}
		}
	}
	return count;
}

function sequence(table: Table, column: Column, rows: number): string {
	const body = `PERFORM setval(pg_get_serial_sequence(${literal(q(table.name))}, ${literal(clipIdentifier('postgres', column.name))}), ${rows});`;
	let tag = 'sf';
	while (body.includes(`$${tag}$`)) tag += 'x';
	return `DO $${tag}$ BEGIN ${body} END $${tag}$;`;
}

function fill(ctx: Context, table: Table): { sql: string; rows: number } | SkipReason {
	const columns = chosen(ctx, table);
	if (typeof columns === 'string') return columns;
	const keys = ctx.explicit.get(table.id) ?? new Set<string>();
	const wanted = table.columns.some((column) => column.default.kind === 'computed' && keys.has(column.id)) ? 1 : SAMPLE_ROWS;
	const rows: Cell[][] = [];
	for (let n = 1; n <= wanted; n++) {
		const row = columns.map((column) => cell(ctx, table, column, n));
		const gap = row.findIndex((value, index) => value === null && mandatory(table, columns[index]?.id ?? ''));
		if (gap >= 0) return reasonOf(ctx, table, columns[gap] as Column);
		rows.push(row);
	}
	const checks = ctx.checks.get(table.id) ?? [];
	if (checks.length > 0) {
		rows.forEach((row, index) => {
			const fields: Field[] = columns.map((column, at) => ({ column, type: ctx.types.get(`${table.id}:${column.id}`) ?? column.type, cell: row[at] ?? null, fixed: ctx.links.has(`${table.id}:${column.id}`) }));
			const fixed = repair(checks, fields, index + 1);
			if (fixed) rows[index] = fixed;
		});
	}
	for (const relation of ctx.outgoing.get(table.id) ?? []) {
		if (relation.toTable !== table.id || ctx.loose.has(relation.id)) continue;
		const own = relation.fromColumns.map((id) => columns.findIndex((column) => column.id === id));
		const target = relation.toColumns.map((id) => columns.findIndex((column) => column.id === id));
		if (own.some((index) => index < 0) || target.some((index) => index < 0)) continue;
		rows.forEach((row, index) => {
			own.forEach((at, k) => {
				row[at] = index === 0 && !mandatory(table, columns[at]?.id ?? '') ? null : (rows[0]?.[target[k] as number] ?? null);
			});
		});
	}
	const count = Math.min(leadingDistinct(table, columns, rows), leadingLinked(ctx, table, columns, rows));
	if (count < 1) return 'parent';
	const kept = rows.slice(0, count);
	ctx.grids.set(table.id, { columns, rows: kept });
	const target = q(table.name);
	if (columns.length === 0) return { sql: kept.map(() => `INSERT INTO ${target} DEFAULT VALUES;`).join('\n'), rows: count };
	const identity = columns.filter((column) => identitySql('postgres', column) !== null);
	const head = `INSERT INTO ${target} (${columns.map((column) => q(column.name)).join(', ')})${identity.length > 0 ? ' OVERRIDING SYSTEM VALUE' : ''} VALUES`;
	const lines = [`${head}\n${kept.map((row) => `  (${row.map((value) => value ?? 'NULL').join(', ')})`).join(',\n')};`];
	for (const column of identity) lines.push(sequence(table, column, count));
	return { sql: lines.join('\n'), rows: count };
}

const cache = new WeakMap<Schema, Map<SampleLang, Sampling>>();

function sampling(schema: Schema, lang: SampleLang): Sampling {
	let byLang = cache.get(schema);
	if (!byLang) cache.set(schema, (byLang = new Map()));
	const hit = byLang.get(lang);
	if (hit) return hit;
	const ctx = context(schema, lang);
	const blocks = new Map<string, string>();
	for (const table of ctx.order) {
		const made = fill(ctx, table);
		if (typeof made === 'string') ctx.reasons.set(table.id, made);
		else blocks.set(table.id, made.sql);
	}
	const built = { ctx, blocks };
	byLang.set(lang, built);
	return built;
}

export function sampledColumns(schema: Schema, table: Table, lang: SampleLang): Column[] | null {
	return sampling(schema, lang).ctx.grids.get(table.id)?.columns ?? null;
}

export function checkedColumns(schema: Schema, table: Table, lang: SampleLang): Set<string> {
	return sampling(schema, lang).ctx.checked.get(table.id) ?? new Set();
}

export function sampleValue(schema: Schema, table: Table, column: Column, n: number, lang: SampleLang): string {
	const { ctx } = sampling(schema, lang);
	const grid = ctx.grids.get(table.id);
	const at = grid ? grid.columns.findIndex((candidate) => candidate.id === column.id) : -1;
	const stored = at >= 0 ? grid?.rows[n - 1]?.[at] : undefined;
	return stored ?? cell(ctx, ctx.tables.get(table.id) ?? table, column, n) ?? 'NULL';
}

export function sampleSql(schema: Schema, tableIds: readonly string[] | null, lang: SampleLang): SampleResult {
	const { ctx, blocks } = sampling(schema, lang);
	const wanted = new Set(tableIds ?? ctx.order.map((table) => table.id));
	if (tableIds) {
		const pending = [...wanted];
		for (let id = pending.pop(); id !== undefined; id = pending.pop()) {
			for (const relation of ctx.outgoing.get(id) ?? []) {
				if (ctx.loose.has(relation.id) || wanted.has(relation.toTable)) continue;
				wanted.add(relation.toTable);
				pending.push(relation.toTable);
			}
		}
	}
	const sql: string[] = [];
	const skipped: string[] = [];
	const reasons: Record<string, SkipReason> = {};
	const rows: Record<string, number> = {};
	for (const table of ctx.order) {
		if (!wanted.has(table.id)) continue;
		const reason = ctx.reasons.get(table.id);
		if (reason) {
			skipped.push(table.name);
			reasons[table.id] = reason;
			continue;
		}
		sql.push(blocks.get(table.id) ?? '');
		rows[table.id] = ctx.grids.get(table.id)?.rows.length ?? 0;
	}
	return { sql: sql.join('\n\n'), skipped, reasons, rows };
}
