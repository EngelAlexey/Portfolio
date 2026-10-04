import { uniqueName } from '../model/ids';
import type { Column, Relation, Schema, Table } from '../model/types';

export function words(value: string): string[] {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
}

export function pascal(value: string): string {
	const result = words(value)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join('');
	if (!result) return 'Unnamed';
	return /^\p{N}/u.test(result) ? `T${result}` : result;
}

export function camel(value: string): string {
	const result = pascal(value);
	return result.charAt(0).toLowerCase() + result.slice(1);
}

const JS_RESERVED = new Set(['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'await', 'interface', 'package', 'private', 'protected', 'public', 'implements']);

export function variableName(value: string): string {
	const name = camel(value);
	return JS_RESERVED.has(name) ? `${name}Table` : name;
}

export interface Named {
	table: Table;
	typeName: string;
	variable: string;
	fields: Map<string, string>;
}

export function nameTables(schema: Schema): Map<string, Named> {
	const typeNames: string[] = [];
	const variables: string[] = [];
	const result = new Map<string, Named>();
	for (const table of schema.tables) {
		const typeName = uniqueName(pascal(table.name), typeNames);
		typeNames.push(typeName);
		const variable = uniqueName(variableName(table.name), variables);
		variables.push(variable);
		const taken: string[] = [];
		const fields = new Map<string, string>();
		for (const column of table.columns) {
			const field = uniqueName(camel(column.name), taken);
			taken.push(field);
			fields.set(column.id, field);
		}
		result.set(table.id, { table, typeName, variable, fields });
	}
	return result;
}

export function column(table: Table, id: string): Column | undefined {
	return table.columns.find((c) => c.id === id);
}

export function relationsFrom(schema: Schema, tableId: string): Relation[] {
	return schema.relations.filter((r) => r.fromTable === tableId);
}

export function jsString(value: string): string {
	return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')}'`;
}

export function align(rows: string[][]): string[] {
	const widths: number[] = [];
	for (const row of rows) row.forEach((cell, i) => (widths[i] = Math.max(widths[i] ?? 0, cell.length)));
	return rows.map((row) => row.map((cell, i) => (i === row.length - 1 ? cell : cell.padEnd(widths[i] ?? 0))).join(' ').trimEnd());
}
