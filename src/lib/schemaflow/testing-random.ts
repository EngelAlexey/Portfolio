import { createId } from './model/ids';
import {
	addColumn,
	addIndex,
	addTable,
	connectColumns,
	connectWithNewColumns,
	convertToJunction,
	createJunction,
	deleteColumn,
	deleteRelation,
	duplicateTable,
	referencedKey,
	renameTable,
	sameType,
	setOneToOne,
	setPrimaryKey,
	togglePrimaryKey,
	toggleUnique,
	updateColumn,
	updateRelation
} from './model/ops';
import { ACTIONS, emptySchema, type Action, type Column, type DefaultValue, type LogicalType, type Schema, type Table } from './model/types';

export type Family = 'plausible' | 'hostile' | 'checks' | 'session';

export function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export interface Dice {
	chance(p: number): boolean;
	pick<T>(list: readonly T[]): T;
	int(lo: number, hi: number): number;
	shuffle<T>(list: readonly T[]): T[];
}

export function dice(seed: number): Dice {
	const r = rng(seed);
	const api: Dice = {
		chance: (p) => r() < p,
		pick: (list) => list[Math.floor(r() * list.length)] as never,
		int: (lo, hi) => lo + Math.floor(r() * (hi - lo + 1)),
		shuffle: (list) => {
			const copy = [...list];
			for (let i = copy.length - 1; i > 0; i--) {
				const j = Math.floor(r() * (i + 1));
				[copy[i], copy[j]] = [copy[j] as never, copy[i] as never];
			}
			return copy;
		}
	};
	return api;
}

const mapTable = (schema: Schema, tableId: string, fn: (table: Table) => Table): Schema => ({ ...schema, tables: schema.tables.map((table) => (table.id === tableId ? fn(table) : table)) });
const find = (schema: Schema, tableId: string): Table => schema.tables.find((table) => table.id === tableId) as Table;
const addUniqueSet = (schema: Schema, tableId: string, columns: string[]): Schema => mapTable(schema, tableId, (table) => ({ ...table, uniques: [...table.uniques, { id: createId(), columns }] }));

const HOSTILE_TABLES = ['users', 'orders', 'items', 'group', 'select', 'User Account', "o'brien", 'a"b', 'ñandú', 'Mixed', 'logs', 'events', 'tags', 'notes', 'order', 'table', 'line_items', 'customers', 'x y', '日本語', 'with.dot', 'ünïcödé'];
const HOSTILE_COLUMNS = ['name', 'email', 'title', 'status', 'type', 'created_at', 'value', 'user', 'order', 'group', 'from', 'Date', 'x y', 'ñ', 'amount', 'code', 'description', 'url', 'phone', 'active', 'notes', 'qty', 'price', 'role', 'photo', 'select', 'a"b', "it's"];
const KINDS: string[] = [
	...Array(5).fill('text'),
	...Array(5).fill('varchar'),
	...Array(4).fill('int'),
	...Array(2).fill('bigint'),
	'smallint',
	...Array(3).fill('boolean'),
	...Array(3).fill('timestamptz'),
	'timestamp',
	...Array(2).fill('date'),
	'time',
	...Array(2).fill('decimal'),
	'real',
	'double',
	...Array(2).fill('uuid'),
	'json',
	'binary',
	'char',
	...Array(2).fill('raw')
];
const RAW = ['inet', 'cidr', 'tsvector', 'tsquery', 'point', 'box', 'circle', 'money', 'interval', 'xml', 'macaddr', 'int4range', 'daterange', 'jsonb', 'text[]', 'integer[]', 'bit(3)', 'varbit', 'oid'];
const LONG = (word: string, times: number) => `${word}_`.repeat(times).slice(0, -1);
const EXPRESSIONS: Record<string, string[]> = { text: ["'x'", "'a' || 'b'"], varchar: ["'x'"], int: ['0', '7'], bigint: ['0'], smallint: ['1'], boolean: ['true'], decimal: ['0'], timestamptz: ['now()'], date: ['CURRENT_DATE'] };

function randomType(d: Dice): LogicalType {
	const kind = d.pick(KINDS);
	if (kind === 'varchar') return { kind: 'varchar', length: d.pick([1, 2, 3, 10, 50, 255]) };
	if (kind === 'char') return { kind: 'char', length: d.pick([1, 2, 8]) };
	if (kind === 'decimal') {
		const precision = d.int(1, 18);
		return { kind: 'decimal', precision, scale: d.int(0, Math.min(precision, 6)) };
	}
	if (kind === 'raw') return { kind: 'raw', dialect: 'postgres', sql: d.pick(RAW) };
	return { kind } as LogicalType;
}

function randomDefault(d: Dice, type: LogicalType): DefaultValue {
	if (d.chance(0.55)) return { kind: 'none' };
	if (d.chance(0.1) && EXPRESSIONS[type.kind]) return { kind: 'expression', dialect: 'postgres', sql: d.pick(EXPRESSIONS[type.kind] as string[]) };
	switch (type.kind) {
		case 'smallint':
		case 'int':
		case 'bigint':
			return d.chance(0.2) ? { kind: 'autoincrement' } : { kind: 'literal', value: d.int(0, 100) };
		case 'boolean':
			return { kind: 'literal', value: d.chance(0.5) };
		case 'text':
			return { kind: 'literal', value: 'x' };
		case 'varchar':
		case 'char':
			return { kind: 'literal', value: 'x'.repeat(Math.min(type.length ?? 1, 3)) };
		case 'timestamp':
		case 'timestamptz':
			return { kind: 'now' };
		case 'date':
			return { kind: 'literal', value: '2026-01-01' };
		case 'uuid':
			return { kind: 'uuid' };
		case 'decimal':
			return { kind: 'literal', value: 0 };
		default:
			return { kind: 'none' };
	}
}

const orderable = (column: Column): boolean => !['json', 'binary', 'raw'].includes(column.type.kind);

function hostile(seed: number): Schema {
	const d = dice(seed);
	let schema = emptySchema('hostile');
	const total = d.int(2, 8);
	const withEnum = d.chance(0.3);
	const withDomain = d.chance(0.15);
	const enumName = d.pick(['mood', 'Order Status', 'estado']);
	const extras: Schema['extras'] = [];
	if (withEnum) extras.push({ id: createId(), dialect: 'postgres', sql: `CREATE TYPE ${/^[a-z_]+$/.test(enumName) ? enumName : `"${enumName}"`} AS ENUM ('sad', 'ok', 'happy')`, placement: 'before' });
	if (withDomain) extras.push({ id: createId(), dialect: 'postgres', sql: 'CREATE DOMAIN pos_int AS integer CHECK (VALUE > 0)', placement: 'before' });
	schema = { ...schema, extras };
	const enumType = (): LogicalType => ({ kind: 'raw', dialect: 'postgres', sql: /^[a-z_]+$/.test(enumName) ? enumName : `"${enumName}"` });

	for (let i = 0; i < total; i++) {
		const name = d.chance(0.06) ? `t${i}_${LONG(d.pick(['very_long_table_name', 'another_extremely_long_name']), d.int(2, 2))}` : d.pick(HOSTILE_TABLES);
		const added = addTable(schema, { name, x: i * 300, y: 0 });
		schema = added.schema;
		const tableId = added.tableId;
		const idColumn = find(schema, tableId).columns[0] as Column;
		const shape = d.int(0, 99);
		if (shape < 30) {
			const type = d.pick<LogicalType>([{ kind: 'int' }, { kind: 'smallint' }, { kind: 'uuid' }, { kind: 'bigint' }]);
			schema = updateColumn(schema, tableId, idColumn.id, { type, default: type.kind === 'uuid' ? { kind: 'uuid' } : { kind: 'autoincrement' } });
		} else if (shape < 45) {
			const type = d.pick<LogicalType>([{ kind: 'varchar', length: d.pick([2, 5, 20, 60]) }, { kind: 'char', length: 3 }, { kind: 'text' }, { kind: 'date' }, { kind: 'decimal', precision: d.pick([2, 8]), scale: d.pick([0, 2]) }]);
			schema = updateColumn(schema, tableId, idColumn.id, { type, default: { kind: 'none' } });
		} else if (shape < 60) {
			const type = d.pick(['int', 'uuid', 'date', 'timestamptz', 'varchar', 'boolean'] as const);
			const extra = addColumn(schema, tableId, { name: 'part', type: type === 'varchar' ? { kind: 'varchar', length: 12 } : { kind: type } });
			schema = setPrimaryKey(extra.schema, tableId, [idColumn.id, extra.columnId]);
		} else if (shape < 70) {
			schema = setPrimaryKey(schema, tableId, []);
			if (d.chance(0.6)) schema = toggleUnique(schema, tableId, idColumn.id);
		} else if (shape < 73) {
			schema = deleteColumn(setPrimaryKey(schema, tableId, []), tableId, idColumn.id);
			continue;
		}
		const howMany = d.int(1, 5);
		for (let c = 0; c < howMany; c++) {
			const type = withEnum && d.chance(0.12) ? enumType() : withDomain && d.chance(0.1) ? ({ kind: 'raw', dialect: 'postgres', sql: 'pos_int' } as LogicalType) : randomType(d);
			const columnName = d.chance(0.05) ? `c${c}_${LONG('long_column_name', d.int(5, 8))}` : d.pick(HOSTILE_COLUMNS);
			const result = addColumn(schema, tableId, { name: columnName, type });
			schema = updateColumn(result.schema, tableId, result.columnId, { nullable: d.chance(0.5), default: randomDefault(d, type) });
			if (d.chance(0.12) && orderable(find(schema, tableId).columns.find((column) => column.id === result.columnId) as Column)) schema = toggleUnique(schema, tableId, result.columnId);
		}
		if (d.chance(0.04) && find(schema, tableId).columns.length > 0) {
			const computed = addColumn(schema, tableId, { name: 'computed_value', type: { kind: 'int' } });
			schema = updateColumn(computed.schema, tableId, computed.columnId, { default: { kind: 'computed', dialect: 'postgres', sql: 'GENERATED ALWAYS AS (1 + 1) STORED' }, nullable: true });
		}
		const table = find(schema, tableId);
		const plain = table.columns.filter((column) => orderable(column) && column.default.kind !== 'computed');
		if (plain.length >= 2 && d.chance(0.12)) schema = addUniqueSet(schema, tableId, d.shuffle(plain).slice(0, d.int(2, Math.min(3, plain.length))).map((column) => column.id));
		if (plain.length >= 1 && d.chance(0.08)) schema = addIndex(schema, tableId, d.shuffle(plain).slice(0, d.int(1, Math.min(2, plain.length))).map((column) => column.id), true);
	}

	for (const table of [...schema.tables]) {
		const relations = d.pick([0, 0, 1, 1, 2]);
		for (let k = 0; k < relations; k++) {
			const parents = schema.tables.filter((candidate) => referencedKey(candidate).length > 0 && (candidate.id !== table.id || d.chance(0.15)));
			const parent = d.pick(parents.length > 0 ? parents : [table]);
			if (referencedKey(parent).length === 0) continue;
			const made = connectWithNewColumns(schema, table.id, parent.id);
			if (!made.relationId) continue;
			schema = made.schema;
			const relation = schema.relations.find((candidate) => candidate.id === made.relationId);
			const parentTable = find(schema, parent.id);
			relation?.toColumns.forEach((targetId, index) => {
				const target = parentTable.columns.find((column) => column.id === targetId);
				const childId = made.columnIds[index];
				if (!target || !childId) return;
				if ((target.type.kind === 'varchar' || target.type.kind === 'char') && (target.type.length ?? 1) > 1 && d.chance(0.35)) {
					schema = updateColumn(schema, table.id, childId, { type: { kind: target.type.kind, length: d.int(1, target.type.length ?? 1) } });
				} else if (target.type.kind === 'decimal' && d.chance(0.25)) {
					const precision = d.int(1, target.type.precision ?? 18);
					schema = updateColumn(schema, table.id, childId, { type: { kind: 'decimal', precision, scale: d.int(0, Math.min(precision, target.type.scale ?? 0)) } });
				}
			});
			if (d.chance(0.5)) for (const id of made.columnIds) schema = updateColumn(schema, table.id, id, { nullable: true });
			schema = updateRelation(schema, made.relationId, { onDelete: d.pick(ACTIONS), onUpdate: d.pick(ACTIONS) });
		}
	}
	return schema;
}

const PLAUSIBLE_TABLES = ['users', 'products', 'categories', 'orders', 'comments', 'invoices', 'payments', 'tags', 'posts', 'addresses', 'reviews', 'projects', 'tasks', 'customers', 'employees', 'courses'];
const CHIPS: { name: string; type: LogicalType; unique?: boolean }[] = [
	{ name: 'name', type: { kind: 'varchar', length: 255 } },
	{ name: 'title', type: { kind: 'varchar', length: 255 } },
	{ name: 'email', type: { kind: 'varchar', length: 255 }, unique: true },
	{ name: 'slug', type: { kind: 'varchar', length: 100 }, unique: true },
	{ name: 'status', type: { kind: 'varchar', length: 30 } },
	{ name: 'description', type: { kind: 'text' } },
	{ name: 'quantity', type: { kind: 'int' } },
	{ name: 'price', type: { kind: 'decimal', precision: 10, scale: 2 } },
	{ name: 'active', type: { kind: 'boolean' } },
	{ name: 'birth_date', type: { kind: 'date' } },
	{ name: 'published_at', type: { kind: 'timestamptz' } },
	{ name: 'external_id', type: { kind: 'uuid' } },
	{ name: 'metadata', type: { kind: 'json' } },
	{ name: 'phone', type: { kind: 'varchar', length: 30 } },
	{ name: 'url', type: { kind: 'varchar', length: 255 } },
	{ name: 'notes', type: { kind: 'text' } }
];

function plausible(seed: number, count?: number): Schema {
	const d = dice(seed);
	const names = d.shuffle(PLAUSIBLE_TABLES);
	let schema = emptySchema('plausible');
	const total = count ?? d.int(3, 8);
	for (let i = 0; i < total; i++) {
		const added = addTable(schema, { name: names[i] ?? `t${i}`, x: i * 300, y: 0 });
		schema = added.schema;
		const tableId = added.tableId;
		const idColumn = find(schema, tableId).columns[0] as Column;
		if (d.chance(0.2)) schema = updateColumn(schema, tableId, idColumn.id, { type: { kind: 'uuid' }, default: { kind: 'uuid' } });
		else if (d.chance(0.12)) schema = updateColumn(schema, tableId, idColumn.id, { type: { kind: 'int' } });
		for (const chip of d.shuffle(CHIPS).slice(0, d.int(2, 6))) {
			const result = addColumn(schema, tableId, { name: chip.name, type: chip.type });
			schema = result.schema;
			if (d.chance(0.3)) schema = updateColumn(schema, tableId, result.columnId, { nullable: true });
			if (chip.unique && d.chance(0.6)) schema = toggleUnique(schema, tableId, result.columnId);
		}
		if (d.chance(0.35)) {
			for (const name of ['created_at', 'updated_at']) {
				const result = addColumn(schema, tableId, { name, type: { kind: 'timestamptz' } });
				schema = updateColumn(result.schema, tableId, result.columnId, { default: { kind: 'now' } });
			}
		}
	}

	const weights: [Action, number][] = [['NO ACTION', 0.55], ['CASCADE', 0.25], ['SET NULL', 0.12], ['RESTRICT', 0.08]];
	const action = (): Action => {
		let x = d.int(0, 999) / 1000;
		for (const [name, weight] of weights) {
			if (x < weight) return name;
			x -= weight;
		}
		return 'NO ACTION';
	};
	const tables = [...schema.tables];
	tables.forEach((table, index) => {
		const count = index === 0 ? 0 : d.chance(0.8) ? (d.chance(0.3) ? 2 : 1) : 0;
		for (let k = 0; k < count; k++) {
			const parent = d.pick(tables.slice(0, index));
			const made = connectWithNewColumns(schema, table.id, parent.id);
			if (!made.relationId) continue;
			schema = made.schema;
			if (d.chance(0.3)) for (const id of made.columnIds) schema = updateColumn(schema, table.id, id, { nullable: true });
			schema = updateRelation(schema, made.relationId, { onDelete: action() });
		}
		if (d.chance(0.1)) {
			const made = connectWithNewColumns(schema, table.id, table.id);
			if (made.relationId) {
				schema = made.schema;
				for (const id of made.columnIds) schema = updateColumn(schema, table.id, id, { nullable: true, name: 'parent_id' });
				schema = updateRelation(schema, made.relationId, { onDelete: 'SET NULL' });
			}
		}
	});
	if (d.chance(0.3) && schema.tables.length >= 2) {
		const a = d.pick(schema.tables);
		const b = d.pick(schema.tables.filter((candidate) => candidate.id !== a.id));
		schema = createJunction(schema, a.id, b.id).schema;
	}
	return schema;
}

const NUMERIC = new Set(['smallint', 'int', 'bigint', 'decimal', 'real', 'double']);
const TEMPORAL = new Set(['date', 'timestamp', 'timestamptz']);

function withChecks(seed: number): Schema {
	const d = dice(seed + 7919);
	const schema = plausible(seed);
	const extras: Schema['extras'] = [...schema.extras];
	const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
	for (const table of schema.tables) {
		const linked = new Set(schema.relations.filter((relation) => relation.fromTable === table.id).flatMap((relation) => relation.fromColumns));
		const free = table.columns.filter((column) => !table.primaryKey.includes(column.id) && !linked.has(column.id) && column.default.kind !== 'autoincrement' && column.default.kind !== 'computed');
		const numbers = free.filter((column) => NUMERIC.has(column.type.kind));
		const texts = free.filter((column) => column.type.kind === 'varchar' || column.type.kind === 'text');
		const dates = free.filter((column) => TEMPORAL.has(column.type.kind));
		const predicates: string[] = [];
		const number = numbers.length > 0 ? d.pick(numbers) : null;
		if (number && d.chance(0.7)) {
			const column = quote(number.name);
			predicates.push(
				d.pick([
					`${column} >= ${d.pick([0, 18, 100, 1000])}`,
					`${column} > ${d.pick([0, 50, 500])}`,
					`${column} <= ${d.pick([1000000, 100000])}`,
					`${column} BETWEEN ${d.pick([1, 100])} AND ${d.pick([5000, 99999])}`,
					`${column} <> ${d.pick([10, 20, 30])}`,
					`${column} IN (${d.pick(['1, 2, 3', '5, 10, 15', '100, 200, 300'])})`,
					`${column} > 0 AND ${column} < ${d.pick([500, 100000])}`,
					`${column} % 2 = ${d.pick([0, 1])} OR ${column} > 1000`,
					`abs(${column}) < ${d.pick([50, 5000])}`
				])
			);
		}
		if (numbers.length >= 2 && d.chance(0.5)) {
			const [low, high] = d.shuffle(numbers);
			predicates.push(`${quote((low as Column).name)} ${d.pick(['<=', '<', '<>'])} ${quote((high as Column).name)}`);
		}
		const text = texts.length > 0 ? d.pick(texts) : null;
		if (text && d.chance(0.55)) {
			const column = quote(text.name);
			predicates.push(
				d.pick([
					`${column} IN ('open', 'closed', 'pending')`,
					`${column} <> 'forbidden'`,
					`char_length(${column}) >= 1`,
					`${column} = ANY (ARRAY['a', 'b', 'c'])`,
					`char_length(${column}) BETWEEN 1 AND 100`,
					`${column} ~* '^[a-z0-9._@:/ -]+$'`,
					`lower(${column}) = ${column} OR ${column} LIKE 'A%'`,
					`${column} LIKE '%x%'`,
					`${column} <> '' AND ${column} IS NOT NULL`,
					`length(trim(${column})) > 2`
				])
			);
		}
		if (dates.length >= 2 && d.chance(0.5)) {
			const [early, late] = d.shuffle(dates);
			predicates.push(`${quote((late as Column).name)} ${d.pick(['>=', '>'])} ${quote((early as Column).name)}`);
		}
		if (dates.length >= 1 && d.chance(0.3)) predicates.push(`${quote((d.pick(dates) as Column).name)} > '2000-01-01'`);
		if (free.length >= 2 && d.chance(0.25)) {
			const [first, second] = d.shuffle(free);
			predicates.push(`(${quote((first as Column).name)} IS NOT NULL OR ${quote((second as Column).name)} IS NOT NULL)`);
		}
		for (const predicate of predicates) extras.push({ id: createId(), dialect: 'postgres', sql: `ALTER TABLE ${quote(table.name)} ADD CHECK (${predicate})`, placement: 'after' });
	}
	return { ...schema, extras };
}

const MOVES = [
	...Array(3).fill('table'),
	...Array(6).fill('column'),
	...Array(2).fill('type'),
	...Array(2).fill('nullable'),
	...Array(2).fill('default'),
	'primary',
	...Array(2).fill('unique'),
	'index',
	...Array(4).fill('link'),
	...Array(2).fill('existing'),
	'one',
	'junction',
	'convert',
	'copy',
	'dropColumn',
	'dropTable',
	'dropRelation',
	...Array(2).fill('actions'),
	'rename'
];

function session(seed: number): Schema {
	const d = dice(seed + 31337);
	let schema = emptySchema('session');
	const names = d.shuffle([...PLAUSIBLE_TABLES, 'stocks', 'rooms', 'guests', 'beds']);
	const targeted = (tableId: string, columnId: string) => schema.relations.some((relation) => relation.toTable === tableId && relation.toColumns.includes(columnId));
	const linked = (tableId: string, columnId: string) => schema.relations.some((relation) => (relation.fromTable === tableId && relation.fromColumns.includes(columnId)) || (relation.toTable === tableId && relation.toColumns.includes(columnId)));
	for (let step = d.int(12, 70); step > 0; step--) {
		const table = schema.tables.length > 0 ? d.pick(schema.tables) : null;
		const column = table && table.columns.length > 0 ? d.pick(table.columns) : null;
		const other = schema.tables.length > 0 ? d.pick(schema.tables) : null;
		const relation = schema.relations.length > 0 ? d.pick(schema.relations) : null;
		const move = d.pick(MOVES);
		if (move === 'table' || !table) {
			const name = names.pop();
			if (name) schema = addTable(schema, { name, x: schema.tables.length * 280, y: 0 }).schema;
		} else if (move === 'column') {
			const added = addColumn(schema, table.id, { name: d.chance(0.25) ? d.pick(HOSTILE_COLUMNS) : d.pick(CHIPS).name, type: randomType(d) });
			schema = updateColumn(added.schema, table.id, added.columnId, { nullable: d.chance(0.5) });
		} else if (move === 'type' && column && (!linked(table.id, column.id) || targeted(table.id, column.id))) {
			schema = updateColumn(schema, table.id, column.id, { type: randomType(d) });
		} else if (move === 'nullable' && column) {
			schema = updateColumn(schema, table.id, column.id, { nullable: d.chance(0.5) });
		} else if (move === 'default' && column && !linked(table.id, column.id)) {
			schema = updateColumn(schema, table.id, column.id, { default: randomDefault(d, column.type) });
		} else if (move === 'primary' && column && !targeted(table.id, column.id)) {
			schema = togglePrimaryKey(schema, table.id, column.id);
		} else if (move === 'unique' && column && !targeted(table.id, column.id) && orderable(column)) {
			schema = toggleUnique(schema, table.id, column.id);
		} else if (move === 'index' && column && orderable(column)) {
			schema = addIndex(schema, table.id, [column.id], d.chance(0.3));
		} else if (move === 'link' && other) {
			const made = connectWithNewColumns(schema, table.id, other.id);
			if (made.relationId) {
				schema = updateRelation(made.schema, made.relationId, { onDelete: d.pick(ACTIONS), onUpdate: d.pick(ACTIONS) });
				if (d.chance(0.4)) for (const id of made.columnIds) schema = updateColumn(schema, table.id, id, { nullable: true });
			}
		} else if (move === 'existing' && other && other.id !== table.id) {
			const key = referencedKey(other);
			const target = key.length === 1 ? other.columns.find((candidate) => candidate.id === key[0]) : undefined;
			const source = target ? table.columns.find((candidate) => sameType(candidate.type, target.type) && !linked(table.id, candidate.id) && !table.primaryKey.includes(candidate.id)) : undefined;
			if (target && source) schema = connectColumns(schema, { fromTable: table.id, fromColumns: [source.id], toTable: other.id, toColumns: [target.id], onDelete: d.pick(ACTIONS) }).schema;
		} else if (move === 'one' && relation) {
			schema = setOneToOne(schema, relation.id, d.chance(0.7));
		} else if (move === 'junction' && other && other.id !== table.id) {
			schema = createJunction(schema, table.id, other.id).schema;
		} else if (move === 'convert' && relation) {
			schema = convertToJunction(schema, relation.id).schema;
		} else if (move === 'copy') {
			schema = duplicateTable(schema, table.id).schema;
		} else if (move === 'dropColumn' && column) {
			schema = deleteColumn(schema, table.id, column.id);
		} else if (move === 'dropTable') {
			schema = { ...schema, tables: schema.tables.filter((candidate) => candidate.id !== table.id), relations: schema.relations.filter((candidate) => candidate.fromTable !== table.id && candidate.toTable !== table.id) };
		} else if (move === 'dropRelation' && relation) {
			schema = deleteRelation(schema, relation.id);
		} else if (move === 'actions' && relation) {
			schema = updateRelation(schema, relation.id, { onDelete: d.pick(ACTIONS), onUpdate: d.pick(ACTIONS) });
		} else if (move === 'rename') {
			const name = d.pick([...PLAUSIBLE_TABLES, ...HOSTILE_TABLES]);
			if (!schema.tables.some((candidate) => candidate.name === name)) schema = renameTable(schema, table.id, name);
		}
	}
	return schema;
}

export function randomSchema(family: Family, seed: number, count?: number): Schema {
	if (family === 'session') return session(seed);
	if (family === 'hostile') return hostile(seed);
	if (family === 'checks') return withChecks(seed);
	return plausible(seed, count);
}
