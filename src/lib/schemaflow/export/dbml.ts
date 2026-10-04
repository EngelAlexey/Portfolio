import { DIALECT_LABELS } from '../dialects';
import { defaultSql, identitySql, relationName, sqlType } from '../dialects/sql-generate';
import { isOneToOne, isUnique } from '../model/ops';
import type { Column, Schema, SqlDialectId, Table } from '../model/types';
import { align, column } from './names';

const PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ACTION: Record<string, string> = { 'NO ACTION': 'no action', RESTRICT: 'restrict', CASCADE: 'cascade', 'SET NULL': 'set null', 'SET DEFAULT': 'set default' };

const flat = (value: string) => value.replace(/[\r\n\u2028\u2029]+/g, ' ');
const id = (name: string) => (PLAIN.test(name) ? name : `"${flat(name).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`);
const text = (value: string) => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replace(/\r\n|[\r\n\u2028\u2029]/g, '\\n')}'`;

function typeName(dialect: SqlDialectId, c: Column): string {
	const sql = sqlType(dialect, c.type);
	return /\s/.test(sql) ? `"${sql}"` : sql;
}

function defaultValue(dialect: SqlDialectId, c: Column): string | null {
	const value = c.default;
	if (value.kind === 'literal') {
		if (value.value === null) return 'null';
		if (typeof value.value === 'string') return text(value.value);
		return String(value.value);
	}
	const sql = defaultSql(dialect, c);
	return sql === null ? null : `\`${sql}\``;
}

function settings(dialect: SqlDialectId, t: Table, c: Column): string {
	const parts: string[] = [];
	if (t.primaryKey.length === 1 && t.primaryKey[0] === c.id) parts.push('pk');
	if (identitySql(dialect, c) !== null) parts.push('increment');
	if (!c.nullable && !t.primaryKey.includes(c.id)) parts.push('not null');
	if (isUnique(t, c.id)) parts.push('unique');
	const def = defaultValue(dialect, c);
	if (def !== null) parts.push(`default: ${def}`);
	if (c.comment) parts.push(`note: ${text(c.comment)}`);
	return parts.length > 0 ? `[${parts.join(', ')}]` : '';
}

export function dbml(schema: Schema, dialect: SqlDialectId): string {
	const blocks: string[] = [`Project ${id(schema.name.trim() || 'schema')} {\n  database_type: '${DIALECT_LABELS[dialect]}'\n}`];
	for (const t of schema.tables) {
		const lines = align(t.columns.map((c) => [`  ${id(c.name)}`, typeName(dialect, c), settings(dialect, t, c)].filter((cell, i) => i < 2 || cell)));
		const inner: string[] = [...lines];
		if (t.comment) inner.push('', `  Note: ${text(t.comment)}`);
		const entries: string[] = [];
		const names = (ids: string[]) => ids.map((x) => id(column(t, x)?.name ?? x)).join(', ');
		if (t.primaryKey.length > 1) entries.push(`    (${names(t.primaryKey)}) [pk]`);
		for (const u of t.uniques) if (u.columns.length > 1) entries.push(`    (${names(u.columns)}) [unique]`);
		for (const i of t.indexes) {
			if (i.columns.length === 0) continue;
			const target = i.columns.length > 1 ? `(${names(i.columns)})` : names(i.columns);
			entries.push(`    ${target}${i.unique ? ' [unique]' : ''}`);
		}
		if (entries.length > 0) inner.push('', `  indexes {\n${entries.join('\n')}\n  }`);
		blocks.push(`Table ${id(t.name)} {\n${inner.join('\n')}\n}`);
	}
	const refs: string[] = [];
	for (const r of schema.relations) {
		const from = schema.tables.find((t) => t.id === r.fromTable);
		const to = schema.tables.find((t) => t.id === r.toTable);
		if (!from || !to) continue;
		const side = (t: Table, ids: string[]) => (ids.length > 1 ? `${id(t.name)}.(${ids.map((x) => id(column(t, x)?.name ?? x)).join(', ')})` : `${id(t.name)}.${id(column(t, ids[0] ?? '')?.name ?? '')}`);
		const options: string[] = [];
		if (r.onDelete !== 'NO ACTION') options.push(`delete: ${ACTION[r.onDelete]}`);
		if (r.onUpdate !== 'NO ACTION') options.push(`update: ${ACTION[r.onUpdate]}`);
		const arrow = isOneToOne(schema, r) ? '-' : '>';
		refs.push(`Ref ${id(relationName(dialect, r, from))}: ${side(from, r.fromColumns)} ${arrow} ${side(to, r.toColumns)}${options.length > 0 ? ` [${options.join(', ')}]` : ''}`);
	}
	if (refs.length > 0) blocks.push(refs.join('\n'));
	return `${blocks.join('\n\n')}\n`;
}
