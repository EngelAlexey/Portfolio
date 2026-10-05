import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newColumn } from '../model/ops';
import type { Column, LogicalType } from '../model/types';
import { rng } from '../testing-random';
import { checksOf, evaluateCheck, parseCheck, repair, type Field, type Value } from './sample-checks';

const COUNT = Number(process.env.SF_CHECKS ?? 400);

let db: PGlite;

beforeAll(async () => {
	db = new PGlite();
	await db.waitReady;
}, 60_000);

afterAll(async () => {
	await db.close();
});

describe('evaluating a CHECK like PostgreSQL does', () => {
	const cases: [string, Record<string, Value>, Value | undefined][] = [
		['(price >= 0)', { price: 5 }, true],
		['(price >= 0)', { price: -1 }, false],
		['(price >= 0)', { price: null }, null],
		['(qty > 0 AND qty < 10)', { qty: 5 }, true],
		['(qty > 0 AND qty < 10)', { qty: 50 }, false],
		['(a IS NOT NULL OR b IS NOT NULL)', { a: null, b: 1 }, true],
		['(a IS NOT NULL OR b IS NOT NULL)', { a: null, b: null }, false],
		["(status IN ('a', 'b'))", { status: 'a' }, true],
		["(status IN ('a', 'b'))", { status: 'z' }, false],
		["(status NOT IN ('a', 'b'))", { status: 'z' }, true],
		["(status = ANY (ARRAY['a', 'b']))", { status: 'b' }, true],
		['(rating BETWEEN 1 AND 5)', { rating: 5 }, true],
		['(rating BETWEEN 1 AND 5)', { rating: 6 }, false],
		['(rating NOT BETWEEN 1 AND 5)', { rating: 6 }, true],
		['(char_length(name) >= 3)', { name: 'abc' }, true],
		['(char_length(name) >= 3)', { name: 'ab' }, false],
		["(email ~* '^[^@]+@[^@]+$')", { email: 'A@B' }, true],
		["(email ~ '^[a-z]+$')", { email: 'ABC' }, false],
		["(name LIKE 'A%')", { name: 'Ab' }, true],
		["(name NOT ILIKE 'a%')", { name: 'Ab' }, false],
		['("End" > "Start")', { End: '2026-02-01', Start: '2026-01-01' }, true],
		['(end_date >= start_date)', { end_date: '2026-01-01', start_date: '2026-01-02' }, false],
		['(qty % 2 = 0)', { qty: 4 }, true],
		['(total = subtotal + tax)', { total: 3, subtotal: 1, tax: 2 }, true],
		["(lower(code) = code)", { code: 'abc' }, true],
		['(code::text ~ $$x$$)', { code: 1 }, undefined],
		['(now() > created_at)', { created_at: '2020-01-01' }, undefined],
		['(missing > 0)', { price: 1 }, undefined],
		['(price > )', { price: 1 }, undefined]
	];

	for (const [source, values, expected] of cases) {
		it(`${source} with ${JSON.stringify(values)} is ${expected}`, () => {
			expect(evaluateCheck(source, values)).toBe(expected);
		});
	}

	it('still decides when one side is unknown but the other settles it', () => {
		expect(evaluateCheck('(price > 0 OR now() > created_at)', { price: 1, created_at: 'x' })).toBe(true);
		expect(evaluateCheck('(price > 0 AND now() > created_at)', { price: -1, created_at: 'x' })).toBe(false);
		expect(evaluateCheck('(price > 0 AND now() > created_at)', { price: 1, created_at: 'x' })).toBeUndefined();
	});
});

describe('reading the CHECK of a table', () => {
	const users = { id: 'u', name: 'Users', x: 0, y: 0, columns: [], primaryKey: [], uniques: [], indexes: [] };
	const extra = (sql: string) => ({ id: sql, dialect: 'postgres' as const, sql, placement: 'after' as const });

	it('finds the checks of that table only, with or without a name', () => {
		const found = checksOf(users, [
			extra('ALTER TABLE "Users" ADD CHECK (age >= 18)'),
			extra('ALTER TABLE "Users" ADD CONSTRAINT "adult" CHECK (age >= 18) NOT VALID'),
			extra('ALTER TABLE users ADD CHECK (age >= 1)'),
			extra('ALTER TABLE "Orders" ADD CHECK (total > 0)'),
			extra('CREATE INDEX i ON "Users" (age)')
		]);
		expect(found).toHaveLength(2);
	});

	it('ignores what it cannot read', () => {
		expect(parseCheck('(a >> 1)')).toBeNull();
		expect(parseCheck("(a ~ 'x'")).toBeNull();
		expect(parseCheck('(a IS DISTINCT FROM b)')).toBeNull();
	});
});

describe('repairing a row', () => {
	const field = (name: string, type: LogicalType, cell: string | null, fixed = false): Field => ({ column: newColumn(name, type) as Column, type, cell, fixed });
	const checks = (...sources: string[]) => sources.map((source) => parseCheck(source)).filter((check): check is NonNullable<typeof check> => check !== null);

	it('leaves a valid row alone', () => {
		expect(repair(checks('(qty > 0)'), [field('qty', { kind: 'int' }, '10')], 1)).toBeNull();
	});

	it('moves a number past its limit, a different one for each row', () => {
		const limit = checks('(qty > 100)');
		const rows = [1, 2, 3].map((n) => repair(limit, [field('qty', { kind: 'int' }, String(n * 10))], n)?.[0]);
		expect(rows).toEqual(['101', '102', '103']);
	});

	it('picks the values the list allows, one per row', () => {
		const list = checks("(status IN ('open', 'closed', 'pending'))");
		const rows = [1, 2, 3].map((n) => repair(list, [field('status', { kind: 'varchar', length: 20 }, "'active'")], n)?.[0]);
		expect(rows).toEqual(["'open'", "'closed'", "'pending'"]);
	});

	it('keeps text inside the length of the column', () => {
		const long = checks('(char_length(code) = 12)');
		expect(repair(long, [field('code', { kind: 'varchar', length: 5 }, "'abc'")], 1)).toBeNull();
		expect(repair(long, [field('code', { kind: 'varchar', length: 20 }, "'abc'")], 1)).toEqual(["'xxxxxxxxxxxx'"]);
	});

	it('orders two dates', () => {
		const range = checks('(ends_at > starts_at)');
		const fixed = repair(range, [field('starts_at', { kind: 'date' }, "'2026-01-01'"), field('ends_at', { kind: 'date' }, "'2026-01-01'")], 1);
		expect(fixed).toEqual(["'2026-01-01'", "'2026-02-01'"]);
	});

	it('fixes independent checks one by one and related checks together', () => {
		const several = checks('(qty > 500)', '(qty < price)', "(phone = ANY (ARRAY['a', 'b']))");
		const fixed = repair(several, [field('qty', { kind: 'int' }, '10'), field('price', { kind: 'decimal', precision: 10, scale: 2 }, '10.50'), field('phone', { kind: 'varchar', length: 30 }, "'555-0101'")], 1);
		expect(fixed).not.toBeNull();
		const [qty, price, phone] = fixed ?? [];
		expect(Number(qty)).toBeGreaterThan(500);
		expect(Number(qty)).toBeLessThan(Number(price));
		expect(phone).toBe("'a'");
	});

	it('never touches a column that points to another table', () => {
		const tied = [field('parent_id', { kind: 'int' }, '1', true)];
		expect(repair(checks('(parent_id > 100)'), tied, 1)).toBeNull();
	});

	it('gives up quietly when nothing it can try works', () => {
		expect(repair(checks("(code ~ '^[0-9]{13}$')"), [field('code', { kind: 'varchar', length: 20 }, "'abc'")], 1)).toBeNull();
	});
});

const INTS = [-3, 0, 1, 2, 7, 10, 25, 100];
const NUMS = [0.5, 1.5, 10.5, 20, 99.5];
const TEXTS = ['', 'abc', 'ABC', 'Ejemplo 1', 'a1', 'x', 'user@example.com', ' pad '];
const DATES = ['2026-01-01', '2026-01-05', '2025-12-31'];

function expression(seed: number): { sql: string; rows: Record<string, Value>[] } {
	const r = rng(seed);
	const pick = <T>(list: readonly T[]): T => list[Math.floor(r() * list.length)] as T;
	const chance = (p: number) => r() < p;
	const wrap = (n: number) => (n < 0 ? `(${n})` : String(n));
	const number = (depth: number): string => {
		const options: (() => string)[] = [() => wrap(pick(INTS)), () => String(pick(NUMS)), () => 'a', () => 'b', () => 'p'];
		if (depth > 0) {
			options.push(
				() => `(${number(depth - 1)} ${pick(['+', '-', '*'])} ${number(depth - 1)})`,
				() => `abs(${number(depth - 1)})`,
				() => `char_length(${text(depth - 1)})`,
				() => `coalesce(${number(depth - 1)}, ${wrap(pick(INTS))})`,
				() => `(${number(depth - 1)} % ${pick([2, 3, 7])})`,
				() => `(-${number(depth - 1)})`
			);
		}
		return pick(options)();
	};
	const text = (depth: number): string => {
		const options: (() => string)[] = [() => `'${pick(TEXTS)}'`, () => 's', () => 't'];
		if (depth > 0) options.push(() => `lower(${text(depth - 1)})`, () => `upper(${text(depth - 1)})`, () => `trim(${text(depth - 1)})`, () => `(${text(depth - 1)} || ${text(depth - 1)})`, () => `coalesce(${text(depth - 1)}, 'x')`);
		return pick(options)();
	};
	const date = () => pick([() => 'd', () => 'e', () => `'${pick(DATES)}'`])();
	const compare = () => pick(['=', '<>', '!=', '<', '<=', '>', '>=']);
	const not = () => (chance(0.3) ? 'NOT ' : '');
	const boolean = (depth: number): string => {
		const options: (() => string)[] = [
			() => `${number(2)} ${compare()} ${number(2)}`,
			() => `${text(1)} ${compare()} ${text(1)}`,
			() => `${date()} ${compare()} ${date()}`,
			() => `${pick([number(1), text(1), date()])} IS ${not()}NULL`,
			() => `${number(1)} ${not()}BETWEEN ${number(1)} AND ${number(1)}`,
			() => `${number(1)} ${not()}IN (${number(1)}, ${number(0)}, ${number(0)})`,
			() => `${text(1)} ${not()}IN ('abc', 'x', ${text(0)})`,
			() => `${text(1)} ${not()}${pick(['LIKE', 'ILIKE'])} '${pick(['%b%', 'a%', '_bc', '%1', 'A%', 'x', '%'])}'`,
			() => `${text(1)} ${pick(['~', '~*', '!~', '!~*'])} '${pick(['^a', 'c$', '^[a-z]+$', '[0-9]', '^.+@.+$', '^\\s'])}'`,
			() => `${text(1)} ${pick(['=', '<>'])} ANY (ARRAY['abc', 'x', ${text(0)}])`,
			() => `${number(1)} ${pick(['=', '<', '>='])} ALL (ARRAY[1, 2, ${number(0)}])`,
			() => `f IS ${not()}${pick(['TRUE', 'FALSE', 'NULL'])}`,
			() => 'f'
		];
		if (depth > 0) options.push(() => `(${boolean(depth - 1)} AND ${boolean(depth - 1)})`, () => `(${boolean(depth - 1)} OR ${boolean(depth - 1)})`, () => `NOT (${boolean(depth - 1)})`);
		return pick(options)();
	};
	const sql = boolean(3);
	const rows: Record<string, Value>[] = Array.from({ length: 6 }, () => ({
		a: chance(0.15) ? null : pick(INTS),
		b: chance(0.15) ? null : pick(INTS),
		p: chance(0.15) ? null : pick(NUMS),
		s: chance(0.15) ? null : pick(TEXTS),
		t: chance(0.15) ? null : pick(TEXTS),
		d: chance(0.15) ? null : pick(DATES),
		e: chance(0.15) ? null : pick(DATES),
		f: chance(0.2) ? null : chance(0.5)
	}));
	return { sql, rows };
}

const TYPES: Record<string, string> = { a: 'int', b: 'int', p: 'numeric', s: 'text', t: 'text', d: 'date', e: 'date', f: 'boolean' };
const literal = (name: string, value: Value) => (value === null ? `NULL::${TYPES[name]}` : typeof value === 'string' ? `'${value.replaceAll("'", "''")}'::${TYPES[name]}` : `${value}::${TYPES[name]}`);

describe('the evaluator agrees with PostgreSQL', () => {
	it(`on ${COUNT} random predicates over random rows`, async () => {
		const mismatches: string[] = [];
		let decided = 0;
		let unknown = 0;
		for (let seed = 1; seed <= COUNT; seed++) {
			const { sql, rows } = expression(seed);
			const values = rows.map((row) => `(${Object.entries(row).map(([name, value]) => literal(name, value)).join(', ')})`).join(', ');
			let remote: (boolean | null)[];
			try {
				const result = await db.query<{ r: boolean | null }>(`SELECT (${sql}) AS r FROM (VALUES ${values}) AS v(a, b, p, s, t, d, e, f)`);
				remote = result.rows.map((row) => row.r);
			} catch (error) {
				mismatches.push(`#${seed} ${sql} -> PostgreSQL: ${(error as Error).message}`);
				continue;
			}
			rows.forEach((row, index) => {
				const local = evaluateCheck(`(${sql})`, row);
				if (local === undefined) {
					unknown++;
					return;
				}
				decided++;
				if (local !== remote[index]) mismatches.push(`#${seed} ${sql} with ${JSON.stringify(row)}: ${String(local)} here, ${String(remote[index])} there`);
			});
		}
		expect(mismatches.slice(0, 10)).toEqual([]);
		expect(decided / (decided + unknown)).toBeGreaterThan(0.9);
	}, 300_000);
});
