import { describe, expect, it } from 'vitest';
import { parseSql } from '../parse/sql-parse';
import { alignTables, arrangeTables, distributeTables, MIN_GAP } from './align';
import { CARD_WIDTH, tableHeight, type Schema, type Table } from './types';

const SQL = `
	CREATE TABLE a (id INT PRIMARY KEY, x INT);
	CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id), y INT, z INT, w INT);
	CREATE TABLE c (id INT PRIMARY KEY, b_id INT REFERENCES b(id));
	CREATE TABLE d (id INT PRIMARY KEY);
`;

const at = (schema: Schema, spots: Record<string, [number, number]>): Schema => ({
	...schema,
	tables: schema.tables.map((table) => {
		const spot = spots[table.name];
		return spot ? { ...table, x: spot[0], y: spot[1] } : table;
	})
});

const parsed = parseSql('postgres', SQL).schema;
const scattered = at(parsed, { a: [100, 40], b: [500, 300], c: [900, 120], d: [1300, 700] });
const ids = (schema: Schema, ...names: string[]) => names.map((name) => schema.tables.find((t) => t.name === name)?.id ?? '');
const get = (schema: Schema, name: string): Table => {
	const table = schema.tables.find((t) => t.name === name);
	if (!table) throw new Error(name);
	return table;
};
const spot = (schema: Schema, name: string) => [get(schema, name).x, get(schema, name).y];

describe('alignTables', () => {
	it('puts the tables on the leftmost x', () => {
		const next = alignTables(scattered, ids(scattered, 'a', 'b', 'c'), 'left');
		expect(spot(next, 'a')).toEqual([100, 40]);
		expect(spot(next, 'b')).toEqual([100, 300]);
		expect(spot(next, 'c')).toEqual([100, 120]);
	});

	it('puts the tables on the highest y', () => {
		const next = alignTables(scattered, ids(scattered, 'a', 'b', 'c'), 'top');
		expect([get(next, 'a').y, get(next, 'b').y, get(next, 'c').y]).toEqual([40, 40, 40]);
		expect(get(next, 'b').x).toBe(500);
	});

	it('lines up the bottom edges', () => {
		const next = alignTables(scattered, ids(scattered, 'a', 'b', 'c'), 'bottom');
		const bottoms = ['a', 'b', 'c'].map((name) => get(next, name).y + tableHeight(get(next, name)));
		expect(new Set(bottoms).size).toBe(1);
		expect(bottoms[0]).toBe(300 + tableHeight(get(scattered, 'b')));
	});

	it('lines up the middle of the tables', () => {
		const next = alignTables(scattered, ids(scattered, 'a', 'b', 'c'), 'middle');
		const middles = ['a', 'b', 'c'].map((name) => get(next, name).y + tableHeight(get(next, name)) / 2);
		expect(new Set(middles).size).toBe(1);
	});

	it('leaves the other tables where they were', () => {
		const next = alignTables(scattered, ids(scattered, 'a', 'b'), 'top');
		expect(get(next, 'c')).toBe(get(scattered, 'c'));
		expect(get(next, 'd')).toBe(get(scattered, 'd'));
	});

	it('does nothing with fewer than two tables', () => {
		expect(alignTables(scattered, ids(scattered, 'a'), 'left')).toBe(scattered);
		expect(alignTables(scattered, [], 'left')).toBe(scattered);
		expect(alignTables(scattered, ['missing', ...ids(scattered, 'a')], 'left')).toBe(scattered);
	});

	it('gives the same result when applied twice and returns the same schema when nothing moves', () => {
		for (const mode of ['left', 'top', 'middle', 'bottom'] as const) {
			const once = alignTables(scattered, ids(scattered, 'a', 'b', 'c'), mode);
			expect(alignTables(once, ids(once, 'a', 'b', 'c'), mode)).toBe(once);
		}
	});

	it('does not change the schema it receives', () => {
		const before = JSON.stringify(scattered);
		alignTables(scattered, ids(scattered, 'a', 'b', 'c'), 'bottom');
		expect(JSON.stringify(scattered)).toBe(before);
	});

	it('uses the height function it is given', () => {
		const short = () => 100;
		const next = alignTables(scattered, ids(scattered, 'a', 'b'), 'bottom', short);
		expect(get(next, 'a').y + 100).toBe(get(next, 'b').y + 100);
	});
});

describe('distributeTables', () => {
	it('spreads the tables so the space between neighbours is the same horizontally', () => {
		const next = distributeTables(scattered, ids(scattered, 'a', 'b', 'c', 'd'), 'horizontal');
		const xs = ['a', 'b', 'c', 'd'].map((name) => get(next, name).x);
		const gaps = xs.slice(1).map((x, i) => x - (xs[i] ?? 0) - CARD_WIDTH);
		expect(xs[0]).toBe(100);
		expect(xs[3]).toBe(1300);
		expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1);
	});

	it('keeps the first and last tables of the axis in place', () => {
		const next = distributeTables(scattered, ids(scattered, 'a', 'b', 'c'), 'horizontal');
		expect(get(next, 'a').x).toBe(100);
		expect(get(next, 'c').x).toBe(900);
		expect(get(next, 'b').x).toBe(500);
	});

	it('moves only along the chosen axis', () => {
		const next = distributeTables(scattered, ids(scattered, 'a', 'b', 'c', 'd'), 'horizontal');
		for (const name of ['a', 'b', 'c', 'd']) expect(get(next, name).y).toBe(get(scattered, name).y);
		const down = distributeTables(scattered, ids(scattered, 'a', 'b', 'c', 'd'), 'vertical');
		for (const name of ['a', 'b', 'c', 'd']) expect(get(down, name).x).toBe(get(scattered, name).x);
	});

	it('leaves the same gap between the edges when the heights differ', () => {
		const next = distributeTables(scattered, ids(scattered, 'a', 'b', 'c', 'd'), 'vertical');
		const order = ['a', 'c', 'b', 'd'].map((name) => get(next, name));
		const gaps = order.slice(1).map((table, i) => {
			const before = order[i] as Table;
			return table.y - (before.y + tableHeight(before));
		});
		expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1);
	});

	it('never leaves less than the minimum gap between tables', () => {
		const crowded = at(parsed, { a: [0, 0], b: [10, 0], c: [20, 0], d: [30, 0] });
		const next = distributeTables(crowded, ids(crowded, 'a', 'b', 'c'), 'horizontal');
		const xs = ['a', 'b', 'c'].map((name) => get(next, name).x);
		expect(xs[1] ?? 0).toBeGreaterThanOrEqual((xs[0] ?? 0) + CARD_WIDTH + MIN_GAP);
		expect(xs[2] ?? 0).toBeGreaterThanOrEqual((xs[1] ?? 0) + CARD_WIDTH + MIN_GAP);
	});

	it('does nothing with fewer than three tables', () => {
		expect(distributeTables(scattered, ids(scattered, 'a', 'b'), 'horizontal')).toBe(scattered);
		expect(distributeTables(scattered, [], 'vertical')).toBe(scattered);
	});

	it('gives the same result when applied twice', () => {
		for (const axis of ['horizontal', 'vertical'] as const) {
			const once = distributeTables(scattered, ids(scattered, 'a', 'b', 'c', 'd'), axis);
			expect(distributeTables(once, ids(once, 'a', 'b', 'c', 'd'), axis)).toBe(once);
		}
	});
});

describe('arrangeTables', () => {
	it('moves only the chosen tables and keeps the top left corner of the selection', () => {
		const next = arrangeTables(scattered, ids(scattered, 'a', 'b', 'c'));
		expect(get(next, 'd')).toBe(get(scattered, 'd'));
		const moved = ['a', 'b', 'c'].map((name) => get(next, name));
		expect(Math.min(...moved.map((table) => table.x))).toBe(100);
		expect(Math.min(...moved.map((table) => table.y))).toBe(40);
	});

	it('places a table to the right of the table it points at', () => {
		const next = arrangeTables(scattered, ids(scattered, 'a', 'b', 'c'));
		expect(get(next, 'b').x).toBeGreaterThan(get(next, 'a').x);
		expect(get(next, 'c').x).toBeGreaterThan(get(next, 'b').x);
	});

	it('does nothing with fewer than two tables', () => {
		expect(arrangeTables(scattered, ids(scattered, 'a'))).toBe(scattered);
	});

	it('gives the same result when applied twice', () => {
		const once = arrangeTables(scattered, ids(scattered, 'a', 'b', 'c'));
		expect(arrangeTables(once, ids(once, 'a', 'b', 'c'))).toBe(once);
	});

	it('uses the height function it is given', () => {
		const everyone = ids(scattered, 'a', 'b', 'c', 'd');
		const normal = get(arrangeTables(scattered, everyone), 'd');
		const tall = get(arrangeTables(scattered, everyone, () => 500), 'd');
		expect(tall.y).toBeGreaterThan(normal.y);
	});
});
