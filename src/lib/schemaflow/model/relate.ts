import { addColumn, connectColumns, connectWithNewColumns, createJunction, findColumn, findTable, referencedKey, setOneToOne } from './ops';
import type { Schema } from './types';

export type RelationKind = 'oneToMany' | 'oneToOne' | 'manyToMany';

export interface RelationRequest {
	kind: RelationKind;
	from: string;
	to: string;
	fromColumn?: string;
	toColumn?: string;
}

export interface RelationPlan {
	schema: Schema;
	relationId: string;
	tableId: string;
	label: string;
}

const names = (schema: Schema, tableId: string, columnIds: readonly string[]) => {
	const table = findTable(schema, tableId);
	const list = columnIds.map((id) => findColumn(table, id)?.name ?? '');
	return `${table?.name ?? ''}.${list.length > 1 ? `(${list.join(', ')})` : (list[0] ?? '')}`;
};

export function planRelation(schema: Schema, request: RelationRequest): RelationPlan | null {
	const from = findTable(schema, request.from);
	const to = findTable(schema, request.to);
	if (!from || !to) return null;
	if (request.kind === 'manyToMany') {
		const result = createJunction(schema, from.id, to.id);
		if (!result.tableId) return null;
		return { schema: result.schema, relationId: '', tableId: result.tableId, label: findTable(result.schema, result.tableId)?.name ?? '' };
	}
	const key = referencedKey(to);
	const target = findColumn(to, request.toColumn ?? key[0] ?? to.columns[0]?.id ?? '');
	if (!target) return null;
	let next: Schema;
	let relationId: string;
	let sources: string[];
	let targets = [target.id];
	if (request.fromColumn && findColumn(from, request.fromColumn)) {
		const result = connectColumns(schema, { fromTable: from.id, fromColumns: [request.fromColumn], toTable: to.id, toColumns: targets });
		next = result.schema;
		relationId = result.relationId;
		sources = [request.fromColumn];
	} else if (key.length > 0 && (request.toColumn === undefined || (key.length === 1 && key[0] === target.id))) {
		const result = connectWithNewColumns(schema, from.id, to.id);
		next = result.schema;
		relationId = result.relationId;
		sources = result.columnIds;
		targets = key;
	} else {
		const added = addColumn(schema, from.id, { name: `${to.name}_${target.name}`, type: target.type });
		if (!added.columnId) return null;
		const result = connectColumns(added.schema, { fromTable: from.id, fromColumns: [added.columnId], toTable: to.id, toColumns: targets });
		next = result.schema;
		relationId = result.relationId;
		sources = [added.columnId];
	}
	if (!relationId) return null;
	if (request.kind === 'oneToOne') next = setOneToOne(next, relationId, true);
	return { schema: next, relationId, tableId: '', label: `${names(next, from.id, sources)} → ${names(next, to.id, targets)}` };
}
