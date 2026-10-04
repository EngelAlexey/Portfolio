import type { SchemaDiff } from '../model/diff';
import { notNull } from '../model/diff';
import type { Table } from '../model/types';
import { fill, type Strings } from './strings';
import { displayType } from './types';

export interface ChangeItem {
	kind: 'add' | 'drop' | 'change';
	text: string;
}

const names = (table: Table | undefined, ids: string[]) => ids.map((id) => table?.columns.find((c) => c.id === id)?.name ?? id).join(', ');

export function describeChanges(diff: SchemaDiff, t: Strings): ChangeItem[] {
	const c = t.migration.changes;
	const out: ChangeItem[] = [];
	const push = (kind: ChangeItem['kind'], template: string, params: Record<string, string | number>) => out.push({ kind, text: fill(template, params) });

	for (const table of diff.tablesAdded) push('add', c.tableAdded, { table: table.name });
	for (const table of diff.tablesDropped) push('drop', c.tableDropped, { table: table.name });
	for (const d of diff.tables) {
		const table = d.after.name;
		if (d.renamed) push('change', c.tableRenamed, { from: d.before.name, to: table });
		if (d.commentChanged) push('change', c.tableComment, { table });
		for (const column of d.columnsAdded) push('add', c.columnAdded, { table, column: column.name });
		for (const column of d.columnsDropped) push('drop', c.columnDropped, { table, column: column.name });
		for (const change of d.columnsChanged) {
			const column = change.after.name;
			if (change.renamed) push('change', c.columnRenamed, { table, from: change.before.name, to: column });
			if (change.type) push('change', c.columnType, { table, column, from: displayType(change.before.type), to: displayType(change.after.type) });
			if (change.nullable) push('change', notNull(d.after, change.after) ? c.columnRequired : c.columnOptional, { table, column });
			if (change.default) push('change', c.columnDefault, { table, column });
			if (change.comment) push('change', c.columnComment, { table, column });
		}
		if (d.primaryKey) {
			const none = c.primaryKeyNone;
			push('change', c.primaryKey, { table, from: names(d.before, d.primaryKey.before) || none, to: names(d.after, d.primaryKey.after) || none });
		}
		for (const u of d.uniquesAdded) push('add', c.uniqueAdded, { table, columns: names(d.after, u.columns) });
		for (const u of d.uniquesDropped) push('drop', c.uniqueDropped, { table, columns: names(d.before, u.columns) });
		for (const i of d.indexesAdded) push('add', c.indexAdded, { table, columns: names(d.after, i.columns) });
		for (const i of d.indexesDropped) push('drop', c.indexDropped, { table, columns: names(d.before, i.columns) });
	}
	const label = (schema: SchemaDiff['after'], relation: SchemaDiff['after']['relations'][number], key: 'added' | 'dropped') => {
		const from = schema.tables.find((x) => x.id === relation.fromTable);
		const to = schema.tables.find((x) => x.id === relation.toTable);
		push(key === 'added' ? 'add' : 'drop', key === 'added' ? c.relationAdded : c.relationDropped, { from: from?.name ?? '', columns: names(from, relation.fromColumns), to: to?.name ?? '' });
	};
	for (const relation of diff.relationsAdded) label(diff.after, relation, 'added');
	for (const relation of diff.relationsDropped) label(diff.before, relation, 'dropped');
	return out;
}
