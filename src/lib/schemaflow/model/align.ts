import { autoLayout } from './layout';
import { setTablePositions } from './ops';
import { CARD_WIDTH, tableHeight, type Schema, type Table } from './types';

export type Align = 'left' | 'top' | 'middle' | 'bottom';
export type Distribute = 'horizontal' | 'vertical';

export const MIN_GAP = 24;

type HeightOf = (table: Table) => number;

function picked(schema: Schema, ids: readonly string[]): Table[] {
	const wanted = new Set(ids);
	return schema.tables.filter((table) => wanted.has(table.id));
}

function moved(schema: Schema, positions: Map<string, { x: number; y: number }>): Schema {
	const changed = new Map([...positions].filter(([id, to]) => schema.tables.some((table) => table.id === id && (table.x !== to.x || table.y !== to.y))));
	return changed.size === 0 ? schema : setTablePositions(schema, changed);
}

export function alignTables(schema: Schema, ids: readonly string[], mode: Align, heightOf: HeightOf = tableHeight): Schema {
	const tables = picked(schema, ids);
	if (tables.length < 2) return schema;
	const top = Math.min(...tables.map((table) => table.y));
	const bottom = Math.max(...tables.map((table) => table.y + heightOf(table)));
	const left = Math.min(...tables.map((table) => table.x));
	const centre = Math.round((top + bottom) / 2);
	const positions = new Map<string, { x: number; y: number }>();
	for (const table of tables) {
		if (mode === 'left') positions.set(table.id, { x: left, y: table.y });
		else if (mode === 'top') positions.set(table.id, { x: table.x, y: top });
		else if (mode === 'bottom') positions.set(table.id, { x: table.x, y: Math.round(bottom - heightOf(table)) });
		else positions.set(table.id, { x: table.x, y: Math.round(centre - heightOf(table) / 2) });
	}
	return moved(schema, positions);
}

export function distributeTables(schema: Schema, ids: readonly string[], axis: Distribute, heightOf: HeightOf = tableHeight): Schema {
	const tables = picked(schema, ids);
	if (tables.length < 3) return schema;
	const horizontal = axis === 'horizontal';
	const size = (table: Table) => (horizontal ? CARD_WIDTH : heightOf(table));
	const start = (table: Table) => (horizontal ? table.x : table.y);
	const ordered = [...tables].sort((a, b) => start(a) - start(b) || (horizontal ? a.y - b.y : a.x - b.x));
	const first = ordered[0];
	const last = ordered[ordered.length - 1];
	if (!first || !last) return schema;
	const span = start(last) + size(last) - start(first);
	const room = span - ordered.reduce((sum, table) => sum + size(table), 0);
	const gap = Math.max(MIN_GAP, room / (ordered.length - 1));
	const positions = new Map<string, { x: number; y: number }>();
	let cursor = start(first);
	for (const table of ordered) {
		const at = Math.round(cursor);
		positions.set(table.id, horizontal ? { x: at, y: table.y } : { x: table.x, y: at });
		cursor += size(table) + gap;
	}
	return moved(schema, positions);
}

export function arrangeTables(schema: Schema, ids: readonly string[], heightOf: HeightOf = tableHeight): Schema {
	const tables = picked(schema, ids);
	if (tables.length < 2) return schema;
	const origin = { x: Math.min(...tables.map((table) => table.x)), y: Math.min(...tables.map((table) => table.y)) };
	return moved(schema, autoLayout(schema, origin, new Set(tables.map((table) => table.id)), heightOf));
}
