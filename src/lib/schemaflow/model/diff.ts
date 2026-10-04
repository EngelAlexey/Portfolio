import type { Column, Index, LogicalType, Relation, Schema, Table, UniqueConstraint } from './types';

export interface ColumnChange {
	before: Column;
	after: Column;
	renamed: boolean;
	type: boolean;
	nullable: boolean;
	default: boolean;
	comment: boolean;
}

export interface KeyChange {
	before: string[];
	after: string[];
}

export interface TableDiff {
	before: Table;
	after: Table;
	renamed: boolean;
	commentChanged: boolean;
	columnsAdded: Column[];
	columnsDropped: Column[];
	columnsChanged: ColumnChange[];
	primaryKey: KeyChange | null;
	uniquesAdded: UniqueConstraint[];
	uniquesDropped: UniqueConstraint[];
	indexesAdded: Index[];
	indexesDropped: Index[];
}

export interface SchemaDiff {
	before: Schema;
	after: Schema;
	tablesAdded: Table[];
	tablesDropped: Table[];
	tables: TableDiff[];
	relationsAdded: Relation[];
	relationsDropped: Relation[];
}

const lower = (name: string) => name.toLowerCase();

function pair<T extends { id: string; name?: string }>(before: readonly T[], after: readonly T[]): { matched: [T, T][]; added: T[]; dropped: T[] } {
	const matched: [T, T][] = [];
	const used = new Set<T>();
	const afterIds = new Map(after.map((x) => [x.id, x]));
	for (const b of before) {
		const a = afterIds.get(b.id);
		if (a && !used.has(a)) {
			matched.push([b, a]);
			used.add(a);
		}
	}
	const matchedBefore = new Set(matched.map(([b]) => b));
	const byName = new Map<string, T>();
	for (const a of after) if (!used.has(a) && a.name !== undefined) byName.set(lower(a.name), a);
	for (const b of before) {
		if (matchedBefore.has(b) || b.name === undefined) continue;
		const a = byName.get(lower(b.name));
		if (a && !used.has(a)) {
			matched.push([b, a]);
			used.add(a);
			byName.delete(lower(b.name));
		}
	}
	const pairedBefore = new Set(matched.map(([b]) => b));
	return { matched, added: after.filter((a) => !used.has(a)), dropped: before.filter((b) => !pairedBefore.has(b)) };
}

export function sameLogicalType(a: LogicalType, b: LogicalType): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

function sameDefault(a: Column, b: Column): boolean {
	return JSON.stringify(a.default) === JSON.stringify(b.default);
}

export function notNull(table: Table, column: Column): boolean {
	return !column.nullable || table.primaryKey.includes(column.id);
}

export function diffSchemas(before: Schema, after: Schema): SchemaDiff {
	const tablePairs = pair(before.tables, after.tables);
	const tableName = new Map<string, string>();
	for (const [b, a] of tablePairs.matched) tableName.set(b.id, lower(a.name));
	for (const t of tablePairs.dropped) tableName.set(t.id, `~${lower(t.name)}`);
	const afterTableName = new Map(after.tables.map((t) => [t.id, lower(t.name)]));

	const columnName = new Map<string, string>();
	const retyped = new Set<string>();
	const tables: TableDiff[] = [];

	for (const [b, a] of tablePairs.matched) {
		const columns = pair(b.columns, a.columns);
		for (const [bc, ac] of columns.matched) columnName.set(bc.id, lower(ac.name));
		for (const bc of columns.dropped) columnName.set(bc.id, `~${lower(bc.name)}`);
		const changed: ColumnChange[] = [];
		for (const [bc, ac] of columns.matched) {
			const change: ColumnChange = {
				before: bc,
				after: ac,
				renamed: bc.name !== ac.name,
				type: !sameLogicalType(bc.type, ac.type),
				nullable: notNull(b, bc) !== notNull(a, ac),
				default: !sameDefault(bc, ac),
				comment: (bc.comment ?? '') !== (ac.comment ?? '')
			};
			if (change.renamed || change.type || change.nullable || change.default || change.comment) changed.push(change);
			if (change.type) retyped.add(`${lower(a.name)}.${lower(ac.name)}`);
		}
		const beforeKey = (ids: string[]) => ids.map((id) => columnName.get(id) ?? id);
		const afterKey = (ids: string[]) => ids.map((id) => lower(a.columns.find((c) => c.id === id)?.name ?? id));
		const pkBefore = beforeKey(b.primaryKey);
		const pkAfter = afterKey(a.primaryKey);
		const sameKey = (x: string[], y: string[]) => x.length === y.length && x.every((v, i) => v === y[i]);
		const uniqueKey = (cols: string[]) => [...cols].sort().join('\u0000');
		const afterUniques = new Map(a.uniques.filter((u) => u.columns.length > 0).map((u) => [uniqueKey(afterKey(u.columns)), u]));
		const beforeUniques = new Map(b.uniques.filter((u) => u.columns.length > 0).map((u) => [uniqueKey(beforeKey(u.columns)), u]));
		const indexKey = (unique: boolean, cols: string[]) => `${unique ? 'u' : 'i'}:${cols.join('\u0000')}`;
		const afterIndexes = new Map(a.indexes.filter((i) => i.columns.length > 0).map((i) => [indexKey(i.unique, afterKey(i.columns)), i]));
		const beforeIndexes = new Map(b.indexes.filter((i) => i.columns.length > 0).map((i) => [indexKey(i.unique, beforeKey(i.columns)), i]));
		tables.push({
			before: b,
			after: a,
			renamed: b.name !== a.name,
			commentChanged: (b.comment ?? '') !== (a.comment ?? ''),
			columnsAdded: columns.added,
			columnsDropped: columns.dropped,
			columnsChanged: changed,
			primaryKey: sameKey(pkBefore, pkAfter) ? null : { before: b.primaryKey, after: a.primaryKey },
			uniquesAdded: [...afterUniques].filter(([k]) => !beforeUniques.has(k)).map(([, u]) => u),
			uniquesDropped: [...beforeUniques].filter(([k]) => !afterUniques.has(k)).map(([, u]) => u),
			indexesAdded: [...afterIndexes].filter(([k]) => !beforeIndexes.has(k)).map(([, i]) => i),
			indexesDropped: [...beforeIndexes].filter(([k]) => !afterIndexes.has(k)).map(([, i]) => i)
		});
	}

	const afterTables = new Map(after.tables.map((t) => [t.id, t]));
	const beforeSig = (r: Relation) => `${tableName.get(r.fromTable) ?? r.fromTable}|${r.fromColumns.map((id) => columnName.get(id) ?? id).join()}|${tableName.get(r.toTable) ?? r.toTable}|${r.toColumns.map((id) => columnName.get(id) ?? id).join()}|${r.onDelete}|${r.onUpdate}`;
	const afterSig = (r: Relation) => {
		const from = afterTables.get(r.fromTable);
		const to = afterTables.get(r.toTable);
		const names = (table: Table | undefined, ids: string[]) => ids.map((id) => lower(table?.columns.find((c) => c.id === id)?.name ?? id)).join();
		return `${afterTableName.get(r.fromTable) ?? r.fromTable}|${names(from, r.fromColumns)}|${afterTableName.get(r.toTable) ?? r.toTable}|${names(to, r.toColumns)}|${r.onDelete}|${r.onUpdate}`;
	};
	const afterRelations = new Map(after.relations.map((r) => [afterSig(r), r]));
	const beforeRelations = new Map(before.relations.map((r) => [beforeSig(r), r]));
	const droppedTables = new Set(tablePairs.dropped.map((t) => t.id));

	let relationsDropped = before.relations.filter((r) => !afterRelations.has(beforeSig(r)) && !droppedTables.has(r.fromTable));
	let relationsAdded = after.relations.filter((r) => !beforeRelations.has(afterSig(r)));

	const touchesRetyped = (schemaTables: Map<string, Table>, r: Relation) => {
		const keys = (tableId: string, ids: string[]) => {
			const t = schemaTables.get(tableId);
			return ids.map((id) => `${lower(t?.name ?? '')}.${lower(t?.columns.find((c) => c.id === id)?.name ?? '')}`);
		};
		return [...keys(r.fromTable, r.fromColumns), ...keys(r.toTable, r.toColumns)].some((k) => retyped.has(k));
	};
	const pkChanged = new Set(tables.filter((t) => t.primaryKey).map((t) => lower(t.after.name)));
	for (const [sig, relation] of beforeRelations) {
		const kept = afterRelations.get(sig);
		if (!kept || droppedTables.has(relation.fromTable)) continue;
		const target = afterTableName.get(kept.toTable) ?? '';
		if (touchesRetyped(afterTables, kept) || pkChanged.has(target)) {
			relationsDropped = [...relationsDropped, relation];
			relationsAdded = [...relationsAdded, kept];
		}
	}

	return { before, after, tablesAdded: tablePairs.added, tablesDropped: tablePairs.dropped, tables, relationsAdded, relationsDropped };
}

export function isEmptyDiff(diff: SchemaDiff): boolean {
	return (
		diff.tablesAdded.length === 0 &&
		diff.tablesDropped.length === 0 &&
		diff.relationsAdded.length === 0 &&
		diff.relationsDropped.length === 0 &&
		diff.tables.every(
			(t) =>
				!t.renamed &&
				!t.commentChanged &&
				t.columnsAdded.length === 0 &&
				t.columnsDropped.length === 0 &&
				t.columnsChanged.length === 0 &&
				!t.primaryKey &&
				t.uniquesAdded.length === 0 &&
				t.uniquesDropped.length === 0 &&
				t.indexesAdded.length === 0 &&
				t.indexesDropped.length === 0
		)
	);
}

export type TypeChange = 'widen' | 'convert' | 'narrow';

const INT_RANK: Record<string, number> = { smallint: 1, int: 2, bigint: 3 };
const STRINGS = new Set(['varchar', 'char', 'text']);

function stringLength(type: LogicalType): number {
	if (type.kind === 'text') return Infinity;
	if (type.kind === 'varchar') return type.length ?? Infinity;
	if (type.kind === 'char') return type.length ?? 1;
	return 0;
}

export function classifyTypeChange(from: LogicalType, to: LogicalType): TypeChange {
	if (from.kind === 'raw' || to.kind === 'raw') return 'convert';
	if (from.kind in INT_RANK && to.kind in INT_RANK) return (INT_RANK[to.kind] ?? 0) >= (INT_RANK[from.kind] ?? 0) ? 'widen' : 'narrow';
	if (from.kind === 'real' && to.kind === 'double') return 'widen';
	if ((from.kind === 'smallint' || from.kind === 'int') && to.kind === 'double') return 'widen';
	if (STRINGS.has(from.kind) && STRINGS.has(to.kind)) return stringLength(to) >= stringLength(from) ? 'widen' : 'narrow';
	if (from.kind === 'decimal' && to.kind === 'decimal') {
		const fromPrecision = from.precision ?? Infinity;
		const toPrecision = to.precision ?? Infinity;
		const fromScale = from.scale ?? 0;
		const toScale = to.scale ?? 0;
		return toScale >= fromScale && toPrecision - toScale >= fromPrecision - fromScale ? 'widen' : 'narrow';
	}
	if (from.kind === 'date' && (to.kind === 'timestamp' || to.kind === 'timestamptz')) return 'widen';
	if (from.kind === 'timestamp' && to.kind === 'timestamptz') return 'convert';
	if (from.kind === 'timestamptz' && to.kind === 'timestamp') return 'convert';
	if (STRINGS.has(to.kind) && !STRINGS.has(from.kind)) return 'convert';
	if (from.kind === 'json' && STRINGS.has(to.kind)) return 'convert';
	return 'narrow';
}
