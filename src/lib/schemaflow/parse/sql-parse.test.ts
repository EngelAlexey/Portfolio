import { describe, expect, it } from 'vitest';
import { generateSql } from '../dialects/sql-generate';
import { SQL_DIALECTS } from '../model/types';
import { loadTemplates } from '../templates/template';
import { shape } from '../testing';
import { parseSql } from './sql-parse';

const errors = (result: ReturnType<typeof parseSql>) => result.issues.filter((i) => i.severity === 'error');
const line = (input: string, offset: number) => input.slice(0, offset).split('\n').length;

describe('templates', async () => {
	const templates = await loadTemplates();

	it('has the three original templates', () => {
		expect(templates.map((t) => t.id)).toEqual(['ecommerce', 'saas', 'blog']);
	});

	for (const template of templates) {
		it(`${template.id} parses as PostgreSQL without errors`, () => {
			const result = parseSql('postgres', template.sql);
			expect(errors(result)).toEqual([]);
			expect(result.schema.tables.length).toBeGreaterThan(2);
		});

		for (const dialect of SQL_DIALECTS) {
			it(`${template.id} round-trips through ${dialect}`, () => {
				const original = parseSql('postgres', template.sql).schema;
				const code = generateSql(dialect, original);
				const again = parseSql(dialect, code);
				expect(errors(again), code).toEqual([]);
				const expected = shape(original);
				if (dialect === 'sqlserver') {
					for (const r of expected.relations) {
						if (r.onDelete === 'RESTRICT') r.onDelete = 'NO ACTION';
						if (r.onUpdate === 'RESTRICT') r.onUpdate = 'NO ACTION';
					}
				}
				expect(shape(again.schema)).toEqual(expected);
				expect(generateSql(dialect, again.schema)).toBe(code);
			});
		}
	}
});

describe('postgres', () => {
	it('folds unquoted names and keeps quoted ones', () => {
		const result = parseSql('postgres', 'CREATE TABLE Users (Id INT PRIMARY KEY, "Name" TEXT);');
		expect(result.schema.tables[0]?.name).toBe('users');
		expect(result.schema.tables[0]?.columns.map((c) => c.name)).toEqual(['id', 'Name']);
	});

	it('accepts GENERATED ALWAYS AS IDENTITY and arrays', () => {
		const result = parseSql('postgres', 'CREATE TABLE t (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tags TEXT[], ip INET);');
		expect(errors(result)).toEqual([]);
		const [id, tags, ip] = result.schema.tables[0]?.columns ?? [];
		expect(id?.default).toEqual({ kind: 'autoincrement' });
		expect(tags?.type).toEqual({ kind: 'raw', dialect: 'postgres', sql: 'TEXT[]' });
		expect(ip?.type).toEqual({ kind: 'raw', dialect: 'postgres', sql: 'INET' });
	});

	it('reports a reserved word used as a name', () => {
		const result = parseSql('postgres', 'CREATE TABLE user (id INT);');
		expect(errors(result)[0]?.code).toBe('reserved-word');
	});

	it('reports a misspelled keyword at its position', () => {
		const input = 'CREATE TABLE a (id INT PRIMARY KEY);\nCREATE TABEL b (id INT);';
		const [first] = errors(parseSql('postgres', input));
		expect(first?.code).toBe('syntax');
		expect(input.slice(first?.from, first?.to)).toBe('TABEL');
		expect(line(input, first?.from ?? 0)).toBe(2);
	});

	it('reports a trailing comma', () => {
		const input = 'CREATE TABLE a (id INT,);';
		const [first] = errors(parseSql('postgres', input));
		expect(first?.code).toBe('syntax');
		expect(input.slice(first?.from, first?.to)).toBe(')');
	});

	it('reports an unterminated string', () => {
		const [first] = errors(parseSql('postgres', "CREATE TABLE a (s TEXT DEFAULT 'x);"));
		expect(first?.code).toBe('unterminated-string');
	});

	it('reads a pg_dump excerpt', () => {
		const dump = `
SET statement_timeout = 0;
SELECT pg_catalog.set_config('search_path', '', false);
\\connect shop
CREATE TYPE public.mood AS ENUM ('ok', 'sad');
CREATE TABLE public.people (
    id integer NOT NULL,
    name character varying(80) NOT NULL,
    mood public.mood,
    created timestamp with time zone DEFAULT now()
);
ALTER TABLE public.people OWNER TO postgres;
CREATE SEQUENCE public.people_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE ONLY public.people ALTER COLUMN id SET DEFAULT nextval('public.people_id_seq'::regclass);
ALTER TABLE ONLY public.people ADD CONSTRAINT people_pkey PRIMARY KEY (id);
CREATE TABLE public.pets (id integer NOT NULL, owner_id integer);
ALTER TABLE ONLY public.pets ADD CONSTRAINT pets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pets ADD CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.people(id) ON DELETE CASCADE;
CREATE INDEX pets_owner_idx ON public.pets USING btree (owner_id);
CREATE VIEW public.adults AS SELECT * FROM public.people;
COMMENT ON TABLE public.people IS 'Personas';
`;
		const result = parseSql('postgres', dump);
		expect(errors(result)).toEqual([]);
		const s = shape(result.schema);
		expect(s.tables.map((t) => t.name)).toEqual(['people', 'pets']);
		expect(s.tables[0]?.columns[0]?.default).toEqual({ kind: 'autoincrement' });
		expect(s.tables[0]?.primaryKey).toEqual(['id']);
		expect(s.tables[0]?.comment).toBe('Personas');
		expect(s.tables[0]?.columns[2]?.type).toEqual({ kind: 'raw', dialect: 'postgres', sql: 'public.mood' });
		expect(s.relations).toEqual([{ from: 'pets(owner_id)', to: 'people(id)', onDelete: 'CASCADE', onUpdate: 'NO ACTION' }]);
		expect(s.tables[1]?.indexes).toEqual([{ columns: ['owner_id'], unique: false }]);
		expect(result.schema.extras.map((e) => [e.placement, e.sql.split(' ').slice(0, 2).join(' ')])).toEqual([
			['before', 'CREATE TYPE'],
			['after', 'CREATE VIEW']
		]);
	});
});

describe('mysql', () => {
	it('reads a mysqldump excerpt', () => {
		const dump = `
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
DROP TABLE IF EXISTS \`orders\`;
CREATE TABLE \`orders\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`customer_id\` bigint unsigned NOT NULL,
  \`status\` enum('new','paid') NOT NULL DEFAULT 'new',
  \`paid\` tinyint(1) NOT NULL DEFAULT '0',
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`orders_customer_id_foreign\` (\`customer_id\`),
  CONSTRAINT \`orders_customer_id_foreign\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pedidos';
LOCK TABLES \`orders\` WRITE;
INSERT INTO \`orders\` VALUES (1,1,'new',0,NULL);
UNLOCK TABLES;
CREATE TABLE \`customers\` (\`id\` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`)) ENGINE=InnoDB;
`;
		const result = parseSql('mysql', dump);
		expect(errors(result)).toEqual([]);
		const s = shape(result.schema);
		expect(s.tables[0]?.comment).toBe('Pedidos');
		expect(s.tables[0]?.columns.map((c) => [c.name, c.type.kind, c.default.kind])).toEqual([
			['id', 'bigint', 'autoincrement'],
			['customer_id', 'bigint', 'none'],
			['status', 'raw', 'literal'],
			['paid', 'boolean', 'literal'],
			['updated_at', 'timestamptz', 'now']
		]);
		expect(s.tables[0]?.columns[3]?.default).toEqual({ kind: 'literal', value: false });
		expect(s.relations).toEqual([{ from: 'orders(customer_id)', to: 'customers(id)', onDelete: 'CASCADE', onUpdate: 'NO ACTION' }]);
		expect(result.issues.some((i) => i.code === 'fk-forward-mysql' && i.severity === 'warning')).toBe(true);
	});

	it('blocks a foreign key to a missing table on line 1', () => {
		const input = 'CREATE TABLE a (id INT PRIMARY KEY, b_id INT REFERENCES b(id));';
		const result = parseSql('mysql', input);
		const [first] = errors(result);
		expect(first?.code).toBe('fk-table-unknown');
		expect(first?.blocking).toBe(true);
		expect(input.slice(first?.from, first?.to)).toBe('b');
	});

	it('treats double quotes as strings', () => {
		expect(errors(parseSql('mysql', 'CREATE TABLE "a" (id INT);'))[0]?.code).toBe('syntax');
	});

	it('honours DELIMITER blocks', () => {
		const input = `CREATE TABLE t (id INT PRIMARY KEY);
DELIMITER //
CREATE TRIGGER tr BEFORE INSERT ON t FOR EACH ROW BEGIN SET NEW.id = 1; END//
DELIMITER ;
CREATE TABLE u (id INT PRIMARY KEY);`;
		const result = parseSql('mysql', input);
		expect(errors(result)).toEqual([]);
		expect(result.schema.tables.map((t) => t.name)).toEqual(['t', 'u']);
		expect(result.schema.extras[0]?.sql.startsWith('CREATE TRIGGER tr')).toBe(true);
	});
});

describe('sqlserver', () => {
	it('reads an SSMS script', () => {
		const script = `
USE [shop]
GO
SET ANSI_NULLS ON
GO
CREATE TABLE [dbo].[customers](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[bio] [nvarchar](max) NULL,
	[active] [bit] NOT NULL,
 CONSTRAINT [PK_customers] PRIMARY KEY CLUSTERED ([id] ASC)
 WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
CREATE TABLE [dbo].[orders]([id] [int] NOT NULL PRIMARY KEY, [customer_id] [int] NOT NULL)
GO
ALTER TABLE [dbo].[customers] ADD  CONSTRAINT [DF_customers_active]  DEFAULT ((1)) FOR [active]
GO
ALTER TABLE [dbo].[orders]  WITH CHECK ADD  CONSTRAINT [FK_orders_customers] FOREIGN KEY([customer_id])
REFERENCES [dbo].[customers] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[orders] CHECK CONSTRAINT [FK_orders_customers]
GO
CREATE VIEW [dbo].[v] AS SELECT 1 AS x;
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Clientes' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'customers'
GO
`;
		const result = parseSql('sqlserver', script);
		expect(errors(result)).toEqual([]);
		const s = shape(result.schema);
		expect(s.tables[0]?.columns.map((c) => [c.name, c.type.kind])).toEqual([
			['id', 'int'],
			['email', 'varchar'],
			['bio', 'text'],
			['active', 'boolean']
		]);
		expect(s.tables[0]?.columns[3]?.default).toEqual({ kind: 'literal', value: true });
		expect(s.tables[0]?.comment).toBe('Clientes');
		expect(s.relations).toEqual([{ from: 'orders(customer_id)', to: 'customers(id)', onDelete: 'CASCADE', onUpdate: 'NO ACTION' }]);
		expect(result.schema.extras[0]?.sql.startsWith('CREATE VIEW')).toBe(true);
	});

	it('detects JSON columns from ISJSON checks', () => {
		const result = parseSql('sqlserver', 'CREATE TABLE t (id INT PRIMARY KEY, data NVARCHAR(MAX) CHECK (ISJSON(data) = 1));');
		expect(result.schema.tables[0]?.columns[1]?.type).toEqual({ kind: 'json' });
		expect(result.schema.extras).toEqual([]);
	});
});

describe('robustness', () => {
	it('survives unbalanced and truncated input', () => {
		for (const input of ['CREATE TABLE ((((( ;', 'ALTER TABLE x ADD FOREIGN KEY', 'CREATE TABLE a (', 'CREATE TABLE a (id', "CREATE TABLE a (s TEXT DEFAULT 'x", '))))', ';;;;', '']) {
			for (const dialect of SQL_DIALECTS) {
				const result = parseSql(dialect, input);
				expect(result.schema.tables.length).toBeLessThanOrEqual(1);
			}
		}
	});
});
