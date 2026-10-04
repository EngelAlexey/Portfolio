import type { Relation, Table } from './types';

export function dropOrder(tables: readonly Table[], relations: readonly Relation[]): { order: Table[]; cyclic: Relation[] } {
	const ids = new Set(tables.map((t) => t.id));
	const referencing = new Map<string, Relation[]>();
	for (const r of relations) {
		if (!ids.has(r.fromTable) || !ids.has(r.toTable) || r.fromTable === r.toTable) continue;
		referencing.set(r.toTable, [...(referencing.get(r.toTable) ?? []), r]);
	}
	const byId = new Map(tables.map((t) => [t.id, t]));
	const order: Table[] = [];
	const cyclic: Relation[] = [];
	const state = new Map<string, 'open' | 'done'>();
	const visit = (table: Table) => {
		if (state.has(table.id)) return;
		state.set(table.id, 'open');
		for (const r of referencing.get(table.id) ?? []) {
			const from = byId.get(r.fromTable);
			if (!from) continue;
			if (state.get(from.id) === 'open') cyclic.push(r);
			else visit(from);
		}
		state.set(table.id, 'done');
		order.push(table);
	};
	tables.forEach(visit);
	return { order, cyclic };
}
