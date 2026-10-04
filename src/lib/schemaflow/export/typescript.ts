import { notNull } from '../model/diff';
import type { Column, Schema, SqlDialectId, Table } from '../model/types';
import { nameTables } from './names';

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export const propertyKey = (name: string) => (IDENTIFIER.test(name) ? name : JSON.stringify(name));

export function tsType(column: Column): string {
	switch (column.type.kind) {
		case 'smallint':
		case 'int':
		case 'bigint':
		case 'real':
		case 'double':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'date':
		case 'timestamp':
		case 'timestamptz':
			return 'Date';
		case 'binary':
			return 'Uint8Array';
		case 'json':
		case 'raw':
			return 'unknown';
		default:
			return 'string';
	}
}

export function isComputed(column: Column): boolean {
	return column.default.kind === 'computed';
}

export function isOptionalOnInsert(table: Table, column: Column): boolean {
	return column.default.kind !== 'none' || !notNull(table, column);
}

export function typescript(schema: Schema, _dialect: SqlDialectId): string {
	const names = nameTables(schema);
	const blocks: string[] = [];
	for (const table of schema.tables) {
		const named = names.get(table.id);
		if (!named) continue;
		const row = table.columns.map((c) => `\t${propertyKey(c.name)}: ${tsType(c)}${notNull(table, c) ? '' : ' | null'};`);
		const insert = table.columns
			.filter((c) => !isComputed(c))
			.map((c) => `\t${propertyKey(c.name)}${isOptionalOnInsert(table, c) ? '?' : ''}: ${tsType(c)}${notNull(table, c) ? '' : ' | null'};`);
		const comment = table.comment ? `/** ${table.comment.replace(/\*\//g, '* /').replace(/\r?\n/g, ' ')} */\n` : '';
		blocks.push(`${comment}export interface ${named.typeName} {\n${row.join('\n')}\n}`);
		blocks.push(`export interface ${named.typeName}Insert {\n${insert.join('\n')}\n}`);
	}
	return blocks.length > 0 ? `${blocks.join('\n\n')}\n` : '';
}
