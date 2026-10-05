import { describe, expect, it } from 'vitest';
import { parseSql } from '../parse/sql-parse';
import { shape } from '../testing';
import { isOneToOne, findTableByName } from './ops';
import { planRelation } from './relate';
import type { Schema } from './types';

const sql = (code: string) => parseSql('postgres', code).schema;
const id = (schema: Schema, name: string) => findTableByName(schema, name)?.id ?? '';

const SHOP = sql(`
	CREATE TABLE customers (id UUID PRIMARY KEY, name TEXT);
	CREATE TABLE orders (id INT PRIMARY KEY, note TEXT, buyer UUID);
	CREATE TABLE tags (id INT PRIMARY KEY);
	CREATE TABLE seats (room INT, number INT, PRIMARY KEY (room, number));
	CREATE TABLE loose (label TEXT, code INT);
`);

describe('planRelation', () => {
	it('links one to many through a new column typed like the key', () => {
		const plan = planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'customers') });
		expect(plan).not.toBeNull();
		const result = shape(plan?.schema ?? SHOP);
		expect(result.tables[1]?.columns.at(-1)).toMatchObject({ name: 'customers_id', type: { kind: 'uuid' }, nullable: false });
		expect(result.relations).toEqual([{ from: 'orders(customers_id)', to: 'customers(id)', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }]);
		expect(plan?.label).toBe('orders.customers_id → customers.id');
		expect(plan?.tableId).toBe('');
		const relation = plan?.schema.relations[0];
		expect(plan?.relationId).toBe(relation?.id);
		expect(relation && plan && isOneToOne(plan.schema, relation)).toBe(false);
	});

	it('adds a unique constraint for one to one', () => {
		const plan = planRelation(SHOP, { kind: 'oneToOne', from: id(SHOP, 'orders'), to: id(SHOP, 'customers') });
		const relation = plan?.schema.relations[0];
		expect(relation && plan && isOneToOne(plan.schema, relation)).toBe(true);
		expect(shape(plan?.schema ?? SHOP).tables[1]?.uniques).toEqual([['customers_id']]);
	});

	it('creates a junction table with a composite key for many to many', () => {
		const plan = planRelation(SHOP, { kind: 'manyToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'tags') });
		const result = shape(plan?.schema ?? SHOP);
		expect(result.tables.at(-1)).toMatchObject({ name: 'orders_tags', primaryKey: ['orders_id', 'tags_id'] });
		expect(result.relations.map((r) => `${r.from}>${r.to}:${r.onDelete}`)).toEqual(['orders_tags(orders_id)>orders(id):CASCADE', 'orders_tags(tags_id)>tags(id):CASCADE']);
		expect(plan?.relationId).toBe('');
		expect(plan?.tableId).toBe(plan?.schema.tables.at(-1)?.id);
		expect(plan?.label).toBe('orders_tags');
	});

	it('refuses many to many from a table to itself', () => {
		expect(planRelation(SHOP, { kind: 'manyToMany', from: id(SHOP, 'tags'), to: id(SHOP, 'tags') })).toBeNull();
	});

	it('links a whole composite key with one column per key column', () => {
		const plan = planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'seats') });
		const result = shape(plan?.schema ?? SHOP);
		expect(result.tables[1]?.columns.slice(-2).map((c) => c.name)).toEqual(['seats_room', 'seats_number']);
		expect(result.relations).toEqual([{ from: 'orders(seats_room,seats_number)', to: 'seats(room,number)', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }]);
		expect(plan?.label).toBe('orders.(seats_room, seats_number) → seats.(room, number)');
	});

	it('uses an existing column when one is given', () => {
		const orders = SHOP.tables.find((table) => table.name === 'orders');
		const buyer = orders?.columns.find((column) => column.name === 'buyer');
		const plan = planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'customers'), fromColumn: buyer?.id });
		const result = shape(plan?.schema ?? SHOP);
		expect(result.tables[1]?.columns).toHaveLength(3);
		expect(result.relations).toEqual([{ from: 'orders(buyer)', to: 'customers(id)', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }]);
		expect(plan?.label).toBe('orders.buyer → customers.id');
	});

	it('ignores a source column that does not belong to the table', () => {
		const plan = planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'customers'), fromColumn: 'missing' });
		expect(plan?.label).toBe('orders.customers_id → customers.id');
	});

	it('points at a chosen column that is not the key and adds a column for it', () => {
		const customers = SHOP.tables.find((table) => table.name === 'customers');
		const name = customers?.columns.find((column) => column.name === 'name');
		const plan = planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'customers'), toColumn: name?.id });
		const result = shape(plan?.schema ?? SHOP);
		expect(result.tables[1]?.columns.at(-1)).toMatchObject({ name: 'customers_name', type: { kind: 'text' } });
		expect(result.relations).toEqual([{ from: 'orders(customers_name)', to: 'customers(name)', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }]);
	});

	it('falls back to the first column of a table without a key', () => {
		const plan = planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'loose') });
		expect(shape(plan?.schema ?? SHOP).relations).toEqual([{ from: 'orders(loose_label)', to: 'loose(label)', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }]);
	});

	it('links a table to itself', () => {
		const plan = planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'tags'), to: id(SHOP, 'tags') });
		expect(shape(plan?.schema ?? SHOP).relations).toEqual([{ from: 'tags(tags_id)', to: 'tags(id)', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }]);
	});

	it('returns null for unknown tables and leaves the schema untouched', () => {
		expect(planRelation(SHOP, { kind: 'oneToMany', from: 'missing', to: id(SHOP, 'customers') })).toBeNull();
		expect(planRelation(SHOP, { kind: 'oneToMany', from: id(SHOP, 'orders'), to: 'missing' })).toBeNull();
		expect(SHOP.relations).toHaveLength(0);
	});

	it('does not change the schema it receives', () => {
		const before = JSON.stringify(SHOP);
		planRelation(SHOP, { kind: 'oneToOne', from: id(SHOP, 'orders'), to: id(SHOP, 'customers') });
		planRelation(SHOP, { kind: 'manyToMany', from: id(SHOP, 'orders'), to: id(SHOP, 'tags') });
		expect(JSON.stringify(SHOP)).toBe(before);
	});
});
