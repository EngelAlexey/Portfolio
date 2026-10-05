import { CARD_WIDTH, tableHeight, type Schema, type Table } from './types';

const GAP_X = 110;
const GAP_Y = 48;

export function autoLayout(schema: Schema, origin = { x: 40, y: 40 }, onlyIds?: ReadonlySet<string>, heightOf: (table: Table) => number = tableHeight): Map<string, { x: number; y: number }> {
	const tables = schema.tables.filter((t) => !onlyIds || onlyIds.has(t.id));
	const ids = new Set(tables.map((t) => t.id));
	const parents = new Map<string, Set<string>>();
	const neighbours = new Map<string, Set<string>>();
	for (const t of tables) {
		parents.set(t.id, new Set());
		neighbours.set(t.id, new Set());
	}
	for (const r of schema.relations) {
		if (!ids.has(r.fromTable) || !ids.has(r.toTable) || r.fromTable === r.toTable) continue;
		parents.get(r.fromTable)?.add(r.toTable);
		neighbours.get(r.fromTable)?.add(r.toTable);
		neighbours.get(r.toTable)?.add(r.fromTable);
	}
	const layer = new Map<string, number>();
	const visiting = new Set<string>();
	const depth = (id: string): number => {
		const known = layer.get(id);
		if (known !== undefined) return known;
		if (visiting.has(id)) return 0;
		visiting.add(id);
		let value = 0;
		for (const parent of parents.get(id) ?? []) value = Math.max(value, depth(parent) + 1);
		visiting.delete(id);
		layer.set(id, value);
		return value;
	};
	const connected = tables.filter((t) => (neighbours.get(t.id)?.size ?? 0) > 0);
	const isolated = tables.filter((t) => (neighbours.get(t.id)?.size ?? 0) === 0);
	for (const t of connected) depth(t.id);

	const columns: string[][] = [];
	for (const t of connected) {
		const l = layer.get(t.id) ?? 0;
		(columns[l] ??= []).push(t.id);
	}
	const order = new Map<string, number>();
	const reindex = () => columns.forEach((col) => col.forEach((id, i) => order.set(id, i)));
	reindex();
	for (let pass = 0; pass < 4; pass++) {
		for (let l = 1; l < columns.length; l++) {
			const col = columns[l];
			if (!col) continue;
			const barycentre = (id: string) => {
				const ns = [...(neighbours.get(id) ?? [])].filter((n) => (layer.get(n) ?? -1) < l);
				return ns.length === 0 ? (order.get(id) ?? 0) : ns.reduce((s, n) => s + (order.get(n) ?? 0), 0) / ns.length;
			};
			col.sort((a, b) => barycentre(a) - barycentre(b));
			reindex();
		}
	}

	const byId = new Map(tables.map((t) => [t.id, t]));
	const positions = new Map<string, { x: number; y: number }>();
	let bottom = origin.y;
	columns.forEach((col, l) => {
		let y = origin.y;
		for (const id of col) {
			const table = byId.get(id);
			if (!table) continue;
			positions.set(id, { x: origin.x + l * (CARD_WIDTH + GAP_X), y });
			y += heightOf(table) + GAP_Y;
		}
		bottom = Math.max(bottom, y);
	});
	if (isolated.length > 0) {
		const perRow = Math.max(3, columns.length);
		let rowTop = connected.length > 0 ? bottom + GAP_Y : origin.y;
		for (let i = 0; i < isolated.length; i += perRow) {
			const row = isolated.slice(i, i + perRow);
			let tallest = 0;
			row.forEach((table, k) => {
				positions.set(table.id, { x: origin.x + k * (CARD_WIDTH + GAP_X), y: rowTop });
				tallest = Math.max(tallest, heightOf(table));
			});
			rowTop += tallest + GAP_Y;
		}
	}
	return positions;
}
