import { describe, expect, it } from 'vitest';
import { parseSql } from '../parse/sql-parse';
import { shape } from '../testing';
import { analyze, score } from '../validate/rules';
import { applyFix } from '../validate/fixes';
import { History } from './history';
import { autoLayout } from './layout';
import { mergeImported } from './merge';
import {
	addColumn,
	addTable,
	connectColumns,
	connectWithNewColumns,
	convertToJunction,
	createJunction,
	deleteColumn,
	deleteSelection,
	emptySelection,
	updateColumn
} from './ops';
import { readSchema } from './serialize';
import { decodeShare, encodeShare } from './share';
import { CARD_WIDTH, emptySchema, tableHeight, type Schema } from './types';

const sql = (code: string, dialect: 'postgres' | 'mysql' | 'sqlserver' = 'postgres') => parseSql(dialect, code).schema;
const rules = (schema: Schema, dialect: Parameters<typeof analyze>[1]) => analyze(schema, dialect).map((i) => `${i.severity}:${i.rule}`);

describe('ops', () => {
	it('creates a table with an id primary key', () => {
		const { schema, tableId } = addTable(emptySchema(), { name: 'nueva_tabla', x: 10, y: 20 });
		const table = schema.tables[0];
		expect(tableId).toBe(table?.id);
		expect(table?.primaryKey).toEqual([table?.columns[0]?.id]);
		expect(table?.columns[0]?.default).toEqual({ kind: 'autoincrement' });
		const second = addTable(schema, { name: 'nueva_tabla', x: 0, y: 0 });
		expect(second.schema.tables[1]?.name).toBe('nueva_tabla_2');
	});

	it('connects tables creating a typed column', () => {
		let schema = sql('CREATE TABLE customers (id UUID PRIMARY KEY); CREATE TABLE orders (id INT PRIMARY KEY);');
		const [customers, orders] = schema.tables;
		const result = connectWithNewColumns(schema, orders?.id ?? '', customers?.id ?? '');
		schema = result.schema;
		expect(shape(schema).tables[1]?.columns[1]).toMatchObject({ name: 'customers_id', type: { kind: 'uuid' }, nullable: false });
		expect(shape(schema).relations).toEqual([{ from: 'orders(customers_id)', to: 'customers(id)', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' }]);
	});

	it('propagates a key type change to referencing columns', () => {
		let schema = sql('CREATE TABLE a (id INT PRIMARY KEY); CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id));');
		const a = schema.tables[0];
		schema = updateColumn(schema, a?.id ?? '', a?.columns[0]?.id ?? '', { type: { kind: 'bigint' } });
		expect(schema.tables[1]?.columns[1]?.type).toEqual({ kind: 'bigint' });
	});

	it('creates and converts many-to-many links', () => {
		let schema = sql('CREATE TABLE posts (id INT PRIMARY KEY); CREATE TABLE tags (id INT PRIMARY KEY, post_id INT REFERENCES posts(id));');
		const [posts, tags] = schema.tables;
		const junction = createJunction(schema, posts?.id ?? '', tags?.id ?? '');
		const s = shape(junction.schema);
		expect(s.tables[2]).toMatchObject({ name: 'posts_tags', primaryKey: ['posts_id', 'tags_id'] });
		expect(s.relations.slice(1).map((r) => r.onDelete)).toEqual(['CASCADE', 'CASCADE']);
		const converted = convertToJunction(schema, schema.relations[0]?.id ?? '');
		expect(shape(converted.schema).tables[1]?.columns.map((c) => c.name)).toEqual(['id']);
		schema = converted.schema;
		expect(schema.relations.length).toBe(2);
	});

	it('removes relations when deleting columns or tables', () => {
		let schema = sql('CREATE TABLE a (id INT PRIMARY KEY); CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id));');
		const b = schema.tables[1];
		expect(deleteColumn(schema, b?.id ?? '', b?.columns[1]?.id ?? '').relations).toEqual([]);
		schema = deleteSelection(schema, { ...emptySelection(), tables: [schema.tables[0]?.id ?? ''] });
		expect(schema.relations).toEqual([]);
		expect(schema.tables.length).toBe(1);
	});

	it('refuses mismatched column counts', () => {
		const schema = sql('CREATE TABLE a (id INT PRIMARY KEY); CREATE TABLE b (id INT PRIMARY KEY);');
		expect(connectColumns(schema, { fromTable: 'x', fromColumns: ['1', '2'], toTable: 'y', toColumns: ['1'] }).relationId).toBe('');
		expect(addColumn(schema, 'missing', { name: 'c' }).columnId).toBe('');
	});
});

describe('history', () => {
	it('undoes, redoes and coalesces typing', () => {
		const history = new History(3);
		const s0 = emptySchema('0');
		const s1 = emptySchema('1');
		const s2 = emptySchema('2');
		history.record(s0, 'name', 1000);
		history.record(s1, 'name', 1500);
		expect(history.undo(s2)?.name).toBe('0');
		expect(history.redo(s0)?.name).toBe('2');
		for (let i = 0; i < 10; i++) history.record(emptySchema(String(i)), undefined, 5000 + i);
		let count = 0;
		while (history.undo(s0)) count++;
		expect(count).toBe(3);
	});
});

describe('serialize', () => {
	it('drops invalid and dangling data instead of failing', () => {
		expect(readSchema(null)).toBeNull();
		expect(readSchema({ version: 2 })).toBeNull();
		const read = readSchema({
			version: 1,
			name: 'x',
			tables: [
				{ id: 't1', name: '<b>t</b>', x: 1e12, y: 'a', columns: [{ id: 'c1', name: 'id', type: { kind: 'int' } }, { id: 'c2', name: '', type: { kind: 'int' } }, { id: 'c3', name: 'x', type: { kind: 'evil' } }], primaryKey: ['c1', 'nope'], uniques: [], indexes: [] },
				{ id: 't1', name: 'dup', columns: [] },
				'junk'
			],
			relations: [{ id: 'r1', fromTable: 't1', fromColumns: ['c1'], toTable: 'ghost', toColumns: ['c1'] }],
			notes: [{ id: 'n1', text: 'hola', x: 0, y: 0, w: 1, h: 1, color: 'neon' }],
			extras: [{ id: 'e1', dialect: 'oracle', sql: 'x' }]
		});
		expect(read?.tables.length).toBe(1);
		expect(read?.tables[0]).toMatchObject({ name: '<b>t</b>', x: 1e6, y: 0, primaryKey: ['c1'] });
		expect(read?.tables[0]?.columns.map((c) => c.id)).toEqual(['c1']);
		expect(read?.relations).toEqual([]);
		expect(read?.notes[0]).toMatchObject({ w: 120, h: 60, color: 'amber' });
		expect(read?.extras).toEqual([]);
	});
});

describe('share', () => {
	it('round-trips a schema through a compact link', async () => {
		const schema = sql('CREATE TABLE a (id INT PRIMARY KEY, name VARCHAR(80) NOT NULL); CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id) ON DELETE CASCADE);');
		const encoded = await encodeShare(schema);
		expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
		const decoded = await decodeShare(encoded ?? '');
		expect(decoded && shape(decoded)).toEqual(shape(schema));
		expect(await decodeShare('not*base64')).toBeNull();
		expect(await decodeShare('AAAA')).toBeNull();
	});

	it('keeps a 50-table design under 16 KB', async () => {
		let schema = emptySchema();
		for (let i = 0; i < 50; i++) {
			schema = addTable(schema, { name: `table_${i}`, x: i * 10, y: i * 10 }).schema;
			const table = schema.tables[i];
			for (let c = 0; c < 6; c++) schema = addColumn(schema, table?.id ?? '', { name: `column_${c}` }).schema;
			if (i > 0) schema = connectWithNewColumns(schema, table?.id ?? '', schema.tables[i - 1]?.id ?? '').schema;
		}
		const encoded = await encodeShare(schema);
		expect(encoded?.length).toBeLessThan(16_000);
	});
});

describe('layout', () => {
	it('places parents left of children without overlaps', () => {
		const schema = sql(`CREATE TABLE a (id INT PRIMARY KEY);
CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id));
CREATE TABLE c (id INT PRIMARY KEY, b_id INT REFERENCES b(id), a_id INT REFERENCES a(id));
CREATE TABLE lonely (id INT PRIMARY KEY);`);
		const positions = autoLayout(schema);
		const x = (name: string) => positions.get(schema.tables.find((t) => t.name === name)?.id ?? '')?.x ?? -1;
		expect(x('a')).toBeLessThan(x('b'));
		expect(x('b')).toBeLessThan(x('c'));
		const boxes = schema.tables.map((t) => ({ ...positions.get(t.id), h: tableHeight(t) }));
		for (let i = 0; i < boxes.length; i++) {
			for (let j = i + 1; j < boxes.length; j++) {
				const a = boxes[i];
				const b = boxes[j];
				const overlap = a && b && (a.x ?? 0) < (b.x ?? 0) + CARD_WIDTH && (b.x ?? 0) < (a.x ?? 0) + CARD_WIDTH && (a.y ?? 0) < (b.y ?? 0) + b.h && (b.y ?? 0) < (a.y ?? 0) + a.h;
				expect(overlap).toBe(false);
			}
		}
	});
});

describe('merge', () => {
	it('keeps ids and positions of existing tables and lays out new ones', () => {
		const current = sql('CREATE TABLE a (id INT PRIMARY KEY, name TEXT);');
		current.tables[0] = { ...(current.tables[0] as Schema['tables'][number]), x: 500, y: 300, color: 'teal' };
		const imported = sql('CREATE TABLE a (id INT PRIMARY KEY, name TEXT, age INT); CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id));');
		const merged = mergeImported(current, imported, 'postgres');
		expect(merged.tables[0]).toMatchObject({ id: current.tables[0]?.id, x: 500, y: 300, color: 'teal' });
		expect(merged.tables[0]?.columns[0]?.id).toBe(current.tables[0]?.columns[0]?.id);
		expect(merged.tables[1]?.x).toBeGreaterThan(500 + CARD_WIDTH);
		expect(merged.relations[0]?.toTable).toBe(current.tables[0]?.id);
	});
});

describe('rules', () => {
	it('reports SQL Server multiple cascade paths', () => {
		const schema = sql(`CREATE TABLE a (id INT PRIMARY KEY);
CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id) ON DELETE CASCADE);
CREATE TABLE c (id INT PRIMARY KEY, a_id INT REFERENCES a(id) ON DELETE CASCADE);
CREATE TABLE d (id INT PRIMARY KEY, b_id INT REFERENCES b(id) ON DELETE CASCADE, c_id INT REFERENCES c(id) ON DELETE CASCADE);`);
		expect(rules(schema, 'sqlserver')).toContain('error:fk-cascade-paths');
		expect(rules(schema, 'postgres')).not.toContain('error:fk-cascade-paths');
	});

	it('flags self-referencing cascades only on SQL Server', () => {
		const schema = sql('CREATE TABLE n (id INT PRIMARY KEY, parent_id INT REFERENCES n(id) ON DELETE CASCADE);');
		expect(rules(schema, 'sqlserver')).toContain('error:fk-cascade-paths');
	});

	it('reports SET NULL on a NOT NULL column and fixes it', () => {
		const schema = sql('CREATE TABLE a (id INT PRIMARY KEY); CREATE TABLE b (id INT PRIMARY KEY, a_id INT NOT NULL REFERENCES a(id) ON DELETE SET NULL);');
		const found = analyze(schema, 'postgres').find((i) => i.rule === 'fk-setnull-notnull');
		expect(found?.severity).toBe('error');
		const fixed = applyFix(schema, found ?? analyze(schema, 'postgres')[0]!);
		expect(rules(fixed, 'postgres')).not.toContain('error:fk-setnull-notnull');
	});

	it('reports missing foreign key indexes except on MySQL and fixes them', () => {
		const schema = sql('CREATE TABLE a (id INT PRIMARY KEY); CREATE TABLE b (id INT PRIMARY KEY, a_id INT REFERENCES a(id));');
		expect(rules(schema, 'postgres')).toContain('warning:fk-no-index');
		expect(rules(schema, 'mysql')).not.toContain('warning:fk-no-index');
		const found = analyze(schema, 'postgres').find((i) => i.rule === 'fk-no-index');
		expect(rules(applyFix(schema, found!), 'postgres')).not.toContain('warning:fk-no-index');
	});

	it('reports text keys per dialect', () => {
		const schema = sql('CREATE TABLE a (code TEXT PRIMARY KEY, doc JSONB UNIQUE);');
		expect(rules(schema, 'mysql')).toEqual(expect.arrayContaining(['warning:key-lob', 'error:key-lob']));
		expect(rules(schema, 'sqlserver').filter((r) => r === 'error:key-lob').length).toBe(2);
		expect(rules(schema, 'postgres')).not.toContain('warning:key-lob');
	});

	it('reports foreign key type mismatches and targets without a key', () => {
		const schema = sql('CREATE TABLE a (id INT PRIMARY KEY, code TEXT); CREATE TABLE b (id INT PRIMARY KEY, a_id BIGINT REFERENCES a(id), a_code TEXT REFERENCES a(code));');
		expect(rules(schema, 'mysql')).toEqual(expect.arrayContaining(['error:fk-type-mismatch', 'error:fk-target-not-unique']));
		expect(rules(schema, 'postgres')).toContain('warning:fk-type-mismatch');
	});

	it('scores a clean design at 100 and drops with errors', () => {
		const clean = sql('CREATE TABLE a (id INT PRIMARY KEY);');
		expect(score(analyze(clean, 'postgres'))).toBe(100);
		const broken = sql('CREATE TABLE a (x INT, y INT); CREATE TABLE b (x INT);');
		expect(score(analyze(broken, 'postgres'))).toBeLessThan(100);
	});
});
