import { CARD_BORDER, CARD_WIDTH, HEADER_HEIGHT, LIST_PADDING, ROW_HEIGHT, tableHeight, type Relation, type Schema, type Table } from '../model/types';
import { isOneToOne, isUnique } from '../model/ops';

export const DENSITIES = ['full', 'keys', 'names'] as const;
export type Density = (typeof DENSITIES)[number];

export interface Shape {
	density: Density;
	keys: ReadonlyMap<string, ReadonlySet<string>>;
}

export const FULL: Shape = { density: 'full', keys: new Map() };

export function keyColumns(schema: Schema): Map<string, Set<string>> {
	const map = new Map<string, Set<string>>();
	const add = (tableId: string, columnId: string) => {
		let set = map.get(tableId);
		if (!set) {
			set = new Set();
			map.set(tableId, set);
		}
		set.add(columnId);
	};
	for (const table of schema.tables) {
		for (const id of table.primaryKey) add(table.id, id);
		for (const column of table.columns) if (isUnique(table, column.id)) add(table.id, column.id);
	}
	for (const relation of schema.relations) {
		for (const id of relation.fromColumns) add(relation.fromTable, id);
		for (const id of relation.toColumns) add(relation.toTable, id);
	}
	return map;
}

export function shapeOf(schema: Schema, density: Density): Shape {
	return { density, keys: density === 'keys' ? keyColumns(schema) : new Map() };
}

export function shownRows(table: Table, shape: Shape): number[] {
	if (shape.density === 'names') return [];
	if (shape.density === 'full') return table.columns.map((_, index) => index);
	const keys = shape.keys.get(table.id);
	return table.columns.flatMap((column, index) => (keys?.has(column.id) ? [index] : []));
}

export function cardHeight(table: Table, shape: Shape): number {
	if (shape.density === 'full') return tableHeight(table);
	if (shape.density === 'names') return CARD_BORDER * 2 + HEADER_HEIGHT;
	const shown = shownRows(table, shape).length;
	const rows = shown + (shown < table.columns.length ? 1 : 0);
	return CARD_BORDER * 2 + HEADER_HEIGHT + LIST_PADDING * 2 + Math.max(1, rows) * ROW_HEIGHT;
}

export function rowCentre(table: Table, index: number): number {
	return table.y + CARD_BORDER + HEADER_HEIGHT + LIST_PADDING + index * ROW_HEIGHT + ROW_HEIGHT / 2;
}

export function anchorY(table: Table, columnIndex: number, shape: Shape): number {
	if (shape.density === 'full') return rowCentre(table, columnIndex);
	const at = shownRows(table, shape).indexOf(columnIndex);
	return at === -1 ? table.y + CARD_BORDER + HEADER_HEIGHT / 2 : rowCentre(table, at);
}

export interface EdgeGeometry {
	path: string;
	childEnd: string;
	parentEnd: string;
	midX: number;
	midY: number;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

function barAt(x: number, y: number): string {
	return `M ${x} ${y - 7} L ${x} ${y + 7}`;
}

export function edgeGeometry(schema: Schema, relation: Relation, tables: Map<string, Table>, shape: Shape = FULL): EdgeGeometry | null {
	const from = tables.get(relation.fromTable);
	const to = tables.get(relation.toTable);
	if (!from || !to) return null;
	const fromIndex = from.columns.findIndex((c) => c.id === relation.fromColumns[0]);
	const toIndex = to.columns.findIndex((c) => c.id === relation.toColumns[0]);
	if (fromIndex === -1 || toIndex === -1) return null;
	const y1 = anchorY(from, fromIndex, shape);
	const y2 = anchorY(to, toIndex, shape);
	let x1: number;
	let x2: number;
	let d1: number;
	let d2: number;
	let path: string;
	if (from.id === to.id) {
		x1 = from.x + CARD_WIDTH;
		x2 = from.x + CARD_WIDTH;
		d1 = 1;
		d2 = 1;
		const reach = 56 + Math.abs(y2 - y1) * 0.15;
		path = `M ${x1} ${y1} C ${x1 + reach} ${y1}, ${x2 + reach} ${y2}, ${x2} ${y2}`;
	} else {
		const fromCentre = from.x + CARD_WIDTH / 2;
		const toCentre = to.x + CARD_WIDTH / 2;
		const overlapX = Math.abs(fromCentre - toCentre) < CARD_WIDTH * 0.6;
		if (overlapX) {
			x1 = from.x + CARD_WIDTH;
			x2 = to.x + CARD_WIDTH;
			d1 = 1;
			d2 = 1;
			const reach = 60;
			path = `M ${x1} ${y1} C ${x1 + reach} ${y1}, ${x2 + reach} ${y2}, ${x2} ${y2}`;
		} else {
			const leftToRight = fromCentre < toCentre;
			x1 = leftToRight ? from.x + CARD_WIDTH : from.x;
			x2 = leftToRight ? to.x : to.x + CARD_WIDTH;
			d1 = leftToRight ? 1 : -1;
			d2 = -d1;
			const bend = Math.max(40, Math.abs(x2 - x1) * 0.45);
			path = `M ${x1} ${y1} C ${x1 + d1 * bend} ${y1}, ${x2 + d2 * bend} ${y2}, ${x2} ${y2}`;
		}
	}
	const oneToOne = isOneToOne(schema, relation);
	const childEnd = oneToOne ? barAt(x1 + d1 * 9, y1) : `M ${x1 + d1 * 13} ${y1} L ${x1} ${y1 - 7} M ${x1 + d1 * 13} ${y1} L ${x1} ${y1} M ${x1 + d1 * 13} ${y1} L ${x1} ${y1 + 7}`;
	const nullable = relation.fromColumns.some((id) => from.columns.find((c) => c.id === id)?.nullable);
	let parentEnd = barAt(x2 + d2 * 9, y2);
	if (nullable) {
		const cx = x2 + d2 * 18;
		parentEnd += ` M ${cx + 4} ${y2} A 4 4 0 1 0 ${cx - 4} ${y2} A 4 4 0 1 0 ${cx + 4} ${y2}`;
	}
	return { path, childEnd, parentEnd, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2, x1, y1, x2, y2 };
}
