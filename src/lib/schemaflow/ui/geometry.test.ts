import { describe, expect, it } from 'vitest';
import { connectColumns, findTableByName } from '../model/ops';
import { CARD_BORDER, HEADER_HEIGHT, LIST_PADDING, ROW_HEIGHT, tableHeight, type Schema, type Table } from '../model/types';
import { parseSql } from '../parse/sql-parse';
import { anchorY, cardHeight, edgeGeometry, FULL, keyColumns, rowCentre, shapeOf, shownRows } from './geometry';

const SQL = `
	CREATE TABLE customers (id INT PRIMARY KEY, name TEXT, email TEXT UNIQUE, bio TEXT);
	CREATE TABLE orders (id INT PRIMARY KEY, note TEXT, customer_id INT REFERENCES customers(id), total INT, code TEXT);
	CREATE TABLE logs (message TEXT, level INT);
	CREATE TABLE codes (code TEXT PRIMARY KEY, label TEXT);
`;

const place = (schema: Schema): Schema => ({ ...schema, tables: schema.tables.map((table, i) => ({ ...table, x: i * 400, y: 100 + i * 10 })) });
const base = place(parseSql('postgres', SQL).schema);
const table = (schema: Schema, name: string): Table => {
	const found = findTableByName(schema, name);
	if (!found) throw new Error(name);
	return found;
};
const names = (t: Table, indexes: number[]) => indexes.map((i) => t.columns[i]?.name);

describe('key columns', () => {
	it('lists primary keys, unique columns and both ends of every relation', () => {
		const keys = keyColumns(base);
		const customers = table(base, 'customers');
		const orders = table(base, 'orders');
		const named = (t: Table) => t.columns.filter((c) => keys.get(t.id)?.has(c.id)).map((c) => c.name);
		expect(named(customers)).toEqual(['id', 'email']);
		expect(named(orders)).toEqual(['id', 'customer_id']);
		expect(named(table(base, 'logs'))).toEqual([]);
	});

	it('counts a column that a relation points at even when it is not a key', () => {
		const customers = table(base, 'customers');
		const orders = table(base, 'orders');
		const linked = connectColumns(base, {
			fromTable: orders.id,
			fromColumns: [orders.columns.find((c) => c.name === 'note')?.id ?? ''],
			toTable: customers.id,
			toColumns: [customers.columns.find((c) => c.name === 'name')?.id ?? '']
		}).schema;
		const keys = keyColumns(linked);
		expect([...(keys.get(customers.id) ?? [])].map((id) => customers.columns.find((c) => c.id === id)?.name).sort()).toEqual(['email', 'id', 'name']);
		expect([...(keys.get(orders.id) ?? [])].map((id) => orders.columns.find((c) => c.id === id)?.name).sort()).toEqual(['customer_id', 'id', 'note']);
	});
});

describe('visible rows', () => {
	it('shows every column in the full view', () => {
		expect(shownRows(table(base, 'orders'), FULL)).toEqual([0, 1, 2, 3, 4]);
	});

	it('shows no column when only names are shown', () => {
		expect(shownRows(table(base, 'orders'), shapeOf(base, 'names'))).toEqual([]);
	});

	it('shows only key columns, in table order, when only keys are shown', () => {
		const shape = shapeOf(base, 'keys');
		expect(names(table(base, 'customers'), shownRows(table(base, 'customers'), shape))).toEqual(['id', 'email']);
		expect(names(table(base, 'orders'), shownRows(table(base, 'orders'), shape))).toEqual(['id', 'customer_id']);
		expect(shownRows(table(base, 'logs'), shape)).toEqual([]);
	});

	it('only builds the key map for the keys view', () => {
		expect(shapeOf(base, 'full').keys.size).toBe(0);
		expect(shapeOf(base, 'names').keys.size).toBe(0);
		expect(shapeOf(base, 'keys').keys.size).toBeGreaterThan(0);
	});
});

describe('card height', () => {
	it('matches the model height in the full view', () => {
		for (const t of base.tables) expect(cardHeight(t, FULL)).toBe(tableHeight(t));
	});

	it('is the header alone when only names are shown', () => {
		const shape = shapeOf(base, 'names');
		for (const t of base.tables) expect(cardHeight(t, shape)).toBe(CARD_BORDER * 2 + HEADER_HEIGHT);
	});

	it('adds a row for the hidden columns when only keys are shown', () => {
		const shape = shapeOf(base, 'keys');
		const frame = CARD_BORDER * 2 + HEADER_HEIGHT + LIST_PADDING * 2;
		expect(cardHeight(table(base, 'customers'), shape)).toBe(frame + 3 * ROW_HEIGHT);
		expect(cardHeight(table(base, 'logs'), shape)).toBe(frame + ROW_HEIGHT);
	});

	it('adds no extra row when every column is a key', () => {
		const shape = shapeOf(base, 'keys');
		const frame = CARD_BORDER * 2 + HEADER_HEIGHT + LIST_PADDING * 2;
		const codes = table(base, 'codes');
		expect(cardHeight({ ...codes, columns: codes.columns.slice(0, 1) }, shape)).toBe(frame + ROW_HEIGHT);
	});

	it('is never taller than the full view', () => {
		for (const density of ['keys', 'names'] as const) {
			const shape = shapeOf(base, density);
			for (const t of base.tables) expect(cardHeight(t, shape)).toBeLessThanOrEqual(tableHeight(t));
		}
	});
});

describe('anchors', () => {
	const customers = table(base, 'customers');
	const index = (name: string) => customers.columns.findIndex((c) => c.name === name);

	it('use the row of the column in the full view', () => {
		expect(anchorY(customers, index('email'), FULL)).toBe(rowCentre(customers, 2));
	});

	it('count only the visible rows when only keys are shown', () => {
		const shape = shapeOf(base, 'keys');
		expect(anchorY(customers, index('id'), shape)).toBe(rowCentre(customers, 0));
		expect(anchorY(customers, index('email'), shape)).toBe(rowCentre(customers, 1));
	});

	it('fall back to the middle of the header for a hidden column and in the names view', () => {
		const header = customers.y + CARD_BORDER + HEADER_HEIGHT / 2;
		expect(anchorY(customers, index('name'), shapeOf(base, 'keys'))).toBe(header);
		expect(anchorY(customers, index('id'), shapeOf(base, 'names'))).toBe(header);
	});

	it('stay inside the card of every density', () => {
		for (const density of ['full', 'keys', 'names'] as const) {
			const shape = shapeOf(base, density);
			for (const t of base.tables) {
				t.columns.forEach((_, i) => {
					const y = anchorY(t, i, shape);
					expect(y).toBeGreaterThan(t.y);
					expect(y).toBeLessThan(t.y + cardHeight(t, shape));
				});
			}
		}
	});
});

describe('edges', () => {
	const tables = new Map(base.tables.map((t) => [t.id, t]));
	const relation = base.relations[0];

	it('end on the rows of both columns in the full view', () => {
		const orders = table(base, 'orders');
		const customers = table(base, 'customers');
		const geometry = edgeGeometry(base, relation as NonNullable<typeof relation>, tables);
		expect(geometry?.y1).toBe(rowCentre(orders, 2));
		expect(geometry?.y2).toBe(rowCentre(customers, 0));
	});

	it('end on the visible key rows when only keys are shown', () => {
		const orders = table(base, 'orders');
		const customers = table(base, 'customers');
		const geometry = edgeGeometry(base, relation as NonNullable<typeof relation>, tables, shapeOf(base, 'keys'));
		expect(geometry?.y1).toBe(rowCentre(orders, 1));
		expect(geometry?.y2).toBe(rowCentre(customers, 0));
	});

	it('end on the headers when only names are shown', () => {
		const orders = table(base, 'orders');
		const customers = table(base, 'customers');
		const geometry = edgeGeometry(base, relation as NonNullable<typeof relation>, tables, shapeOf(base, 'names'));
		expect(geometry?.y1).toBe(orders.y + CARD_BORDER + HEADER_HEIGHT / 2);
		expect(geometry?.y2).toBe(customers.y + CARD_BORDER + HEADER_HEIGHT / 2);
	});

	it('keep every relation anchored inside both cards in every density', () => {
		const linked = connectColumns(base, {
			fromTable: table(base, 'orders').id,
			fromColumns: [table(base, 'orders').columns.find((c) => c.name === 'code')?.id ?? ''],
			toTable: table(base, 'codes').id,
			toColumns: [table(base, 'codes').columns[0]?.id ?? '']
		}).schema;
		const map = new Map(linked.tables.map((t) => [t.id, t]));
		for (const density of ['full', 'keys', 'names'] as const) {
			const shape = shapeOf(linked, density);
			for (const r of linked.relations) {
				const g = edgeGeometry(linked, r, map, shape);
				const from = map.get(r.fromTable);
				const to = map.get(r.toTable);
				expect(g).not.toBeNull();
				if (!g || !from || !to) continue;
				expect(g.y1).toBeGreaterThan(from.y);
				expect(g.y1).toBeLessThan(from.y + cardHeight(from, shape));
				expect(g.y2).toBeGreaterThan(to.y);
				expect(g.y2).toBeLessThan(to.y + cardHeight(to, shape));
			}
		}
	});
});
