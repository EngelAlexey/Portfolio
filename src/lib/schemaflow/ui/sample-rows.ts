import { quote } from '../dialects/names';
import { isUnique } from '../model/ops';
import { dropOrder } from '../model/order';
import type { Column, Relation, Schema, Table } from '../model/types';

export type SampleLang = 'es' | 'en';

export interface SampleResult {
	sql: string;
	skipped: string[];
}

export const SAMPLE_ROWS = 3;

type Cell = string | null;

interface Link {
	relation: Relation;
	index: number;
}

interface Context {
	lang: SampleLang;
	tables: Map<string, Table>;
	links: Map<string, Link>;
	cyclic: Set<string>;
	skipped: Set<string>;
}

const q = (name: string) => quote('postgres', name);
const literal = (text: string) => `'${text.replaceAll("'", "''")}'`;
const pad = (n: number, width: number) => String(n).padStart(width, '0');

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

function words(column: Column, n: number, lang: SampleLang, length: number | undefined): string {
	const value = HINTS.find((hint) => hint.test.test(column.name))?.make(n, lang);
	if (value !== undefined && (length === undefined || value.length <= length)) return value;
	return fit(`${column.name}_`, n, length);
}

function decimal(precision: number | undefined, scale: number | undefined, n: number): string {
	const decimals = scale ?? 2;
	const room = (precision ?? 12) - decimals;
	const whole = room >= 2 ? n * 10 : room >= 1 ? n : 0;
	if (decimals === 0) return String(whole);
	return `${whole}.${'5'.padEnd(decimals, '0')}`;
}

function plain(column: Column, n: number, key: boolean, lang: SampleLang): Cell {
	const type = column.type;
	switch (type.kind) {
		case 'smallint':
		case 'int':
		case 'bigint':
			return String(key ? n : n * 10);
		case 'decimal':
			return decimal(type.precision, type.scale, n);
		case 'real':
		case 'double':
			return String(n * 1.5);
		case 'boolean':
			return n % 2 === 1 ? 'true' : 'false';
		case 'varchar':
		case 'char':
			return literal(words(column, n, lang, type.length));
		case 'text':
			return literal(words(column, n, lang, undefined));
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
			return null;
	}
}

function context(schema: Schema, tables: readonly Table[], lang: SampleLang): Context {
	const ids = new Set(tables.map((table) => table.id));
	const relations = schema.relations.filter((relation) => ids.has(relation.fromTable) && ids.has(relation.toTable));
	const links = new Map<string, Link>();
	for (const relation of relations) {
		relation.fromColumns.forEach((columnId, index) => {
			const key = `${relation.fromTable}:${columnId}`;
			if (!links.has(key)) links.set(key, { relation, index });
		});
	}
	return { lang, tables: new Map(tables.map((table) => [table.id, table])), links, cyclic: new Set(dropOrder(tables, relations).cyclic.map((relation) => relation.id)), skipped: new Set() };
}

function cell(ctx: Context, table: Table, column: Column, n: number, trail = new Set<string>()): Cell {
	const mark = `${table.id}:${column.id}:${n}`;
	if (trail.has(mark)) return null;
	trail.add(mark);
	try {
		const link = ctx.links.get(`${table.id}:${column.id}`);
		if (link) {
			const parent = ctx.tables.get(link.relation.toTable);
			const target = parent?.columns.find((c) => c.id === link.relation.toColumns[link.index]);
			if (!parent || !target || ctx.cyclic.has(link.relation.id) || ctx.skipped.has(parent.id)) return null;
			if (parent.id === table.id) return n === 1 && column.nullable ? null : cell(ctx, parent, target, 1, trail);
			return cell(ctx, parent, target, n, trail);
		}
		return plain(column, n, table.primaryKey.includes(column.id) || isUnique(table, column.id), ctx.lang);
	} finally {
		trail.delete(mark);
	}
}

function inserted(table: Table): Column[] | null {
	const columns: Column[] = [];
	for (const column of table.columns) {
		const key = table.primaryKey.includes(column.id);
		const kind = column.default.kind;
		if (kind === 'computed') continue;
		if (!key && (kind === 'autoincrement' || kind === 'now' || kind === 'uuid' || kind === 'expression')) continue;
		if (column.type.kind === 'raw') {
			if (!key && (column.nullable || kind !== 'none')) continue;
			return null;
		}
		columns.push(column);
	}
	return columns;
}

function sequence(table: Table, column: Column): string {
	const body = `PERFORM setval(pg_get_serial_sequence(${literal(q(table.name))}, ${literal(column.name)}), ${SAMPLE_ROWS});`;
	let tag = 'sf';
	while (body.includes(`$${tag}$`)) tag += 'x';
	return `DO $${tag}$ BEGIN ${body} END $${tag}$;`;
}

function statements(ctx: Context, table: Table): string | null {
	const columns = inserted(table);
	if (!columns) return null;
	const rows: Cell[][] = [];
	for (let n = 1; n <= SAMPLE_ROWS; n++) {
		const row = columns.map((column) => cell(ctx, table, column, n));
		if (row.some((value, i) => value === null && columns[i]?.nullable === false)) return null;
		rows.push(row);
	}
	const identity = columns.filter((column) => column.default.kind === 'autoincrement');
	const target = q(table.name);
	const lines: string[] = [];
	if (columns.length === 0) {
		for (let n = 1; n <= SAMPLE_ROWS; n++) lines.push(`INSERT INTO ${target} DEFAULT VALUES;`);
		return lines.join('\n');
	}
	const head = `INSERT INTO ${target} (${columns.map((column) => q(column.name)).join(', ')})${identity.length > 0 ? ' OVERRIDING SYSTEM VALUE' : ''} VALUES`;
	lines.push(`${head}\n${rows.map((row) => `  (${row.map((value) => value ?? 'NULL').join(', ')})`).join(',\n')};`);
	for (const column of identity) lines.push(sequence(table, column));
	return lines.join('\n');
}

export function sampleValue(schema: Schema, table: Table, column: Column, n: number, lang: SampleLang): string {
	return cell(context(schema, schema.tables, lang), table, column, n) ?? 'NULL';
}

export function sampleSql(schema: Schema, tableIds: readonly string[] | null, lang: SampleLang): SampleResult {
	const wanted = new Set(tableIds ?? schema.tables.map((table) => table.id));
	if (tableIds) {
		const pending = [...wanted];
		for (let id = pending.pop(); id !== undefined; id = pending.pop()) {
			for (const relation of schema.relations) {
				if (relation.fromTable === id && !wanted.has(relation.toTable)) {
					wanted.add(relation.toTable);
					pending.push(relation.toTable);
				}
			}
		}
	}
	const tables = schema.tables.filter((table) => wanted.has(table.id));
	const ctx = context(schema, tables, lang);
	const relations = schema.relations.filter((relation) => wanted.has(relation.fromTable) && wanted.has(relation.toTable));
	const blocks: string[] = [];
	const skipped: string[] = [];
	for (const table of dropOrder(tables, relations).order.reverse()) {
		const sql = statements(ctx, table);
		if (sql === null) {
			ctx.skipped.add(table.id);
			skipped.push(table.name);
		} else blocks.push(sql);
	}
	return { sql: blocks.join('\n\n'), skipped };
}
