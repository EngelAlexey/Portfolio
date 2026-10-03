import { uniqueName } from '../model/ids';
import { addIndex, findTable, newColumn, updateColumn } from '../model/ops';
import type { Schema } from '../model/types';
import type { DesignIssue } from './rules';

export function applyFix(schema: Schema, issue: DesignIssue): Schema {
	const table = issue.table ? findTable(schema, issue.table) : undefined;
	switch (issue.fix) {
		case 'add-fk-index': {
			const relation = schema.relations.find((r) => r.id === issue.relation);
			return relation ? addIndex(schema, relation.fromTable, [...relation.fromColumns]) : schema;
		}
		case 'add-primary-key': {
			if (!table) return schema;
			const column = newColumn(uniqueName('id', table.columns.map((c) => c.name)), { kind: 'bigint' }, { nullable: false, default: { kind: 'autoincrement' } });
			return {
				...schema,
				tables: schema.tables.map((t) => (t.id === table.id ? { ...t, columns: [column, ...t.columns], primaryKey: [column.id] } : t))
			};
		}
		case 'make-nullable':
			return table && issue.column ? updateColumn(schema, table.id, issue.column, { nullable: true }) : schema;
		case 'clear-default':
			return table && issue.column ? updateColumn(schema, table.id, issue.column, { default: { kind: 'none' } }) : schema;
		case 'use-varchar':
			return table && issue.column ? updateColumn(schema, table.id, issue.column, { type: { kind: 'varchar', length: 255 } }) : schema;
		case 'copy-type': {
			const relation = schema.relations.find((r) => r.id === issue.relation);
			if (!relation || !issue.column) return schema;
			const at = relation.fromColumns.indexOf(issue.column);
			const target = findTable(schema, relation.toTable)?.columns.find((c) => c.id === relation.toColumns[at]);
			return target ? updateColumn(schema, relation.fromTable, issue.column, { type: target.type }) : schema;
		}
		default:
			return schema;
	}
}
