import { autoLayout } from './layout';
import { bounds } from './ops';
import type { DialectId, Relation, Schema, Table } from './types';

export function mergeImported(current: Schema, imported: Schema, dialect: DialectId): Schema {
	const byName = new Map(current.tables.map((t) => [t.name.toLowerCase(), t]));
	const tableIds = new Map<string, string>();
	const columnIds = new Map<string, string>();
	const fresh = new Set<string>();

	const tables: Table[] = imported.tables.map((table) => {
		const previous = byName.get(table.name.toLowerCase());
		if (!previous) {
			fresh.add(table.id);
			tableIds.set(table.id, table.id);
			for (const column of table.columns) columnIds.set(column.id, column.id);
			return table;
		}
		tableIds.set(table.id, previous.id);
		const previousColumns = new Map(previous.columns.map((c) => [c.name.toLowerCase(), c.id]));
		const columns = table.columns.map((column) => {
			const kept = previousColumns.get(column.name.toLowerCase()) ?? column.id;
			columnIds.set(column.id, kept);
			return { ...column, id: kept };
		});
		const remap = (ids: string[]) => ids.map((id) => columnIds.get(id) ?? id);
		const merged: Table = {
			...table,
			id: previous.id,
			x: previous.x,
			y: previous.y,
			columns,
			primaryKey: remap(table.primaryKey),
			uniques: table.uniques.map((u) => ({ ...u, columns: remap(u.columns) })),
			indexes: table.indexes.map((i) => ({ ...i, columns: remap(i.columns) }))
		};
		if (previous.color) merged.color = previous.color;
		return merged;
	});

	const signature = (r: Pick<Relation, 'fromTable' | 'toTable' | 'fromColumns' | 'toColumns'>) => `${r.fromTable}|${r.fromColumns.join()}|${r.toTable}|${r.toColumns.join()}`;
	const previousRelations = new Map(current.relations.map((r) => [signature(r), r.id]));
	const relations: Relation[] = imported.relations.map((relation) => {
		const mapped = {
			...relation,
			fromTable: tableIds.get(relation.fromTable) ?? relation.fromTable,
			toTable: tableIds.get(relation.toTable) ?? relation.toTable,
			fromColumns: relation.fromColumns.map((id) => columnIds.get(id) ?? id),
			toColumns: relation.toColumns.map((id) => columnIds.get(id) ?? id)
		};
		return { ...mapped, id: previousRelations.get(signature(mapped)) ?? relation.id };
	});

	const result: Schema = {
		...current,
		tables,
		relations,
		extras: [...current.extras.filter((e) => e.dialect !== dialect), ...imported.extras]
	};
	if (fresh.size === 0) return result;
	const kept = tables.filter((t) => !fresh.has(t.id));
	const box = kept.length > 0 ? bounds({ ...result, tables: kept, notes: [], areas: [] }) : null;
	const origin = box ? { x: box.right + 120, y: box.top } : { x: 40, y: 40 };
	const positions = autoLayout(result, origin, fresh);
	return {
		...result,
		tables: result.tables.map((t) => {
			const p = positions.get(t.id);
			return p ? { ...t, x: p.x, y: p.y } : t;
		})
	};
}
