import type { Schema } from './model/types';

export function shape(schema: Schema) {
	const tableName = new Map(schema.tables.map((t) => [t.id, t.name]));
	const columnName = new Map(schema.tables.flatMap((t) => t.columns.map((c) => [c.id, c.name] as const)));
	const names = (ids: string[]) => ids.map((id) => columnName.get(id) ?? `?${id}`);
	return {
		tables: schema.tables.map((t) => ({
			name: t.name,
			comment: t.comment ?? null,
			columns: t.columns.map((c) => ({
				name: c.name,
				type: c.type,
				nullable: c.nullable,
				default: c.default,
				comment: c.comment ?? null
			})),
			primaryKey: names(t.primaryKey),
			uniques: t.uniques.map((u) => names(u.columns)),
			indexes: t.indexes.map((i) => ({ columns: names(i.columns), unique: i.unique }))
		})),
		relations: schema.relations.map((r) => ({
			from: `${tableName.get(r.fromTable)}(${names(r.fromColumns).join(',')})`,
			to: `${tableName.get(r.toTable)}(${names(r.toColumns).join(',')})`,
			onDelete: r.onDelete,
			onUpdate: r.onUpdate
		}))
	};
}
