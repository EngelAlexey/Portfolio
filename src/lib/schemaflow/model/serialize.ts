import {
	ACTIONS,
	COLORS,
	DIALECTS,
	LIMITS,
	type Action,
	type Area,
	type Column,
	type DefaultValue,
	type DialectId,
	type Extra,
	type Index,
	type LogicalType,
	type Note,
	type Relation,
	type Schema,
	type Table,
	type UniqueConstraint
} from './types';

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number): string | undefined => (typeof v === 'string' ? v.slice(0, max) : undefined);
const id = (v: unknown): string | undefined => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : undefined);
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(-1e6, Math.min(1e6, Math.round(v))) : fallback);
const size = (v: unknown): number | undefined => (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 1e6 ? v : undefined);
const dialect = (v: unknown): DialectId | undefined => (DIALECTS.includes(v as DialectId) ? (v as DialectId) : undefined);
const action = (v: unknown): Action => (ACTIONS.includes(v as Action) ? (v as Action) : 'NO ACTION');
const color = (v: unknown): string | undefined => (COLORS.includes(v as (typeof COLORS)[number]) ? (v as string) : undefined);

const SIMPLE = new Set(['uuid', 'smallint', 'int', 'bigint', 'real', 'double', 'boolean', 'text', 'date', 'time', 'timestamp', 'timestamptz', 'json', 'binary']);

function readType(v: unknown): LogicalType | null {
	if (!isObj(v) || typeof v.kind !== 'string') return null;
	if (SIMPLE.has(v.kind)) return { kind: v.kind } as LogicalType;
	if (v.kind === 'varchar' || v.kind === 'char') {
		const length = size(v.length);
		return length === undefined ? { kind: v.kind } : { kind: v.kind, length };
	}
	if (v.kind === 'decimal') {
		const precision = size(v.precision);
		if (precision === undefined) return { kind: 'decimal' };
		const scale = typeof v.scale === 'number' && Number.isInteger(v.scale) && v.scale >= 0 && v.scale <= precision ? v.scale : 0;
		return { kind: 'decimal', precision, scale };
	}
	if (v.kind === 'raw') {
		const d = dialect(v.dialect);
		const sql = text(v.sql, 200);
		return d && sql !== undefined ? { kind: 'raw', dialect: d, sql } : null;
	}
	return null;
}

function readDefault(v: unknown): DefaultValue {
	if (!isObj(v)) return { kind: 'none' };
	switch (v.kind) {
		case 'now':
		case 'uuid':
		case 'autoincrement':
			return { kind: v.kind };
		case 'literal': {
			const value = v.value;
			if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return { kind: 'literal', value };
			if (typeof value === 'string') return { kind: 'literal', value: value.slice(0, 1000) };
			return { kind: 'none' };
		}
		case 'expression':
		case 'computed': {
			const d = dialect(v.dialect);
			const sql = text(v.sql, 2000);
			return d && sql ? { kind: v.kind, dialect: d, sql } : { kind: 'none' };
		}
		default:
			return { kind: 'none' };
	}
}

function readIds(v: unknown, allowed: ReadonlySet<string>): string[] {
	if (!Array.isArray(v)) return [];
	const out: string[] = [];
	for (const item of v) {
		const value = id(item);
		if (value && allowed.has(value) && !out.includes(value)) out.push(value);
	}
	return out;
}

function readTable(v: unknown, seen: Set<string>): Table | null {
	if (!isObj(v)) return null;
	const tableId = id(v.id);
	const name = text(v.name, LIMITS.name)?.trim();
	if (!tableId || !name || seen.has(tableId) || !Array.isArray(v.columns)) return null;
	const columns: Column[] = [];
	for (const raw of v.columns.slice(0, LIMITS.columns)) {
		if (!isObj(raw)) continue;
		const columnId = id(raw.id);
		const columnName = text(raw.name, LIMITS.name)?.trim();
		const type = readType(raw.type);
		if (!columnId || !columnName || !type || seen.has(columnId)) continue;
		seen.add(columnId);
		const column: Column = { id: columnId, name: columnName, type, nullable: raw.nullable !== false, default: readDefault(raw.default) };
		const comment = text(raw.comment, 1000);
		if (comment) column.comment = comment;
		columns.push(column);
	}
	seen.add(tableId);
	const columnIds = new Set(columns.map((c) => c.id));
	const primaryKey = readIds(v.primaryKey, columnIds);
	for (const column of columns) if (primaryKey.includes(column.id)) column.nullable = false;
	const uniques: UniqueConstraint[] = Array.isArray(v.uniques)
		? v.uniques.flatMap((u): UniqueConstraint[] => {
				if (!isObj(u)) return [];
				const cols = readIds(u.columns, columnIds);
				const uid = id(u.id);
				if (cols.length === 0 || !uid) return [];
				const name = text(u.name, LIMITS.name);
				return [name ? { id: uid, name, columns: cols } : { id: uid, columns: cols }];
			})
		: [];
	const indexes: Index[] = Array.isArray(v.indexes)
		? v.indexes.flatMap((i): Index[] => {
				if (!isObj(i)) return [];
				const cols = readIds(i.columns, columnIds);
				const iid = id(i.id);
				if (cols.length === 0 || !iid) return [];
				const name = text(i.name, LIMITS.name);
				return [name ? { id: iid, name, columns: cols, unique: i.unique === true } : { id: iid, columns: cols, unique: i.unique === true }];
			})
		: [];
	const table: Table = { id: tableId, name, x: num(v.x), y: num(v.y), columns, primaryKey, uniques, indexes };
	const tableColor = color(v.color);
	if (tableColor) table.color = tableColor;
	const comment = text(v.comment, 1000);
	if (comment) table.comment = comment;
	const pkName = text(v.primaryKeyName, LIMITS.name);
	if (pkName) table.primaryKeyName = pkName;
	return table;
}

export function readSchema(value: unknown): Schema | null {
	if (!isObj(value) || value.version !== 1 || !Array.isArray(value.tables)) return null;
	const seen = new Set<string>();
	const tables: Table[] = [];
	for (const raw of value.tables.slice(0, LIMITS.tables)) {
		const table = readTable(raw, seen);
		if (table) tables.push(table);
	}
	const byId = new Map(tables.map((t) => [t.id, new Set(t.columns.map((c) => c.id))]));
	const relations: Relation[] = [];
	if (Array.isArray(value.relations)) {
		for (const raw of value.relations.slice(0, 2000)) {
			if (!isObj(raw)) continue;
			const rid = id(raw.id);
			const fromTable = id(raw.fromTable);
			const toTable = id(raw.toTable);
			const fromCols = fromTable ? byId.get(fromTable) : undefined;
			const toCols = toTable ? byId.get(toTable) : undefined;
			if (!rid || !fromTable || !toTable || !fromCols || !toCols) continue;
			const fromColumns = readIds(raw.fromColumns, fromCols);
			const toColumns = readIds(raw.toColumns, toCols);
			if (fromColumns.length === 0 || fromColumns.length !== toColumns.length) continue;
			const relation: Relation = { id: rid, fromTable, fromColumns, toTable, toColumns, onDelete: action(raw.onDelete), onUpdate: action(raw.onUpdate) };
			const name = text(raw.name, LIMITS.name);
			if (name) relation.name = name;
			relations.push(relation);
		}
	}
	const notes: Note[] = Array.isArray(value.notes)
		? value.notes.slice(0, LIMITS.notes).flatMap((n): Note[] => {
				if (!isObj(n) || !id(n.id)) return [];
				return [{ id: id(n.id) ?? '', x: num(n.x), y: num(n.y), w: Math.max(120, num(n.w, 220)), h: Math.max(60, num(n.h, 120)), text: text(n.text, LIMITS.noteText) ?? '', color: color(n.color) ?? 'amber' }];
			})
		: [];
	const areas: Area[] = Array.isArray(value.areas)
		? value.areas.slice(0, LIMITS.areas).flatMap((a): Area[] => {
				if (!isObj(a) || !id(a.id)) return [];
				return [{ id: id(a.id) ?? '', x: num(a.x), y: num(a.y), w: Math.max(160, num(a.w, 400)), h: Math.max(120, num(a.h, 300)), title: text(a.title, LIMITS.name) ?? '', color: color(a.color) ?? 'blue' }];
			})
		: [];
	const extras: Extra[] = Array.isArray(value.extras)
		? value.extras.slice(0, LIMITS.extras).flatMap((e): Extra[] => {
				if (!isObj(e)) return [];
				const d = dialect(e.dialect);
				const sql = text(e.sql, LIMITS.extraSql);
				const eid = id(e.id);
				if (!d || !sql || !eid) return [];
				return [{ id: eid, dialect: d, sql, placement: e.placement === 'before' ? 'before' : 'after' }];
			})
		: [];
	return { version: 1, name: text(value.name, LIMITS.name) ?? 'schema', tables, relations, notes, areas, extras };
}
