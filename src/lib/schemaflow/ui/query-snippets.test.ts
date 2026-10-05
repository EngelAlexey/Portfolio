import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { schemaflowUiEn } from '../../i18n/schemaflow-ui-en';
import { schemaflowUiEs } from '../../i18n/schemaflow-ui-es';
import { quote } from '../dialects/names';
import { generateSql } from '../dialects/sql-generate';
import { createId } from '../model/ids';
import { newColumn } from '../model/ops';
import { emptySchema, type Column, type LogicalType, type Schema, type Table } from '../model/types';
import { parseSql } from '../parse/sql-parse';
import { loadTemplates } from '../templates/template';
import { buildSnippets, sampleScript, SNIPPET_GROUPS } from './query-snippets';
import { sampleSql, sampleValue } from './sample-rows';

const texts = schemaflowUiEs.pg.query.snippets;
const q = (name: string) => quote('postgres', name);

let db: PGlite;

beforeAll(async () => {
	db = new PGlite();
	await db.waitReady;
}, 60_000);

afterAll(async () => {
	await db.close();
});

async function inTransaction(ddl: string, body: () => Promise<void>): Promise<void> {
	await db.exec('BEGIN');
	try {
		await db.exec(ddl);
		await body();
	} finally {
		await db.exec('ROLLBACK');
	}
}

async function attempt(sql: string): Promise<{ rows: number; error: string | null }> {
	await db.exec('SAVEPOINT probe');
	try {
		const results = await db.exec(sql);
		const last = [...results].reverse().find((r) => r.fields.length > 0);
		return { rows: last?.rows.length ?? 0, error: null };
	} catch (error) {
		const e = error as { code?: string; message?: string };
		return { rows: 0, error: e.code ?? e.message ?? String(error) };
	} finally {
		await db.exec('ROLLBACK TO SAVEPOINT probe');
	}
}

const column = (name: string, type: LogicalType, patch: Partial<Column> = {}): Column => newColumn(name, type, patch);
const table = (name: string, columns: Column[], key: Column[] = []): Table => ({ id: createId(), name, x: 0, y: 0, columns, primaryKey: key.map((c) => c.id), uniques: [], indexes: [] });
const link = (from: Table, columns: Column[], to: Table, targets: Column[]) => ({ id: createId(), fromTable: from.id, fromColumns: columns.map((c) => c.id), toTable: to.id, toColumns: targets.map((c) => c.id), onDelete: 'CASCADE' as const, onUpdate: 'NO ACTION' as const });

describe('sample rows of every template', async () => {
	const templates = await loadTemplates();

	for (const template of templates) {
		const schema = parseSql('postgres', template.sql).schema;
		const ddl = generateSql('postgres', schema);

		it(`${template.id}: all the tables get 3 rows and the sequences move on`, async () => {
			const result = sampleSql(schema, null, 'es');
			expect(result.skipped).toEqual([]);
			await inTransaction(ddl, async () => {
				await db.exec(result.sql);
				for (const each of schema.tables) {
					const counted = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${q(each.name)}`);
					expect(counted.rows[0]?.n, each.name).toBe(3);
					for (const identity of each.columns.filter((c) => c.default.kind === 'autoincrement')) {
						const next = await db.query<{ n: string }>('SELECT nextval(pg_get_serial_sequence($1, $2))::text AS n', [q(each.name), identity.name]);
						expect(next.rows[0]?.n, `${each.name}.${identity.name}`).toBe('4');
					}
				}
			});
		}, 60_000);

		it(`${template.id}: the rows of one table bring the rows of the tables it points to`, async () => {
			for (const each of schema.tables) {
				const result = sampleSql(schema, [each.id], 'en');
				expect(result.skipped, each.name).toEqual([]);
				await inTransaction(ddl, async () => {
					await db.exec(result.sql);
					const counted = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${q(each.name)}`);
					expect(counted.rows[0]?.n, each.name).toBe(3);
				});
			}
		}, 120_000);
	}
});

describe('ready-made queries of every template', async () => {
	const templates = await loadTemplates();

	for (const template of templates) {
		const schema = parseSql('postgres', template.sql).schema;
		const ddl = generateSql('postgres', schema);

		it(`${template.id}: every query of every table runs and the main ones return rows`, async () => {
			const sample = sampleScript(schema, null, 'x', texts, 'es');
			await inTransaction(ddl, async () => {
				await db.exec(sample);
				for (const each of schema.tables) {
					const snippets = buildSnippets(schema, each.id, texts, 'es');
					expect(snippets.map((s) => s.id)).toEqual(expect.arrayContaining(['rows', 'count', 'sample', 'sample-all', 'columns', 'plan']));
					for (const snippet of snippets) {
						if (snippet.id === 'sample' || snippet.id === 'sample-all') continue;
						const result = await attempt(snippet.sql);
						const where = `${each.name}: ${snippet.label}`;
						expect(result.error, where).toBeNull();
						if (snippet.id === 'rows' || snippet.id === 'by-value' || snippet.id === 'columns' || snippet.id === 'plan' || snippet.id.startsWith('join-')) expect(result.rows, where).toBeGreaterThan(0);
					}
				}
			});
		}, 120_000);

		it(`${template.id}: the sample rows of each table run on an empty database`, async () => {
			for (const each of schema.tables) {
				const snippet = buildSnippets(schema, each.id, texts, 'es').find((s) => s.id === 'sample');
				await inTransaction(ddl, async () => {
					expect((await attempt(snippet?.sql ?? '')).error, each.name).toBeNull();
				});
			}
		}, 120_000);
	}
});

describe('sample rows of an unusual design', () => {
	const nodes = table('nodes', [column('id', { kind: 'int' }), column('parent_id', { kind: 'int' }, { nullable: true }), column('label', { kind: 'varchar', length: 40 })]);
	nodes.primaryKey = [nodes.columns[0]?.id ?? ''];
	const first = table('cycle_a', [column('id', { kind: 'int' }), column('b_id', { kind: 'int' }, { nullable: true })]);
	first.primaryKey = [first.columns[0]?.id ?? ''];
	const second = table('cycle_b', [column('id', { kind: 'int' }), column('a_id', { kind: 'int' }, { nullable: true })]);
	second.primaryKey = [second.columns[0]?.id ?? ''];
	const stuck = table('stuck', [column('id', { kind: 'int' }), column('tag', { kind: 'raw', dialect: 'postgres', sql: 'PG_LSN' }, { nullable: false })]);
	stuck.primaryKey = [stuck.columns[0]?.id ?? ''];
	const waiting = table('waiting', [column('id', { kind: 'int' }), column('stuck_id', { kind: 'int' }, { nullable: false })]);
	waiting.primaryKey = [waiting.columns[0]?.id ?? ''];
	const free = table('free_tag', [column('id', { kind: 'int' }), column('tag', { kind: 'raw', dialect: 'postgres', sql: 'INET' }, { nullable: true })]);
	free.primaryKey = [free.columns[0]?.id ?? ''];
	const left = table('lefts', [column('id', { kind: 'uuid' })]);
	left.primaryKey = [left.columns[0]?.id ?? ''];
	const right = table('rights', [column('id', { kind: 'smallint' })]);
	right.primaryKey = [right.columns[0]?.id ?? ''];
	const both = table('lefts_rights', [column('left_id', { kind: 'uuid' }), column('right_id', { kind: 'smallint' })]);
	both.primaryKey = both.columns.map((c) => c.id);
	const odd = table('odd', [column('id', { kind: 'bigint' }, { default: { kind: 'autoincrement' } }), column('price', { kind: 'decimal', precision: 3, scale: 3 }), column('code', { kind: 'varchar', length: 2 }), column('flag', { kind: 'boolean' }), column('born', { kind: 'timestamptz' }, { default: { kind: 'now' } }), column('extra', { kind: 'json' }), column('blob', { kind: 'binary' }), column('moment', { kind: 'time' })]);
	odd.primaryKey = [odd.columns[0]?.id ?? ''];
	odd.uniques = [{ id: createId(), columns: [odd.columns[2]?.id ?? ''] }];
	const schema: Schema = {
		...emptySchema('odd'),
		tables: [nodes, first, second, stuck, waiting, free, left, right, both, odd],
		relations: [
			link(nodes, [nodes.columns[1] as Column], nodes, [nodes.columns[0] as Column]),
			link(first, [first.columns[1] as Column], second, [second.columns[0] as Column]),
			link(second, [second.columns[1] as Column], first, [first.columns[0] as Column]),
			link(waiting, [waiting.columns[1] as Column], stuck, [stuck.columns[0] as Column]),
			link(both, [both.columns[0] as Column], left, [left.columns[0] as Column]),
			link(both, [both.columns[1] as Column], right, [right.columns[0] as Column])
		]
	};

	it('skips what cannot be filled and says which tables', () => {
		expect(sampleSql(schema, null, 'es').skipped.sort()).toEqual(['stuck', 'waiting']);
	});

	it('inserts the rest without errors: self reference, cycle, junction, small decimals and identity', async () => {
		const result = sampleSql(schema, null, 'es');
		await inTransaction(generateSql('postgres', schema), async () => {
			await db.exec(result.sql);
			for (const name of ['nodes', 'cycle_a', 'cycle_b', 'free_tag', 'lefts', 'rights', 'lefts_rights', 'odd']) {
				const counted = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${q(name)}`);
				expect(counted.rows[0]?.n, name).toBe(3);
			}
			const parents = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM nodes WHERE parent_id IS NULL');
			expect(parents.rows[0]?.n).toBe(1);
			const next = await db.query<{ n: string }>("SELECT nextval(pg_get_serial_sequence('odd', 'id'))::text AS n");
			expect(next.rows[0]?.n).toBe('4');
		});
	}, 60_000);

	it('writes identity values even when the code uses GENERATED ALWAYS or a serial column', async () => {
		const always = parseSql('postgres', 'CREATE TABLE a (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT); CREATE TABLE s (id BIGSERIAL PRIMARY KEY, name TEXT);').schema;
		const result = sampleSql(always, null, 'en');
		expect(result.sql).toContain('OVERRIDING SYSTEM VALUE');
		await inTransaction('CREATE TABLE a (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT); CREATE TABLE s (id BIGSERIAL PRIMARY KEY, name TEXT);', async () => {
			await db.exec(result.sql);
			await db.exec("INSERT INTO a (name) VALUES ('later'); INSERT INTO s (name) VALUES ('later');");
			const counted = await db.query<{ n: number }>('SELECT (SELECT count(*) FROM a)::int + (SELECT count(*) FROM s)::int AS n');
			expect(counted.rows[0]?.n).toBe(8);
		});
	}, 60_000);

	it('keeps the names in their place, whatever they contain', async () => {
		const weird = table('we"ird\nta$$ble', [column('id', { kind: 'int' }), column("it's */ -- name", { kind: 'varchar', length: 30 }), column('line\u2028break', { kind: 'text' })]);
		weird.primaryKey = [weird.columns[0]?.id ?? ''];
		const child = table("child'; DROP TABLE x; --", [column('id', { kind: 'int' }), column('we"ird_id', { kind: 'int' })]);
		child.primaryKey = [child.columns[0]?.id ?? ''];
		const hostile: Schema = { ...emptySchema('hostile'), tables: [weird, child], relations: [link(child, [child.columns[1] as Column], weird, [weird.columns[0] as Column])] };
		const ddl = generateSql('postgres', hostile);
		const sample = sampleScript(hostile, null, 'x', texts, 'es');
		expect(sample.split('\n').filter((line) => /^\s*DROP/i.test(line))).toEqual([]);
		await inTransaction(ddl, async () => {
			await db.exec(sample);
			for (const each of hostile.tables) {
				for (const snippet of buildSnippets(hostile, each.id, texts, 'es')) {
					if (snippet.id === 'sample' || snippet.id === 'sample-all') continue;
					const result = await attempt(snippet.sql);
					expect(result.error, `${each.name}: ${snippet.label}`).toBeNull();
				}
			}
			const left = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM pg_tables WHERE tablename = $1', ["child'; DROP TABLE x; --"]);
			expect(left.rows[0]?.n).toBe(1);
		});
	}, 60_000);
});

describe('texts of the samples', () => {
	const schema = parseSql('postgres', 'CREATE TABLE users (id INT PRIMARY KEY, full_name VARCHAR(50), email VARCHAR(80), status VARCHAR(10));').schema;
	const users = schema.tables[0] as Table;
	const name = users.columns.find((c) => c.name === 'full_name') as Column;

	it('writes the example text in the language of the page', () => {
		expect(sampleValue(schema, users, name, 2, 'es')).toBe("'Ejemplo 2'");
		expect(sampleValue(schema, users, name, 2, 'en')).toBe("'Example 2'");
	});

	it('picks values that look like what the column holds', () => {
		const email = users.columns.find((c) => c.name === 'email') as Column;
		const status = users.columns.find((c) => c.name === 'status') as Column;
		expect(sampleValue(schema, users, email, 1, 'en')).toBe("'user1@example.com'");
		expect(sampleValue(schema, users, status, 2, 'en')).toBe("'pending'");
	});

	it('offers the same groups of queries in both languages', () => {
		for (const strings of [schemaflowUiEs, schemaflowUiEn]) {
			const groups = buildSnippets(schema, users.id, strings.pg.query.snippets, 'es').map((s) => s.group);
			expect(SNIPPET_GROUPS.filter((g) => groups.includes(g))).toEqual(['view', 'filter', 'group', 'change', 'structure']);
		}
	});
});
