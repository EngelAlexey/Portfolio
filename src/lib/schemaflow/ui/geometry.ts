import { CARD_BORDER, CARD_WIDTH, HEADER_HEIGHT, LIST_PADDING, ROW_HEIGHT, tableHeight, type Relation, type Schema, type Table } from '../model/types';
import { isOneToOne } from '../model/ops';

export function rowCentre(table: Table, index: number): number {
	return table.y + CARD_BORDER + HEADER_HEIGHT + LIST_PADDING + index * ROW_HEIGHT + ROW_HEIGHT / 2;
}

export function cardHeight(table: Table, selected: boolean): number {
	return tableHeight(table) + (selected ? ROW_HEIGHT : 0);
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

export function edgeGeometry(schema: Schema, relation: Relation, tables: Map<string, Table>): EdgeGeometry | null {
	const from = tables.get(relation.fromTable);
	const to = tables.get(relation.toTable);
	if (!from || !to) return null;
	const fromIndex = from.columns.findIndex((c) => c.id === relation.fromColumns[0]);
	const toIndex = to.columns.findIndex((c) => c.id === relation.toColumns[0]);
	if (fromIndex === -1 || toIndex === -1) return null;
	const y1 = rowCentre(from, fromIndex);
	const y2 = rowCentre(to, toIndex);
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
