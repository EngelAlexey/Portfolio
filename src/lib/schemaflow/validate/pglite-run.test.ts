import { PGlite } from '@electric-sql/pglite';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HEAVY_MS, HEAVY_ROWS, MAX_ROWS, MAX_RUNS, cell, execute, fingerprint, reusable, settle } from './pglite-run';

const SCHEMA = `
CREATE TABLE users (id BIGINT PRIMARY KEY, email VARCHAR(100) NOT NULL, bio TEXT, meta JSONB, born TIMESTAMP, avatar BYTEA);
CREATE TABLE posts (id BIGINT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users (id), title TEXT);
`;

describe('execute', () => {
	let db: PGlite;

	beforeEach(() => {
		db = new PGlite();
	});

	afterEach(async () => {
		await db.close();
	});

	it('applies the schema and counts the tables when there is no query', async () => {
		expect(await execute(db, { sql: SCHEMA })).toEqual({ ok: true, tables: 2 });
	}, 60_000);

	it('returns the rows of a join as text, with the waiting time of the engine', async () => {
		const result = await execute(
			db,
			{
				sql: SCHEMA,
				query: `INSERT INTO users (id, email) VALUES (1, 'a@x.com'), (2, 'b@x.com');
INSERT INTO posts (id, user_id, title) VALUES (1, 1, 'x'), (2, 1, 'y'), (3, 2, 'z');
SELECT u.email, count(p.id) AS posts FROM users u LEFT JOIN posts p ON p.user_id = u.id GROUP BY 1 ORDER BY 1;`
			},
			42
		);
		expect(result).toMatchObject({
			ok: true,
			tables: 2,
			query: { fields: ['email', 'posts'], rows: [['a@x.com', '2'], ['b@x.com', '1']], total: 2, affected: 0 },
			timings: { boot: 42 }
		});
		if (result.ok) expect(result.timings?.schema).toBeGreaterThanOrEqual(0);
	}, 60_000);

	it('shows every value the way PostgreSQL prints it, whatever the time zone of the browser', async () => {
		const result = await execute(db, {
			sql: SCHEMA,
			query: `INSERT INTO users (id, email, meta, born, avatar) VALUES (1, 'a@x.com', '{"k": [1, 2]}', '2026-10-03 12:30:00', '\\x0aff');
SELECT bio, meta, born, avatar, ARRAY[10000000000000000::int8, 1] AS big, true AS yes, 1.50::numeric AS price, 'infinity'::float8 AS inf, DATE '2026-10-03' AS day FROM users;`
		});
		expect(result.ok && result.query?.rows).toEqual([[null, '{"k": [1, 2]}', '2026-10-03 12:30:00', '\\x0aff', '{10000000000000000,1}', 'true', '1.50', 'Infinity', '2026-10-03']]);
	}, 60_000);

	it('reports the rows an UPDATE touched when no statement returns rows', async () => {
		const result = await execute(db, { sql: SCHEMA, query: "INSERT INTO users (id, email) VALUES (1, 'a'), (2, 'b'); UPDATE users SET bio = 'x';" });
		expect(result).toMatchObject({ ok: true, query: { fields: [], rows: [], affected: 2 } });
	}, 60_000);

	it('takes the last statement that returns rows', async () => {
		const result = await execute(db, { sql: SCHEMA, query: "SELECT 1 AS one; SELECT 2 AS two; INSERT INTO users (id, email) VALUES (1, 'a');" });
		expect(result).toMatchObject({ ok: true, query: { fields: ['two'], rows: [['2']] } });
	}, 60_000);

	it('keeps the first rows and the total when the result is long', async () => {
		const result = await execute(db, { sql: '', query: 'SELECT g FROM generate_series(1, 500) AS g' });
		expect(result.ok && result.query?.rows).toHaveLength(MAX_ROWS);
		expect(result).toMatchObject({ ok: true, query: { total: 500 } });
	}, 60_000);

	it('reports a schema error with its position, before the query runs', async () => {
		const result = await execute(db, { sql: 'CREATE TABLE a (id INT PRIMARY KEY, b_id INT REFERENCES missing(id));', query: 'SELECT 1' });
		expect(result).toMatchObject({ ok: false, stage: 'ddl', message: expect.stringContaining('missing') });
	}, 60_000);

	it('reports a syntax error with the position in the code', async () => {
		const result = await execute(db, { sql: 'CREATE TABEL a (id INT);' });
		expect(result).toMatchObject({ ok: false, stage: 'ddl', code: '42601' });
		if (!result.ok) expect(result.position).toBeGreaterThan(0);
	}, 60_000);

	it('reports a query error apart from a schema error', async () => {
		const result = await execute(db, { sql: SCHEMA, query: 'SELECT * FROM nope' });
		expect(result).toMatchObject({ ok: false, stage: 'query', message: expect.stringContaining('nope') });
	}, 60_000);

	it('counts the position of a query error from the start of the whole text', async () => {
		const text = 'SELECT 1;\nSELECT 2;\nSELEC 3;';
		const result = await execute(db, { sql: '', query: text });
		expect(result).toMatchObject({ ok: false, stage: 'query', code: '42601' });
		if (!result.ok) expect(text.slice((result.position ?? 1) - 1, (result.position ?? 1) - 1 + 5)).toBe('SELEC');
	}, 60_000);

	it('keeps two columns that have the same name', async () => {
		const result = await execute(db, {
			sql: SCHEMA,
			query: `INSERT INTO users (id, email) VALUES (1, 'a@x.com');
INSERT INTO posts (id, user_id, title) VALUES (7, 1, 'x');
SELECT * FROM posts JOIN users ON users.id = posts.user_id;`
		});
		expect(result).toMatchObject({ ok: true, query: { fields: ['id', 'user_id', 'title', 'id', 'email', 'bio', 'meta', 'born', 'avatar'], rows: [['7', '1', 'x', '1', 'a@x.com', null, null, null, null]], total: 1 } });
	}, 60_000);
});

describe('an engine that runs many requests', () => {
	let db: PGlite;
	let baseline: string;
	let defaults: { path: string; zone: string };

	beforeAll(async () => {
		db = new PGlite();
		await db.waitReady;
		baseline = await fingerprint(db);
		const path = await db.query<{ search_path: string }>('SHOW search_path');
		const zone = await db.query<{ TimeZone: string }>('SHOW timezone');
		defaults = { path: path.rows[0]?.search_path ?? '', zone: zone.rows[0]?.TimeZone ?? '' };
	}, 60_000);

	afterAll(async () => {
		await db.close();
	});

	const EVERYTHING = `
CREATE SCHEMA app;
CREATE TYPE mood AS ENUM ('sad', 'ok');
CREATE DOMAIN positive AS INT CHECK (VALUE > 0);
CREATE FUNCTION answer() RETURNS INT LANGUAGE sql AS 'SELECT 42';
CREATE ROLE tester;
CREATE TEMP TABLE scratch (a INT);
CREATE TABLE app.items (id SERIAL PRIMARY KEY, feeling mood, qty positive UNIQUE);
CREATE INDEX items_feeling ON app.items (feeling);
CREATE VIEW everything AS SELECT * FROM app.items;
CREATE SEQUENCE counter;
CREATE TABLE public.audit (id INT);
CREATE TRIGGER noop BEFORE INSERT ON public.audit FOR EACH ROW EXECUTE FUNCTION suppress_redundant_updates_trigger();
COMMENT ON TABLE public.audit IS 'to be forgotten';
INSERT INTO app.items (feeling, qty) VALUES ('ok', 1);
`;

	it('has the same catalog fingerprint on every boot', async () => {
		const other = new PGlite();
		try {
			expect(await fingerprint(other)).toBe(baseline);
		} finally {
			await other.close();
		}
	}, 60_000);

	it('runs the same script twice without leaving anything behind', async () => {
		for (let i = 0; i < 3; i++) {
			expect(await execute(db, { sql: SCHEMA })).toEqual({ ok: true, tables: 2 });
			expect(await settle(db, baseline)).toBe(true);
		}
	}, 60_000);

	it('rolls back schemas, types, domains, functions, roles, temporary tables, views, sequences and comments', async () => {
		for (let i = 0; i < 2; i++) {
			const result = await execute(db, { sql: EVERYTHING, query: 'SELECT count(*) AS n FROM app.items' });
			expect(result).toMatchObject({ ok: true, query: { rows: [['1']] } });
			expect(await settle(db, baseline)).toBe(true);
		}
	}, 60_000);

	it('starts every run without the data of the last one', async () => {
		await execute(db, { sql: SCHEMA, query: "INSERT INTO users (id, email) VALUES (1, 'a')" });
		expect(await settle(db, baseline)).toBe(true);
		const result = await execute(db, { sql: SCHEMA, query: 'SELECT count(*) AS n FROM users' });
		expect(result).toMatchObject({ ok: true, query: { rows: [['0']] } });
		expect(await settle(db, baseline)).toBe(true);
	}, 60_000);

	it('recovers after a script that fails in the middle', async () => {
		const result = await execute(db, { sql: 'CREATE TABLE half (a INT); CREATE TABEL broken (a INT);' });
		expect(result).toMatchObject({ ok: false, stage: 'ddl' });
		expect(await settle(db, baseline)).toBe(true);
		expect(await execute(db, { sql: 'CREATE TABLE half (a INT);' })).toEqual({ ok: true, tables: 1 });
		expect(await settle(db, baseline)).toBe(true);
	}, 60_000);

	it('recovers after a query that fails', async () => {
		const result = await execute(db, { sql: SCHEMA, query: 'SELECT * FROM nope' });
		expect(result).toMatchObject({ ok: false, stage: 'query' });
		expect(await settle(db, baseline)).toBe(true);
	}, 60_000);

	it('closes a transaction that the script opened and never closed', async () => {
		await execute(db, { sql: 'BEGIN; CREATE TABLE open_tx (a INT); SAVEPOINT s;' });
		expect(await settle(db, baseline)).toBe(true);
		expect(await execute(db, { sql: 'CREATE TABLE open_tx (a INT);' })).toEqual({ ok: true, tables: 1 });
		expect(await settle(db, baseline)).toBe(true);
	}, 60_000);

	it('cleans the session settings a run changed', async () => {
		await execute(db, { sql: "SET search_path TO nowhere; SET statement_timeout = '5s'; SET TIME ZONE 'Asia/Tokyo';" });
		expect(await settle(db, baseline)).toBe(true);
		const path = await db.query<{ search_path: string }>('SHOW search_path');
		const zone = await db.query<{ TimeZone: string }>('SHOW timezone');
		expect(path.rows[0]?.search_path).toBe(defaults.path);
		expect(zone.rows[0]?.TimeZone).toBe(defaults.zone);
		expect(defaults.zone).not.toBe('Asia/Tokyo');
	}, 60_000);
});

describe('an engine whose script committed its own changes', () => {
	let db: PGlite;
	let baseline: string;

	beforeEach(async () => {
		db = new PGlite();
		await db.waitReady;
		baseline = await fingerprint(db);
	}, 60_000);

	afterEach(async () => {
		await db.close();
	});

	it('is not clean when a table survived a COMMIT', async () => {
		await execute(db, { sql: 'CREATE TABLE leak (a INT); COMMIT;' });
		expect(await settle(db, baseline)).toBe(false);
	}, 60_000);

	it('is not clean when a role survived a COMMIT', async () => {
		await execute(db, { sql: 'CREATE ROLE survivor; COMMIT;' });
		expect(await settle(db, baseline)).toBe(false);
	}, 60_000);

	it('is not clean when a persistent setting survived a COMMIT', async () => {
		await execute(db, { sql: "COMMIT; ALTER ROLE postgres SET work_mem = '8MB';" });
		expect(await settle(db, baseline)).toBe(false);
	}, 60_000);

	it('is not clean without a baseline to compare with', async () => {
		expect(await settle(db, null)).toBe(false);
	}, 60_000);

	it('is not clean when the engine is closed', async () => {
		await db.close();
		expect(await settle(db, baseline)).toBe(false);
		db = new PGlite();
	}, 60_000);
});

describe('reusable', () => {
	const rows = (total: number) => ({ ok: true as const, tables: 1, query: { fields: ['a'], rows: [], total, affected: 0 } });

	it('allows a normal run, even one that failed in SQL', () => {
		expect(reusable({ ok: true, tables: 1 }, 1)).toBe(true);
		expect(reusable(rows(10), 1)).toBe(true);
		expect(reusable({ ok: false, stage: 'query', message: 'x', position: null, hint: null, code: null }, 1)).toBe(true);
	});

	it('retires the engine after many runs, to give the memory back', () => {
		expect(reusable(rows(1), MAX_RUNS - 1)).toBe(true);
		expect(reusable(rows(1), MAX_RUNS)).toBe(false);
	});

	it('retires the engine after a heavy result, which grows its memory', () => {
		expect(reusable(rows(HEAVY_ROWS), 1)).toBe(true);
		expect(reusable(rows(HEAVY_ROWS + 1), 1)).toBe(false);
	});

	it('retires the engine after a slow run, which also grows its memory', () => {
		const timed = (ms: number) => ({ ...rows(1), timings: { boot: 0, schema: ms, query: 0 } });
		expect(reusable(timed(HEAVY_MS), 1)).toBe(true);
		expect(reusable(timed(HEAVY_MS + 1), 1)).toBe(false);
	});

	it('retires the engine after many runs even when the last one failed in SQL', () => {
		const sqlError = { ok: false as const, stage: 'query' as const, message: 'x', position: null, hint: null, code: null };
		expect(reusable(sqlError, MAX_RUNS - 1)).toBe(true);
		expect(reusable(sqlError, MAX_RUNS)).toBe(false);
	});
});

describe('cell', () => {
	it('writes every kind of value as text', () => {
		expect(cell(null)).toBeNull();
		expect(cell(undefined)).toBeNull();
		expect(cell(7)).toBe('7');
		expect(cell(10n)).toBe('10');
		expect(cell(true)).toBe('true');
		expect(cell(new Date('2026-01-02T03:04:05Z'))).toBe('2026-01-02T03:04:05.000Z');
		expect(cell(new Date('nope'))).toBe('Invalid Date');
		expect(cell(new Uint8Array([1, 255]))).toBe('\\x01ff');
		expect(cell({ a: [1n, new Uint8Array([2])] })).toBe('{"a":["1","\\\\x02"]}');
	});
});
