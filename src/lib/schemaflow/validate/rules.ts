import { byteLength, MAX_IDENTIFIER } from '../dialects/names';
import { isReserved } from '../dialects/reserved';
import { INTEGER_KINDS, TEMPORAL_KINDS } from '../dialects/sql-generate';
import type { Column, DialectId, LogicalType, Relation, Schema, Table } from '../model/types';
import type { Severity } from '../parse/issues';

export const RULE_IDS = [
	'table-empty',
	'table-duplicate',
	'column-duplicate',
	'name-too-long',
	'name-reserved',
	'name-default',
	'type-foreign',
	'default-foreign',
	'default-mismatch',
	'autoincrement-multiple',
	'autoincrement-not-key',
	'pk-missing',
	'fk-target-not-unique',
	'fk-type-mismatch',
	'fk-setnull-notnull',
	'fk-setdefault',
	'fk-restrict',
	'fk-cascade-paths',
	'fk-no-index',
	'key-lob',
	'index-duplicate',
	'table-isolated',
	'mongo-actions',
	'mongo-defaults',
	'mongo-composite-pk',
	'extras-other-dialect',
	'varchar-no-length',
	'decimal-no-precision',
	'mysql-timestamp-range'
] as const;

export type RuleId = (typeof RULE_IDS)[number];

export type FixId = 'add-fk-index' | 'add-primary-key' | 'make-nullable' | 'copy-type' | 'use-varchar' | 'clear-default';

export interface DesignIssue {
	key: string;
	rule: RuleId;
	severity: Severity;
	table?: string;
	column?: string;
	relation?: string;
	params: Record<string, string | number>;
	fix?: FixId;
}

const SQL = new Set<DialectId>(['postgres', 'mysql', 'sqlserver']);
const DEFAULT_NAME = /^(nueva_tabla|new_table|columna|column)(_\d+)?$/i;
const LOB = new Set(['text', 'binary', 'json']);

function family(type: LogicalType): string {
	if (INTEGER_KINDS.has(type.kind)) return 'integer';
	if (type.kind === 'real' || type.kind === 'double') return 'float';
	if (type.kind === 'varchar' || type.kind === 'char' || type.kind === 'text') return 'string';
	if (TEMPORAL_KINDS.has(type.kind)) return `temporal:${type.kind}`;
	if (type.kind === 'raw') return `raw:${type.dialect}:${type.sql.toLowerCase()}`;
	return type.kind;
}

export function typeLabel(type: LogicalType): string {
	switch (type.kind) {
		case 'varchar':
		case 'char':
			return type.length ? `${type.kind}(${type.length})` : type.kind;
		case 'decimal':
			return type.precision === undefined ? 'decimal' : `decimal(${type.precision}, ${type.scale ?? 0})`;
		case 'raw':
			return type.sql || type.dialect;
		default:
			return type.kind;
	}
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
	if (a.length !== b.length) return false;
	const sorted = [...b].sort();
	return [...a].sort().every((v, i) => v === sorted[i]);
}

function isPrefix(prefix: readonly string[], list: readonly string[]): boolean {
	if (prefix.length > list.length) return false;
	return sameList(prefix, list.slice(0, prefix.length));
}

function keyLists(table: Table): string[][] {
	return [table.primaryKey, ...table.uniques.map((u) => u.columns), ...table.indexes.map((i) => i.columns)].filter((l) => l.length > 0);
}

function uniqueLists(table: Table): string[][] {
	return [table.primaryKey, ...table.uniques.map((u) => u.columns), ...table.indexes.filter((i) => i.unique).map((i) => i.columns)].filter((l) => l.length > 0);
}

function literalFits(column: Column, dialect: DialectId): boolean {
	if (column.default.kind !== 'literal') return true;
	const value = column.default.value;
	if (value === null) return true;
	const kind = column.type.kind;
	if (kind === 'raw') return true;
	if (kind === 'boolean') return typeof value === 'boolean' || (dialect !== 'postgres' && (value === 0 || value === 1));
	if (INTEGER_KINDS.has(kind)) return typeof value === 'number' ? Number.isInteger(value) : /^-?\d+$/.test(String(value));
	if (kind === 'decimal' || kind === 'real' || kind === 'double') return typeof value === 'number' || /^-?\d+(\.\d+)?$/.test(String(value));
	if (typeof value === 'boolean') return false;
	return true;
}

function defaultFits(column: Column): boolean {
	const kind = column.type.kind;
	switch (column.default.kind) {
		case 'now':
			return TEMPORAL_KINDS.has(kind);
		case 'uuid':
			return kind === 'uuid';
		case 'autoincrement':
			return INTEGER_KINDS.has(kind);
		default:
			return true;
	}
}

function cascades(action: Relation['onDelete']): boolean {
	return action === 'CASCADE' || action === 'SET NULL' || action === 'SET DEFAULT';
}

function cascadeProblems(schema: Schema, kind: 'onDelete' | 'onUpdate'): Set<string> {
	const flagged = new Set<string>();
	const children = new Map<string, Relation[]>();
	for (const relation of schema.relations) {
		if (!cascades(relation[kind])) continue;
		const list = children.get(relation.toTable) ?? [];
		list.push(relation);
		children.set(relation.toTable, list);
	}
	for (const start of schema.tables) {
		const seen = new Set<string>([start.id]);
		const stack: string[] = [start.id];
		const visited = new Set<string>();
		while (stack.length > 0) {
			const current = stack.pop() ?? '';
			for (const relation of children.get(current) ?? []) {
				const edge = `${relation.id}`;
				if (visited.has(edge)) continue;
				visited.add(edge);
				if (seen.has(relation.fromTable)) {
					flagged.add(relation.id);
					continue;
				}
				seen.add(relation.fromTable);
				stack.push(relation.fromTable);
			}
		}
	}
	return flagged;
}

export function analyze(schema: Schema, dialect: DialectId): DesignIssue[] {
	const out: DesignIssue[] = [];
	const sql = SQL.has(dialect);
	const push = (rule: RuleId, severity: Severity, target: Partial<Pick<DesignIssue, 'table' | 'column' | 'relation'>>, params: Record<string, string | number> = {}, fix?: FixId) => {
		const key = [rule, target.table ?? '', target.column ?? '', target.relation ?? '', params.extra ?? ''].join(':');
		out.push(fix ? { key, rule, severity, ...target, params, fix } : { key, rule, severity, ...target, params });
	};
	const tables = new Map(schema.tables.map((t) => [t.id, t]));
	const max = MAX_IDENTIFIER[dialect];

	const tableNames = new Map<string, Table>();
	for (const table of schema.tables) {
		const lower = table.name.toLowerCase();
		if (tableNames.has(lower)) push('table-duplicate', 'error', { table: table.id }, { table: table.name });
		tableNames.set(lower, table);
		if (table.columns.length === 0) push('table-empty', sql ? 'error' : 'info', { table: table.id }, { table: table.name });
		if (byteLength(table.name) > max) push('name-too-long', 'error', { table: table.id }, { name: table.name, max });
		if (sql && isReserved(dialect, table.name)) push('name-reserved', 'info', { table: table.id }, { name: table.name });
		if (DEFAULT_NAME.test(table.name)) push('name-default', 'info', { table: table.id }, { name: table.name });
		if (table.primaryKey.length === 0 && table.columns.length > 0) {
			push('pk-missing', sql ? 'warning' : 'info', { table: table.id }, { table: table.name }, 'add-primary-key');
		}
		if (dialect === 'mongodb' && table.primaryKey.length > 1) push('mongo-composite-pk', 'info', { table: table.id }, { table: table.name });

		const columnNames = new Set<string>();
		let autoincrement = 0;
		for (const column of table.columns) {
			const lower = column.name.toLowerCase();
			if (columnNames.has(lower)) push('column-duplicate', 'error', { table: table.id, column: column.id }, { table: table.name, column: column.name });
			columnNames.add(lower);
			if (sql && byteLength(column.name) > max) push('name-too-long', 'error', { table: table.id, column: column.id }, { name: column.name, max });
			if (sql && isReserved(dialect, column.name)) push('name-reserved', 'info', { table: table.id, column: column.id }, { name: column.name });
			if (DEFAULT_NAME.test(column.name)) push('name-default', 'info', { table: table.id, column: column.id }, { name: column.name });
			if (column.type.kind === 'raw' && column.type.dialect !== dialect && !(column.default.kind === 'computed' && column.type.sql === '')) {
				push('type-foreign', 'error', { table: table.id, column: column.id }, { column: column.name, type: column.type.sql, source: column.type.dialect });
			}
			const def = column.default;
			if ((def.kind === 'expression' || def.kind === 'computed') && def.dialect !== dialect) {
				push('default-foreign', dialect === 'mongodb' ? 'info' : 'error', { table: table.id, column: column.id }, { column: column.name, source: def.dialect }, 'clear-default');
			}
			if (sql && (!defaultFits(column) || !literalFits(column, dialect))) {
				push('default-mismatch', 'error', { table: table.id, column: column.id }, { column: column.name, type: typeLabel(column.type) }, 'clear-default');
			}
			if (def.kind === 'autoincrement') autoincrement++;
			if (dialect === 'mysql' && def.kind === 'autoincrement' && !keyLists(table).some((l) => l[0] === column.id)) {
				push('autoincrement-not-key', 'error', { table: table.id, column: column.id }, { column: column.name });
			}
			if ((dialect === 'mysql' || dialect === 'sqlserver') && column.type.kind === 'varchar' && column.type.length === undefined) {
				push('varchar-no-length', 'info', { table: table.id, column: column.id }, { column: column.name });
			}
			if ((dialect === 'mysql' || dialect === 'sqlserver') && column.type.kind === 'decimal' && column.type.precision === undefined) {
				push('decimal-no-precision', 'info', { table: table.id, column: column.id }, { column: column.name });
			}
		}
		if (autoincrement > 1 && (dialect === 'mysql' || dialect === 'sqlserver')) push('autoincrement-multiple', 'error', { table: table.id }, { table: table.name });

		if (dialect === 'mysql' || dialect === 'sqlserver') {
			const flagged = new Set<string>();
			for (const list of keyLists(table)) {
				for (const id of list) {
					const column = table.columns.find((c) => c.id === id);
					if (!column || flagged.has(id) || !LOB.has(column.type.kind)) continue;
					flagged.add(id);
					const blocking = dialect === 'sqlserver' || column.type.kind === 'json';
					push('key-lob', blocking ? 'error' : 'warning', { table: table.id, column: id }, { column: column.name, extra: dialect }, column.type.kind === 'json' ? undefined : 'use-varchar');
				}
			}
		}
		const lists = keyLists(table);
		const reported = new Set<string>();
		for (let a = 0; a < lists.length; a++) {
			for (let b = a + 1; b < lists.length; b++) {
				const first = lists[a] ?? [];
				const second = lists[b] ?? [];
				const signature = [...second].sort().join();
				if (sameList(first, second) && !reported.has(signature)) {
					reported.add(signature);
					const names = second.map((id) => table.columns.find((c) => c.id === id)?.name ?? id).join(', ');
					push('index-duplicate', 'warning', { table: table.id }, { table: table.name, columns: names, extra: signature });
				}
			}
		}
	}

	const cascadeFlags = dialect === 'sqlserver' ? new Set([...cascadeProblems(schema, 'onDelete'), ...cascadeProblems(schema, 'onUpdate')]) : new Set<string>();
	let mongoActions = false;
	for (const relation of schema.relations) {
		const from = tables.get(relation.fromTable);
		const to = tables.get(relation.toTable);
		if (!from || !to) continue;
		const fromColumns = relation.fromColumns.map((id) => from.columns.find((c) => c.id === id));
		const toColumns = relation.toColumns.map((id) => to.columns.find((c) => c.id === id));
		const label = { from: from.name, to: to.name };
		if (sql && !uniqueLists(to).some((l) => sameList(l, relation.toColumns))) {
			push('fk-target-not-unique', 'error', { relation: relation.id, table: from.id }, label);
		}
		fromColumns.forEach((column, i) => {
			const target = toColumns[i];
			if (!column || !target) return;
			if (family(column.type) !== family(target.type)) {
				push('fk-type-mismatch', sql ? 'error' : 'warning', { relation: relation.id, table: from.id, column: column.id }, { column: column.name, type: typeLabel(column.type), target: `${to.name}.${target.name}`, targetType: typeLabel(target.type) }, 'copy-type');
			} else if (JSON.stringify(column.type) !== JSON.stringify(target.type) && column.type.kind !== 'varchar' && column.type.kind !== 'char' && column.type.kind !== 'text') {
				const strict = dialect === 'mysql' || dialect === 'sqlserver';
				push('fk-type-mismatch', strict ? 'error' : 'warning', { relation: relation.id, table: from.id, column: column.id }, { column: column.name, type: typeLabel(column.type), target: `${to.name}.${target.name}`, targetType: typeLabel(target.type) }, 'copy-type');
			}
			if (sql && (relation.onDelete === 'SET NULL' || relation.onUpdate === 'SET NULL') && !column.nullable) {
				push('fk-setnull-notnull', 'error', { relation: relation.id, table: from.id, column: column.id }, { column: column.name }, 'make-nullable');
			}
			if (sql && (relation.onDelete === 'SET DEFAULT' || relation.onUpdate === 'SET DEFAULT') && (dialect === 'mysql' || column.default.kind === 'none')) {
				push('fk-setdefault', 'error', { relation: relation.id, table: from.id, column: column.id }, { column: column.name, extra: dialect });
			}
		});
		if (dialect === 'sqlserver' && (relation.onDelete === 'RESTRICT' || relation.onUpdate === 'RESTRICT')) push('fk-restrict', 'info', { relation: relation.id, table: from.id }, label);
		if (cascadeFlags.has(relation.id)) push('fk-cascade-paths', 'error', { relation: relation.id, table: from.id }, label);
		if ((dialect === 'postgres' || dialect === 'sqlserver' || dialect === 'mongodb') && !keyLists(from).some((l) => isPrefix(relation.fromColumns, l))) {
			const names = fromColumns.map((c) => c?.name ?? '?').join(', ');
			push('fk-no-index', 'warning', { relation: relation.id, table: from.id }, { table: from.name, columns: names }, 'add-fk-index');
		}
		if (dialect === 'mongodb' && (relation.onDelete !== 'NO ACTION' || relation.onUpdate !== 'NO ACTION')) mongoActions = true;
	}
	if (mongoActions) push('mongo-actions', 'info', {});
	if (dialect === 'mongodb' && schema.tables.some((t) => t.columns.some((c) => c.default.kind !== 'none'))) push('mongo-defaults', 'info', {});
	if (dialect === 'mysql' && schema.tables.some((t) => t.columns.some((c) => c.type.kind === 'timestamptz'))) push('mysql-timestamp-range', 'info', {});

	if (schema.tables.length >= 3) {
		for (const table of schema.tables) {
			if (!schema.relations.some((r) => r.fromTable === table.id || r.toTable === table.id)) push('table-isolated', 'info', { table: table.id }, { table: table.name });
		}
	}
	const others = [...new Set(schema.extras.map((e) => e.dialect).filter((d) => d !== dialect))];
	if (others.length > 0) push('extras-other-dialect', 'info', {}, { dialects: others.join(', ') });
	return out;
}

const WEIGHT: Record<Severity, number> = { error: 25, warning: 10, info: 3 };

export function score(issues: readonly DesignIssue[]): number {
	const total = issues.reduce((sum, i) => sum + WEIGHT[i.severity], 0);
	return Math.max(0, Math.min(100, 100 - total));
}
