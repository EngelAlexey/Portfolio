import { describe, expect, it } from 'vitest';
import { parseSql } from '../parse/sql-parse';
import { searchSchema, SEARCH_LIMIT, type SearchHit } from './search';
import type { Schema } from './types';

const build = (sql: string): Schema => parseSql('postgres', sql).schema;

const label = (schema: Schema, hit: SearchHit): string => {
	const table = schema.tables.find((t) => t.id === hit.table);
	if (hit.kind === 'table') return table?.name ?? '?';
	return `${table?.name}.${table?.columns.find((c) => c.id === hit.column)?.name}`;
};
const find = (schema: Schema, query: string, limit?: number) => searchSchema(schema, query, limit).map((hit) => label(schema, hit));

const SHOP = build(`
	CREATE TABLE users (id INT PRIMARY KEY, email TEXT, display_name TEXT, "createdAt" TEXT);
	CREATE TABLE orders (id INT PRIMARY KEY, user_id INT, email TEXT, total INT);
	CREATE TABLE app_users (id INT PRIMARY KEY, label TEXT);
	CREATE TABLE superuser (id INT PRIMARY KEY);
	CREATE TABLE categorías (id INT PRIMARY KEY, título TEXT);
`);

describe('searchSchema', () => {
	it('lists the tables in order when the query is empty', () => {
		expect(find(SHOP, '')).toEqual(['users', 'orders', 'app_users', 'superuser', 'categorías']);
		expect(find(SHOP, '   ')).toEqual(['users', 'orders', 'app_users', 'superuser', 'categorías']);
	});

	it('puts an exact name before a prefix, a word start and a plain match', () => {
		const schema = build('CREATE TABLE subaccount (id INT PRIMARY KEY); CREATE TABLE old_account (id INT PRIMARY KEY); CREATE TABLE accounts (id INT PRIMARY KEY); CREATE TABLE account (id INT PRIMARY KEY);');
		expect(find(schema, 'account')).toEqual(['account', 'accounts', 'old_account', 'subaccount']);
	});

	it('ignores case and accents in the query and in the names', () => {
		expect(find(SHOP, 'CATEGORIAS')).toEqual(['categorías']);
		expect(find(SHOP, 'categorías')).toEqual(['categorías']);
		expect(find(SHOP, 'titulo')).toEqual(['categorías.título']);
	});

	it('matches the start of a word inside a snake_case or camelCase name', () => {
		expect(find(SHOP, 'name')).toEqual(['users.display_name']);
		expect(find(SHOP, 'at')).toContain('users.createdAt');
		expect(find(SHOP, 'created')).toEqual(['users.createdAt']);
	});

	it('finds columns by name and does not list the columns of a table that only matches by name', () => {
		expect(find(SHOP, 'email')).toEqual(['users.email', 'orders.email']);
		expect(find(SHOP, 'orders')).toEqual(['orders']);
	});

	it('lists tables before columns when the match is equally good', () => {
		const schema = build('CREATE TABLE price (id INT PRIMARY KEY, price INT); CREATE TABLE items (price INT);');
		expect(find(schema, 'price')).toEqual(['price', 'price.price', 'items.price']);
	});

	it('narrows a column search with the table name in the form table.column or table column', () => {
		expect(find(SHOP, 'orders.email')).toEqual(['orders.email']);
		expect(find(SHOP, 'users email')).toEqual(['users.email']);
		expect(find(SHOP, 'use.em')).toEqual(['users.email']);
		expect(find(SHOP, 'orders.nothing')).toEqual([]);
	});

	it('matches several words against one table name', () => {
		expect(find(SHOP, 'app users')).toEqual(['app_users']);
	});

	it('returns nothing when nothing matches', () => {
		expect(find(SHOP, 'zzz')).toEqual([]);
	});

	it('returns at most the limit', () => {
		const many = build(Array.from({ length: 40 }, (_, i) => `CREATE TABLE t${i} (id INT PRIMARY KEY);`).join('\n'));
		expect(searchSchema(many, '')).toHaveLength(SEARCH_LIMIT);
		expect(searchSchema(many, 't')).toHaveLength(SEARCH_LIMIT);
		expect(searchSchema(many, 't', 5)).toHaveLength(5);
	});

	it('returns ids that exist in the schema', () => {
		for (const hit of searchSchema(SHOP, 'e')) {
			const table = SHOP.tables.find((t) => t.id === hit.table);
			expect(table).toBeDefined();
			if (hit.kind === 'column') expect(table?.columns.some((c) => c.id === hit.column)).toBe(true);
		}
	});
});
