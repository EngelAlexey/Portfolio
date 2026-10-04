import { defaultSql, identitySql, indexLabel } from '../dialects/sql-generate';
import { uniqueName } from '../model/ids';
import type { Action, Column, Schema, SqlDialectId } from '../model/types';
import { column, jsString, nameTables, type Named } from './names';

export const DRIZZLE_DIALECTS: readonly SqlDialectId[] = ['postgres', 'mysql'];

const ACTION: Record<Action, string> = { 'NO ACTION': 'no action', RESTRICT: 'restrict', CASCADE: 'cascade', 'SET NULL': 'set null', 'SET DEFAULT': 'set default' };

const RESERVED = new Set(['sql', 'pgTable', 'mysqlTable', 'index', 'uniqueIndex', 'unique', 'primaryKey', 'foreignKey', 'customType', 'uuid', 'smallint', 'integer', 'int', 'bigint', 'real', 'float', 'double', 'doublePrecision', 'numeric', 'decimal', 'boolean', 'text', 'varchar', 'char', 'date', 'time', 'timestamp', 'datetime', 'json', 'jsonb', 'bytea', 'blob']);

interface Builder {
	call: string;
	imports: string[];
	custom?: string;
}

function builder(dialect: SqlDialectId, c: Column): Builder {
	const name = jsString(c.name);
	const t = c.type;
	const pg = dialect === 'postgres';
	switch (t.kind) {
		case 'uuid':
			return pg ? { call: `uuid(${name})`, imports: ['uuid'] } : { call: `char(${name}, { length: 36 })`, imports: ['char'] };
		case 'smallint':
			return { call: `smallint(${name})`, imports: ['smallint'] };
		case 'int':
			return pg ? { call: `integer(${name})`, imports: ['integer'] } : { call: `int(${name})`, imports: ['int'] };
		case 'bigint':
			return { call: `bigint(${name}, { mode: 'number' })`, imports: ['bigint'] };
		case 'real':
			return pg ? { call: `real(${name})`, imports: ['real'] } : { call: `float(${name})`, imports: ['float'] };
		case 'double':
			return pg ? { call: `doublePrecision(${name})`, imports: ['doublePrecision'] } : { call: `double(${name})`, imports: ['double'] };
		case 'decimal': {
			const fn = pg ? 'numeric' : 'decimal';
			const options = t.precision === undefined ? '' : `, { precision: ${t.precision}, scale: ${t.scale ?? 0} }`;
			return { call: `${fn}(${name}${options})`, imports: [fn] };
		}
		case 'boolean':
			return { call: `boolean(${name})`, imports: ['boolean'] };
		case 'text':
			return { call: `text(${name})`, imports: ['text'] };
		case 'varchar':
			return t.length || !pg ? { call: `varchar(${name}, { length: ${t.length ?? 255} })`, imports: ['varchar'] } : { call: `varchar(${name})`, imports: ['varchar'] };
		case 'char':
			return { call: `char(${name}, { length: ${t.length ?? 1} })`, imports: ['char'] };
		case 'date':
			return { call: `date(${name})`, imports: ['date'] };
		case 'time':
			return { call: `time(${name})`, imports: ['time'] };
		case 'timestamp':
			return pg ? { call: `timestamp(${name})`, imports: ['timestamp'] } : { call: `datetime(${name}, { fsp: 6 })`, imports: ['datetime'] };
		case 'timestamptz':
			return pg ? { call: `timestamp(${name}, { withTimezone: true })`, imports: ['timestamp'] } : { call: `timestamp(${name}, { fsp: 6 })`, imports: ['timestamp'] };
		case 'json':
			return pg ? { call: `jsonb(${name})`, imports: ['jsonb'] } : { call: `json(${name})`, imports: ['json'] };
		case 'binary':
			return { call: `binary(${name})`, imports: ['customType'], custom: pg ? 'bytea' : 'blob' };
		case 'raw':
			return { call: `customType<{ data: unknown }>({ dataType() { return ${jsString(t.sql)}; } })(${name})`, imports: ['customType'] };
	}
}

function defaultCall(dialect: SqlDialectId, c: Column, needsSql: { used: boolean }): string | null {
	const value = c.default;
	const kind = c.type.kind;
	const viaSql = () => {
		const sql = defaultSql(dialect, c);
		if (sql === null) return null;
		needsSql.used = true;
		return `.default(sql\`${sql.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')}\`)`;
	};
	switch (value.kind) {
		case 'none':
		case 'autoincrement':
		case 'computed':
			return null;
		case 'now':
			return kind === 'timestamp' || kind === 'timestamptz' ? '.defaultNow()' : viaSql();
		case 'uuid':
			return dialect === 'postgres' && kind === 'uuid' ? '.defaultRandom()' : viaSql();
		case 'expression':
			return viaSql();
		case 'literal': {
			const v = value.value;
			if (v === null) return null;
			if (typeof v === 'string') return `.default(${jsString(v)})`;
			if (typeof v === 'boolean') return kind === 'boolean' ? `.default(${v})` : viaSql();
			return kind === 'decimal' ? `.default(${jsString(String(v))})` : `.default(${v})`;
		}
	}
}

export function drizzle(schema: Schema, dialect: SqlDialectId): string {
	if (!DRIZZLE_DIALECTS.includes(dialect)) return '';
	const pg = dialect === 'postgres';
	const names = nameTables(schema);
	const taken: string[] = [];
	const variables = new Map<string, string>();
	for (const [id, named] of names) {
		let variable = RESERVED.has(named.variable) ? `${named.variable}Table` : named.variable;
		variable = uniqueName(variable, taken);
		taken.push(variable);
		variables.set(id, variable);
	}
	const imports = new Set<string>([pg ? 'pgTable' : 'mysqlTable']);
	const customs = new Set<string>();
	const needsSql = { used: false };
	const blocks: string[] = [];

	for (const table of schema.tables) {
		const named = names.get(table.id) as Named;
		const variable = variables.get(table.id) as string;
		const lines: string[] = [];
		const extras: string[] = [];
		const keys = (ids: string[]) => ids.map((x) => `t.${named.fields.get(x) ?? x}`).join(', ');
		const singlePk = table.primaryKey.length === 1 ? table.primaryKey[0] : undefined;

		for (const c of table.columns) {
			const b = builder(dialect, c);
			for (const i of b.imports) imports.add(i);
			let call = b.call;
			if (b.custom) {
				customs.add(b.custom);
				call = `${b.custom}(${jsString(c.name)})`;
			}
			const chain: string[] = [];
			if (c.id === singlePk) chain.push('.primaryKey()');
			else if (!c.nullable && !table.primaryKey.includes(c.id)) chain.push('.notNull()');
			if (identitySql(dialect, c) !== null) chain.push(pg ? '.generatedByDefaultAsIdentity()' : '.autoincrement()');
			const def = defaultCall(dialect, c, needsSql);
			if (def) chain.push(def);
			if (table.uniques.some((u) => u.columns.length === 1 && u.columns[0] === c.id) && c.id !== singlePk) chain.push('.unique()');
			const relation = schema.relations.find((r) => r.fromTable === table.id && r.fromColumns.length === 1 && r.fromColumns[0] === c.id && r.toTable !== table.id);
			if (relation) {
				const parent = names.get(relation.toTable);
				const target = parent ? column(parent.table, relation.toColumns[0] ?? '') : undefined;
				if (parent && target && relation.toColumns.length === 1) {
					const options = [relation.onDelete !== 'NO ACTION' ? `onDelete: '${ACTION[relation.onDelete]}'` : '', relation.onUpdate !== 'NO ACTION' ? `onUpdate: '${ACTION[relation.onUpdate]}'` : ''].filter(Boolean);
					chain.push(`.references(() => ${variables.get(parent.table.id)}.${parent.fields.get(target.id)}${options.length > 0 ? `, { ${options.join(', ')} }` : ''})`);
				}
			}
			lines.push(`\t${named.fields.get(c.id)}: ${call}${chain.join('')},`);
		}

		if (table.primaryKey.length > 1) {
			imports.add('primaryKey');
			extras.push(`primaryKey({ columns: [${keys(table.primaryKey)}] })`);
		}
		for (const u of table.uniques) {
			if (u.columns.length < 2) continue;
			imports.add('unique');
			extras.push(`unique().on(${keys(u.columns)})`);
		}
		for (const i of table.indexes) {
			if (i.columns.length === 0) continue;
			const fn = i.unique ? 'uniqueIndex' : 'index';
			imports.add(fn);
			extras.push(`${fn}(${jsString(indexLabel(dialect, table, i))}).on(${keys(i.columns)})`);
		}
		for (const r of schema.relations) {
			if (r.fromTable !== table.id) continue;
			const parent = names.get(r.toTable);
			if (!parent) continue;
			const inline = r.fromColumns.length === 1 && r.toTable !== table.id && Boolean(column(parent.table, r.toColumns[0] ?? ''));
			if (inline) continue;
			imports.add('foreignKey');
			const actions = [r.onDelete !== 'NO ACTION' ? `.onDelete('${ACTION[r.onDelete]}')` : '', r.onUpdate !== 'NO ACTION' ? `.onUpdate('${ACTION[r.onUpdate]}')` : ''].join('');
			const foreign = r.toColumns.map((x) => `${r.toTable === table.id ? 't' : variables.get(r.toTable)}.${parent.fields.get(x) ?? x}`).join(', ');
			extras.push(`foreignKey({ columns: [${keys(r.fromColumns)}], foreignColumns: [${foreign}] })${actions}`);
		}
		const factory = pg ? 'pgTable' : 'mysqlTable';
		const tail = extras.length > 0 ? `, (t) => [\n${extras.map((e) => `\t${e},`).join('\n')}\n]` : '';
		blocks.push(`export const ${variable} = ${factory}(${jsString(table.name)}, {\n${lines.join('\n')}\n}${tail});`);
	}

	const customDefs: string[] = [];
	if (customs.has('bytea')) customDefs.push(`const bytea = customType<{ data: Uint8Array }>({\n\tdataType() {\n\t\treturn 'bytea';\n\t},\n});`);
	if (customs.has('blob')) customDefs.push(`const blob = customType<{ data: Uint8Array }>({\n\tdataType() {\n\t\treturn 'blob';\n\t},\n});`);
	const head: string[] = [];
	if (needsSql.used) head.push(`import { sql } from 'drizzle-orm';`);
	head.push(`import { ${[...imports].sort().join(', ')} } from 'drizzle-orm/${pg ? 'pg' : 'mysql'}-core';`);
	return `${head.join('\n')}\n\n${[...customDefs, ...blocks].join('\n\n')}\n`;
}

