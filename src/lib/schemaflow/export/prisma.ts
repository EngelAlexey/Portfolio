import { defaultSql } from '../dialects/sql-generate';
import { uniqueName } from '../model/ids';
import { isOneToOne } from '../model/ops';
import type { Action, Column, Relation, Schema, SqlDialectId } from '../model/types';
import { align, camel, column, nameTables, pascal, type Named } from './names';

const PROVIDER: Record<SqlDialectId, string> = { postgres: 'postgresql', mysql: 'mysql', sqlserver: 'sqlserver' };
const ACTION: Record<Action, string> = { 'NO ACTION': 'NoAction', RESTRICT: 'Restrict', CASCADE: 'Cascade', 'SET NULL': 'SetNull', 'SET DEFAULT': 'SetDefault' };

interface Mapped {
	type: string;
	native?: string;
}

function mapType(dialect: SqlDialectId, c: Column): Mapped {
	const type = c.type;
	const pg = dialect === 'postgres';
	const my = dialect === 'mysql';
	switch (type.kind) {
		case 'uuid':
			return { type: 'String', native: pg ? '@db.Uuid' : my ? '@db.Char(36)' : '@db.UniqueIdentifier' };
		case 'smallint':
			return { type: 'Int', native: '@db.SmallInt' };
		case 'int':
			return { type: 'Int' };
		case 'bigint':
			return { type: 'BigInt' };
		case 'real':
			return { type: 'Float', native: my ? '@db.Float' : '@db.Real' };
		case 'double':
			return { type: 'Float' };
		case 'decimal':
			if (type.precision === undefined) return pg ? { type: 'Decimal' } : { type: 'Decimal', native: '@db.Decimal(38, 10)' };
			return { type: 'Decimal', native: `@db.Decimal(${type.precision}, ${type.scale ?? 0})` };
		case 'boolean':
			return { type: 'Boolean' };
		case 'text':
			return pg ? { type: 'String' } : { type: 'String', native: my ? '@db.Text' : '@db.NVarChar(Max)' };
		case 'varchar':
			if (dialect === 'sqlserver') return { type: 'String', native: `@db.NVarChar(${(type.length ?? 255) > 4000 ? 'Max' : (type.length ?? 255)})` };
			return { type: 'String', native: type.length || my ? `@db.VarChar(${type.length ?? 255})` : undefined };
		case 'char':
			return { type: 'String', native: `@db.${dialect === 'sqlserver' ? 'NChar' : 'Char'}(${type.length ?? 1})` };
		case 'date':
			return { type: 'DateTime', native: '@db.Date' };
		case 'time':
			return { type: 'DateTime', native: pg ? '@db.Time(6)' : my ? '@db.Time(0)' : '@db.Time' };
		case 'timestamp':
			return { type: 'DateTime', native: pg ? '@db.Timestamp(6)' : my ? '@db.DateTime(6)' : '@db.DateTime2' };
		case 'timestamptz':
			return { type: 'DateTime', native: pg ? '@db.Timestamptz(6)' : my ? '@db.Timestamp(6)' : '@db.DateTimeOffset' };
		case 'json':
			return dialect === 'sqlserver' ? { type: 'String', native: '@db.NVarChar(Max)' } : { type: 'Json' };
		case 'binary':
			return { type: 'Bytes' };
		case 'raw':
			return { type: `Unsupported(${JSON.stringify(type.sql)})` };
	}
}

function generated(dialect: SqlDialectId, c: Column): string | null {
	const sql = defaultSql(dialect, c);
	return sql === null ? null : `@default(dbgenerated(${JSON.stringify(sql)}))`;
}

function defaultAttribute(dialect: SqlDialectId, c: Column, mapped: Mapped): string | null {
	const value = c.default;
	switch (value.kind) {
		case 'none':
		case 'computed':
			return null;
		case 'autoincrement':
			return mapped.type === 'Int' || mapped.type === 'BigInt' ? '@default(autoincrement())' : null;
		case 'now':
			return mapped.type === 'DateTime' ? '@default(now())' : null;
		case 'uuid':
			return mapped.type === 'String' ? '@default(uuid())' : null;
		case 'literal': {
			const v = value.value;
			if (v === null) return null;
			if (typeof v === 'boolean') return mapped.type === 'Boolean' ? `@default(${v})` : generated(dialect, c);
			if (typeof v === 'number') return ['Int', 'BigInt', 'Float', 'Decimal'].includes(mapped.type) ? `@default(${v})` : generated(dialect, c);
			return mapped.type === 'String' ? `@default(${JSON.stringify(v)})` : generated(dialect, c);
		}
		case 'expression':
			return generated(dialect, c);
	}
}

const modelAction = (dialect: SqlDialectId, action: Action) => (dialect === 'sqlserver' && action === 'RESTRICT' ? 'NoAction' : ACTION[action]);

export function prisma(schema: Schema, dialect: SqlDialectId): string {
	const names = nameTables(schema);
	const usedFields = new Map<string, string[]>();
	for (const [id, named] of names) usedFields.set(id, [...named.fields.values()]);
	const claim = (tableId: string, wanted: string) => {
		const taken = usedFields.get(tableId) ?? [];
		const name = uniqueName(wanted, taken);
		taken.push(name);
		usedFields.set(tableId, taken);
		return name;
	};

	const pairKey = (r: Relation) => [r.fromTable, r.toTable].sort().join('|');
	const pairCount = new Map<string, number>();
	for (const r of schema.relations) pairCount.set(pairKey(r), (pairCount.get(pairKey(r)) ?? 0) + 1);

	const extra = new Map<string, string[][]>();
	const add = (tableId: string, row: string[]) => extra.set(tableId, [...(extra.get(tableId) ?? []), row]);

	for (const r of schema.relations) {
		const from = names.get(r.fromTable);
		const to = names.get(r.toTable);
		if (!from || !to) continue;
		const fromColumns = r.fromColumns.map((x) => column(from.table, x)).filter((x): x is Column => Boolean(x));
		const toColumns = r.toColumns.map((x) => column(to.table, x)).filter((x): x is Column => Boolean(x));
		if (fromColumns.length === 0 || fromColumns.length !== toColumns.length) continue;
		const stem = fromColumns.length === 1 ? (fromColumns[0]?.name ?? '').replace(/[_ ]?id$/i, '') : '';
		const field = claim(from.table.id, stem ? camel(stem) : camel(to.table.name));
		const oneToOne = isOneToOne(schema, r);
		const labelled = pairCount.get(pairKey(r)) !== 1 || r.fromTable === r.toTable;
		const back = claim(to.table.id, labelled ? camel(`${from.table.name}_${field}`) : oneToOne ? camel(from.typeName) : camel(from.table.name));
		const label = labelled ? `"${from.typeName}${pascal(field)}"` : null;
		const optional = fromColumns.some((x) => x.nullable);
		const fields = fromColumns.map((x) => from.fields.get(x.id) ?? x.name).join(', ');
		const references = toColumns.map((x) => to.fields.get(x.id) ?? x.name).join(', ');
		const args = [label, `fields: [${fields}]`, `references: [${references}]`, `onDelete: ${modelAction(dialect, r.onDelete)}`, `onUpdate: ${modelAction(dialect, r.onUpdate)}`].filter(Boolean).join(', ');
		add(from.table.id, [`  ${field}`, `${to.typeName}${optional ? '?' : ''}`, `@relation(${args})`]);
		add(to.table.id, [`  ${back}`, `${from.typeName}${oneToOne ? '?' : '[]'}`, ...(label ? [`@relation(${label})`] : [])]);
	}

	const blocks: string[] = [`generator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}`, `datasource db {\n  provider = "${PROVIDER[dialect]}"\n}`];

	for (const table of schema.tables) {
		const named = names.get(table.id) as Named;
		const rows: string[][] = [];
		const singlePk = table.primaryKey.length === 1 ? table.primaryKey[0] : undefined;
		const prefixed = (c: Column | undefined) => dialect === 'mysql' && c !== undefined && (c.type.kind === 'text' || c.type.kind === 'binary');
		const keyArgument = (c: Column | undefined) => (prefixed(c) ? '(length: 255)' : '');
		for (const c of table.columns) {
			const mapped = mapType(dialect, c);
			const field = named.fields.get(c.id) ?? c.name;
			const required = !c.nullable || table.primaryKey.includes(c.id);
			const attrs: string[] = [];
			if (c.id === singlePk) attrs.push(`@id${keyArgument(c)}`);
			else if (table.uniques.some((u) => u.columns.length === 1 && u.columns[0] === c.id)) attrs.push(`@unique${keyArgument(c)}`);
			const def = defaultAttribute(dialect, c, mapped);
			if (def) attrs.push(def);
			if (field !== c.name) attrs.push(`@map(${JSON.stringify(c.name)})`);
			if (mapped.native) attrs.push(mapped.native);
			const optional = required || mapped.type.startsWith('Unsupported') ? '' : '?';
			rows.push([`  ${field}`, `${mapped.type}${optional}`, ...(attrs.length > 0 ? [attrs.join(' ')] : [])]);
		}
		rows.push(...(extra.get(table.id) ?? []));
		const trailer: string[] = [];
		const keys = (ids: string[]) => ids.map((x) => `${named.fields.get(x) ?? x}${keyArgument(column(table, x))}`).join(', ');
		if (table.primaryKey.length > 1) trailer.push(`  @@id([${keys(table.primaryKey)}])`);
		for (const u of table.uniques) if (u.columns.length > 1) trailer.push(`  @@unique([${keys(u.columns)}])`);
		for (const i of table.indexes) if (i.columns.length > 0) trailer.push(`  @@${i.unique ? 'unique' : 'index'}([${keys(i.columns)}])`);
		const hasKey = table.primaryKey.length > 0 || table.uniques.some((u) => u.columns.length > 0) || table.indexes.some((i) => i.unique && i.columns.length > 0);
		if (!hasKey) trailer.push('  @@ignore');
		if (named.typeName !== table.name) trailer.push(`  @@map(${JSON.stringify(table.name)})`);
		blocks.push(`model ${named.typeName} {\n${[...align(rows), ...(trailer.length > 0 ? ['', ...trailer] : [])].join('\n')}\n}`);
	}
	return `${blocks.join('\n\n')}\n`;
}
