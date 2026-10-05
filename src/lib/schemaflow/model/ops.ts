import { createId, uniqueName } from './ids';
import {
	CARD_WIDTH,
	LIMITS,
	tableHeight,
	type Action,
	type Area,
	type Column,
	type Index,
	type LogicalType,
	type Note,
	type Relation,
	type Schema,
	type Table
} from './types';

export interface Selection {
	tables: string[];
	relations: string[];
	notes: string[];
	areas: string[];
}

export const emptySelection = (): Selection => ({ tables: [], relations: [], notes: [], areas: [] });

export function findTable(schema: Schema, id: string): Table | undefined {
	return schema.tables.find((t) => t.id === id);
}

export function findColumn(table: Table | undefined, id: string): Column | undefined {
	return table?.columns.find((c) => c.id === id);
}

export function findTableByName(schema: Schema, name: string): Table | undefined {
	const lower = name.toLowerCase();
	return schema.tables.find((t) => t.name.toLowerCase() === lower);
}

function mapTable(schema: Schema, id: string, fn: (table: Table) => Table): Schema {
	return { ...schema, tables: schema.tables.map((t) => (t.id === id ? fn(t) : t)) };
}

export function sameType(a: LogicalType, b: LogicalType): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function newColumn(name: string, type: LogicalType, patch: Partial<Column> = {}): Column {
	return { id: createId(), name, type, nullable: true, default: { kind: 'none' }, ...patch };
}

export function addTable(
	schema: Schema,
	options: { name: string; x: number; y: number; idColumn?: string }
): { schema: Schema; tableId: string } {
	if (schema.tables.length >= LIMITS.tables) return { schema, tableId: '' };
	const name = uniqueName(options.name, schema.tables.map((t) => t.name));
	const id = newColumn(options.idColumn ?? 'id', { kind: 'bigint' }, { nullable: false, default: { kind: 'autoincrement' } });
	const table: Table = {
		id: createId(),
		name,
		x: Math.round(options.x),
		y: Math.round(options.y),
		columns: [id],
		primaryKey: [id.id],
		uniques: [],
		indexes: []
	};
	return { schema: { ...schema, tables: [...schema.tables, table] }, tableId: table.id };
}

export function renameTable(schema: Schema, tableId: string, name: string): Schema {
	const clean = name.trim().slice(0, LIMITS.name);
	if (!clean) return schema;
	return mapTable(schema, tableId, (t) => ({ ...t, name: clean }));
}

export function updateTable(schema: Schema, tableId: string, patch: Partial<Pick<Table, 'color' | 'comment' | 'primaryKeyName'>>): Schema {
	return mapTable(schema, tableId, (t) => ({ ...t, ...patch }));
}

export function moveTables(schema: Schema, ids: readonly string[], dx: number, dy: number): Schema {
	if (dx === 0 && dy === 0) return schema;
	const set = new Set(ids);
	return {
		...schema,
		tables: schema.tables.map((t) => (set.has(t.id) ? { ...t, x: Math.round(t.x + dx), y: Math.round(t.y + dy) } : t))
	};
}

export function setTablePositions(schema: Schema, positions: ReadonlyMap<string, { x: number; y: number }>): Schema {
	return {
		...schema,
		tables: schema.tables.map((t) => {
			const p = positions.get(t.id);
			return p ? { ...t, x: Math.round(p.x), y: Math.round(p.y) } : t;
		})
	};
}

export function duplicateTable(schema: Schema, tableId: string): { schema: Schema; tableId: string } {
	const source = findTable(schema, tableId);
	if (!source || schema.tables.length >= LIMITS.tables) return { schema, tableId: '' };
	const columnIds = new Map(source.columns.map((c) => [c.id, createId()]));
	const remap = (ids: string[]) => ids.map((id) => columnIds.get(id) ?? id);
	const copy: Table = {
		...source,
		id: createId(),
		name: uniqueName(`${source.name}_copy`, schema.tables.map((t) => t.name)),
		x: source.x + 32,
		y: source.y + 32,
		columns: source.columns.map((c) => ({ ...c, id: columnIds.get(c.id) ?? createId() })),
		primaryKey: remap(source.primaryKey),
		primaryKeyName: undefined,
		uniques: source.uniques.map((u) => ({ ...u, id: createId(), name: undefined, columns: remap(u.columns) })),
		indexes: source.indexes.map((i) => ({ ...i, id: createId(), name: undefined, columns: remap(i.columns) }))
	};
	const outgoing = schema.relations
		.filter((r) => r.fromTable === source.id)
		.map((r) => ({ ...r, id: createId(), name: undefined, fromTable: copy.id, fromColumns: remap(r.fromColumns) }));
	return { schema: { ...schema, tables: [...schema.tables, copy], relations: [...schema.relations, ...outgoing] }, tableId: copy.id };
}

export function deleteSelection(schema: Schema, selection: Selection): Schema {
	const tables = new Set(selection.tables);
	const relations = new Set(selection.relations);
	const notes = new Set(selection.notes);
	const areas = new Set(selection.areas);
	return {
		...schema,
		tables: schema.tables.filter((t) => !tables.has(t.id)),
		relations: schema.relations.filter((r) => !relations.has(r.id) && !tables.has(r.fromTable) && !tables.has(r.toTable)),
		notes: schema.notes.filter((n) => !notes.has(n.id)),
		areas: schema.areas.filter((a) => !areas.has(a.id))
	};
}

export function addColumn(
	schema: Schema,
	tableId: string,
	options: { name: string; type?: LogicalType; index?: number }
): { schema: Schema; columnId: string } {
	const table = findTable(schema, tableId);
	if (!table || table.columns.length >= LIMITS.columns) return { schema, columnId: '' };
	const column = newColumn(uniqueName(options.name, table.columns.map((c) => c.name)), options.type ?? { kind: 'text' }, { nullable: false });
	const columns = [...table.columns];
	columns.splice(options.index ?? columns.length, 0, column);
	return { schema: mapTable(schema, tableId, (t) => ({ ...t, columns })), columnId: column.id };
}

export function updateColumn(schema: Schema, tableId: string, columnId: string, patch: Partial<Omit<Column, 'id'>>): Schema {
	const table = findTable(schema, tableId);
	const before = findColumn(table, columnId);
	if (!table || !before) return schema;
	const next: Column = { ...before, ...patch };
	if (patch.name !== undefined) {
		const clean = patch.name.trim().slice(0, LIMITS.name);
		if (!clean) return schema;
		next.name = clean;
	}
	if (table.primaryKey.includes(columnId)) next.nullable = false;
	let result = mapTable(schema, tableId, (t) => ({ ...t, columns: t.columns.map((c) => (c.id === columnId ? next : c)) }));
	if (patch.type && !sameType(before.type, patch.type)) {
		const typeForChild: LogicalType = patch.type;
		for (const relation of schema.relations) {
			const at = relation.toTable === tableId ? relation.toColumns.indexOf(columnId) : -1;
			if (at === -1) continue;
			const childId = relation.fromColumns[at];
			const child = findColumn(findTable(result, relation.fromTable), childId ?? '');
			if (child && childId && sameType(child.type, before.type)) {
				result = mapTable(result, relation.fromTable, (t) => ({
					...t,
					columns: t.columns.map((c) => (c.id === childId ? { ...c, type: typeForChild } : c))
				}));
			}
		}
	}
	return result;
}

export function deleteColumn(schema: Schema, tableId: string, columnId: string): Schema {
	const strip = (ids: string[]) => ids.filter((id) => id !== columnId);
	const withoutColumn = mapTable(schema, tableId, (t) => ({
		...t,
		columns: t.columns.filter((c) => c.id !== columnId),
		primaryKey: strip(t.primaryKey),
		uniques: t.uniques.map((u) => ({ ...u, columns: strip(u.columns) })).filter((u) => u.columns.length > 0),
		indexes: t.indexes.map((i) => ({ ...i, columns: strip(i.columns) })).filter((i) => i.columns.length > 0)
	}));
	return {
		...withoutColumn,
		relations: withoutColumn.relations.filter(
			(r) =>
				!(r.fromTable === tableId && r.fromColumns.includes(columnId)) && !(r.toTable === tableId && r.toColumns.includes(columnId))
		)
	};
}

export function moveColumn(schema: Schema, tableId: string, columnId: string, toIndex: number): Schema {
	return mapTable(schema, tableId, (t) => {
		const from = t.columns.findIndex((c) => c.id === columnId);
		if (from === -1) return t;
		const columns = [...t.columns];
		const [moved] = columns.splice(from, 1);
		if (!moved) return t;
		columns.splice(Math.max(0, Math.min(toIndex, columns.length)), 0, moved);
		return { ...t, columns };
	});
}

export function setPrimaryKey(schema: Schema, tableId: string, columnIds: string[]): Schema {
	return mapTable(schema, tableId, (t) => ({
		...t,
		primaryKey: t.columns.filter((c) => columnIds.includes(c.id)).map((c) => c.id),
		columns: t.columns.map((c) => (columnIds.includes(c.id) ? { ...c, nullable: false } : c))
	}));
}

export function togglePrimaryKey(schema: Schema, tableId: string, columnId: string): Schema {
	const table = findTable(schema, tableId);
	if (!table) return schema;
	const next = table.primaryKey.includes(columnId)
		? table.primaryKey.filter((id) => id !== columnId)
		: [...table.primaryKey, columnId];
	return setPrimaryKey(schema, tableId, next);
}

export function isUnique(table: Table, columnId: string): boolean {
	return table.uniques.some((u) => u.columns.length === 1 && u.columns[0] === columnId);
}

export function toggleUnique(schema: Schema, tableId: string, columnId: string): Schema {
	return mapTable(schema, tableId, (t) =>
		isUnique(t, columnId)
			? { ...t, uniques: t.uniques.filter((u) => !(u.columns.length === 1 && u.columns[0] === columnId)) }
			: { ...t, uniques: [...t.uniques, { id: createId(), columns: [columnId] }] }
	);
}

export function addIndex(schema: Schema, tableId: string, columns: string[], unique = false): Schema {
	if (columns.length === 0) return schema;
	const index: Index = { id: createId(), columns, unique };
	return mapTable(schema, tableId, (t) => ({ ...t, indexes: [...t.indexes, index] }));
}

export function updateIndex(schema: Schema, tableId: string, indexId: string, patch: Partial<Omit<Index, 'id'>>): Schema {
	return mapTable(schema, tableId, (t) => ({ ...t, indexes: t.indexes.map((i) => (i.id === indexId ? { ...i, ...patch } : i)) }));
}

export function deleteIndex(schema: Schema, tableId: string, indexId: string): Schema {
	return mapTable(schema, tableId, (t) => ({ ...t, indexes: t.indexes.filter((i) => i.id !== indexId) }));
}

export function deleteUnique(schema: Schema, tableId: string, uniqueId: string): Schema {
	return mapTable(schema, tableId, (t) => ({ ...t, uniques: t.uniques.filter((u) => u.id !== uniqueId) }));
}

export function referencedKey(table: Table): string[] {
	return table.primaryKey.length > 0 ? table.primaryKey : (table.uniques[0]?.columns ?? []);
}

export function connectColumns(
	schema: Schema,
	link: { fromTable: string; fromColumns: string[]; toTable: string; toColumns: string[]; onDelete?: Action; onUpdate?: Action }
): { schema: Schema; relationId: string } {
	if (link.fromColumns.length === 0 || link.fromColumns.length !== link.toColumns.length) return { schema, relationId: '' };
	const existing = schema.relations.find(
		(r) =>
			r.fromTable === link.fromTable &&
			r.toTable === link.toTable &&
			r.fromColumns.join() === link.fromColumns.join() &&
			r.toColumns.join() === link.toColumns.join()
	);
	if (existing) return { schema, relationId: existing.id };
	const relation: Relation = {
		id: createId(),
		fromTable: link.fromTable,
		fromColumns: link.fromColumns,
		toTable: link.toTable,
		toColumns: link.toColumns,
		onDelete: link.onDelete ?? 'NO ACTION',
		onUpdate: link.onUpdate ?? 'NO ACTION'
	};
	return { schema: { ...schema, relations: [...schema.relations, relation] }, relationId: relation.id };
}

export function connectWithNewColumns(
	schema: Schema,
	fromTableId: string,
	toTableId: string
): { schema: Schema; relationId: string; columnIds: string[] } {
	const from = findTable(schema, fromTableId);
	const to = findTable(schema, toTableId);
	if (!from || !to) return { schema, relationId: '', columnIds: [] };
	const key = referencedKey(to);
	if (key.length === 0) return { schema, relationId: '', columnIds: [] };
	let result = schema;
	const columnIds: string[] = [];
	const taken = from.columns.map((c) => c.name);
	for (const keyId of key) {
		const target = findColumn(to, keyId);
		if (!target) return { schema, relationId: '', columnIds: [] };
		const name = uniqueName(`${to.name}_${target.name}`, taken);
		taken.push(name);
		const column = newColumn(name, target.type, { nullable: false });
		result = mapTable(result, fromTableId, (t) => ({ ...t, columns: [...t.columns, column] }));
		columnIds.push(column.id);
	}
	const linked = connectColumns(result, { fromTable: fromTableId, fromColumns: columnIds, toTable: toTableId, toColumns: key });
	return { schema: linked.schema, relationId: linked.relationId, columnIds };
}

export function updateRelation(schema: Schema, relationId: string, patch: Partial<Pick<Relation, 'onDelete' | 'onUpdate' | 'name'>>): Schema {
	return { ...schema, relations: schema.relations.map((r) => (r.id === relationId ? { ...r, ...patch } : r)) };
}

export function isOneToOne(schema: Schema, relation: Relation): boolean {
	const from = findTable(schema, relation.fromTable);
	if (!from) return false;
	const cols = [...relation.fromColumns].sort().join();
	if ([...from.primaryKey].sort().join() === cols) return true;
	return from.uniques.some((u) => [...u.columns].sort().join() === cols) || from.indexes.some((i) => i.unique && [...i.columns].sort().join() === cols);
}

export function setOneToOne(schema: Schema, relationId: string, oneToOne: boolean): Schema {
	const relation = schema.relations.find((r) => r.id === relationId);
	if (!relation) return schema;
	const cols = [...relation.fromColumns].sort().join();
	return mapTable(schema, relation.fromTable, (t) => {
		const matches = (columns: string[]) => [...columns].sort().join() === cols;
		if (oneToOne) {
			if (t.uniques.some((u) => matches(u.columns)) || matches(t.primaryKey)) return t;
			return { ...t, uniques: [...t.uniques, { id: createId(), columns: [...relation.fromColumns] }] };
		}
		return {
			...t,
			uniques: t.uniques.filter((u) => !matches(u.columns)),
			indexes: t.indexes.map((i) => (i.unique && matches(i.columns) ? { ...i, unique: false } : i))
		};
	});
}

export function createJunction(
	schema: Schema,
	aId: string,
	bId: string
): { schema: Schema; tableId: string } {
	const a = findTable(schema, aId);
	const b = findTable(schema, bId);
	if (!a || !b || a.id === b.id || schema.tables.length >= LIMITS.tables) return { schema, tableId: '' };
	const aKey = referencedKey(a);
	const bKey = referencedKey(b);
	if (aKey.length === 0 || bKey.length === 0) return { schema, tableId: '' };
	const columns: Column[] = [];
	const taken: string[] = [];
	const build = (owner: Table, key: string[]) =>
		key.map((id) => {
			const target = findColumn(owner, id);
			const name = uniqueName(`${owner.name}_${target?.name ?? 'id'}`, taken);
			taken.push(name);
			const column = newColumn(name, target ? target.type : { kind: 'bigint' }, { nullable: false });
			columns.push(column);
			return column.id;
		});
	const aCols = build(a, aKey);
	const bCols = build(b, bKey);
	const table: Table = {
		id: createId(),
		name: uniqueName(`${a.name}_${b.name}`, schema.tables.map((t) => t.name)),
		x: Math.round((a.x + b.x) / 2),
		y: Math.round(Math.max(a.y + tableHeight(a), b.y + tableHeight(b)) + 60),
		columns,
		primaryKey: [...aCols, ...bCols],
		uniques: [],
		indexes: []
	};
	const relations: Relation[] = [
		{ id: createId(), fromTable: table.id, fromColumns: aCols, toTable: a.id, toColumns: aKey, onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
		{ id: createId(), fromTable: table.id, fromColumns: bCols, toTable: b.id, toColumns: bKey, onDelete: 'CASCADE', onUpdate: 'NO ACTION' }
	];
	return { schema: { ...schema, tables: [...schema.tables, table], relations: [...schema.relations, ...relations] }, tableId: table.id };
}

export function convertToJunction(schema: Schema, relationId: string): { schema: Schema; tableId: string } {
	const relation = schema.relations.find((r) => r.id === relationId);
	if (!relation || relation.fromTable === relation.toTable) return { schema, tableId: '' };
	const from = findTable(schema, relation.fromTable);
	let result: Schema = { ...schema, relations: schema.relations.filter((r) => r.id !== relationId) };
	if (from) {
		for (const columnId of relation.fromColumns) {
			const usedElsewhere =
				from.primaryKey.includes(columnId) ||
				result.relations.some(
					(r) => (r.fromTable === from.id && r.fromColumns.includes(columnId)) || (r.toTable === from.id && r.toColumns.includes(columnId))
				);
			if (!usedElsewhere) result = deleteColumn(result, from.id, columnId);
		}
	}
	return createJunction(result, relation.fromTable, relation.toTable);
}

export function deleteRelation(schema: Schema, relationId: string): Schema {
	return { ...schema, relations: schema.relations.filter((r) => r.id !== relationId) };
}

export function addNote(schema: Schema, note: Omit<Note, 'id'>): { schema: Schema; noteId: string } {
	if (schema.notes.length >= LIMITS.notes) return { schema, noteId: '' };
	const created: Note = { ...note, id: createId(), text: note.text.slice(0, LIMITS.noteText) };
	return { schema: { ...schema, notes: [...schema.notes, created] }, noteId: created.id };
}

export function updateNote(schema: Schema, noteId: string, patch: Partial<Omit<Note, 'id'>>): Schema {
	const clean = patch.text === undefined ? patch : { ...patch, text: patch.text.slice(0, LIMITS.noteText) };
	return { ...schema, notes: schema.notes.map((n) => (n.id === noteId ? { ...n, ...clean } : n)) };
}

export function addArea(schema: Schema, area: Omit<Area, 'id'>): { schema: Schema; areaId: string } {
	if (schema.areas.length >= LIMITS.areas) return { schema, areaId: '' };
	const created: Area = { ...area, id: createId(), title: area.title.slice(0, LIMITS.name) };
	return { schema: { ...schema, areas: [...schema.areas, created] }, areaId: created.id };
}

export function updateArea(schema: Schema, areaId: string, patch: Partial<Omit<Area, 'id'>>): Schema {
	const clean = patch.title === undefined ? patch : { ...patch, title: patch.title.slice(0, LIMITS.name) };
	return { ...schema, areas: schema.areas.map((a) => (a.id === areaId ? { ...a, ...clean } : a)) };
}

export function tablesInArea(schema: Schema, area: Area): string[] {
	return schema.tables
		.filter((t) => {
			const cx = t.x + CARD_WIDTH / 2;
			const cy = t.y + tableHeight(t) / 2;
			return cx >= area.x && cx <= area.x + area.w && cy >= area.y && cy <= area.y + area.h;
		})
		.map((t) => t.id);
}

export function moveSelection(schema: Schema, selection: Selection, dx: number, dy: number): Schema {
	if (dx === 0 && dy === 0) return schema;
	const tables = new Set(selection.tables);
	for (const areaId of selection.areas) {
		const area = schema.areas.find((a) => a.id === areaId);
		if (area) for (const id of tablesInArea(schema, area)) tables.add(id);
	}
	const notes = new Set(selection.notes);
	const areas = new Set(selection.areas);
	const shift = <T extends { x: number; y: number }>(item: T): T => ({ ...item, x: Math.round(item.x + dx), y: Math.round(item.y + dy) });
	return {
		...schema,
		tables: schema.tables.map((t) => (tables.has(t.id) ? shift(t) : t)),
		notes: schema.notes.map((n) => (notes.has(n.id) ? shift(n) : n)),
		areas: schema.areas.map((a) => (areas.has(a.id) ? shift(a) : a))
	};
}

export function bounds(schema: Schema, heightOf: (table: Table) => number = tableHeight): { left: number; top: number; right: number; bottom: number } | null {
	const boxes = [
		...schema.tables.map((t) => ({ x: t.x, y: t.y, w: CARD_WIDTH, h: heightOf(t) })),
		...schema.notes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })),
		...schema.areas.map((a) => ({ x: a.x, y: a.y, w: a.w, h: a.h }))
	];
	if (boxes.length === 0) return null;
	return {
		left: Math.min(...boxes.map((b) => b.x)),
		top: Math.min(...boxes.map((b) => b.y)),
		right: Math.max(...boxes.map((b) => b.x + b.w)),
		bottom: Math.max(...boxes.map((b) => b.y + b.h))
	};
}
