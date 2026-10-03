import type { Column, Schema, Table } from '../model/types';
import { constraintName } from './names';

type JsValue = string | number | boolean | null | JsValue[] | { [key: string]: JsValue };

const SAFE_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const DB_METHODS = new Set([
	'adminCommand',
	'aggregate',
	'auth',
	'commandHelp',
	'createCollection',
	'createRole',
	'createUser',
	'createView',
	'currentOp',
	'dropDatabase',
	'dropUser',
	'fsyncLock',
	'fsyncUnlock',
	'getCollection',
	'getCollectionInfos',
	'getCollectionNames',
	'getMongo',
	'getName',
	'getProfilingStatus',
	'getSiblingDB',
	'getUsers',
	'grantRolesToUser',
	'hello',
	'help',
	'isMaster',
	'killOp',
	'listCommands',
	'logout',
	'printCollectionStats',
	'revokeRolesFromUser',
	'rotateCertificates',
	'runCommand',
	'serverStatus',
	'setProfilingLevel',
	'shutdownServer',
	'sql',
	'stats',
	'version',
	'watch'
]);

function printKey(key: string): string {
	return SAFE_KEY.test(key) ? key : JSON.stringify(key);
}

export function printJs(value: JsValue, indent = ''): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value);
	const inner = `${indent}  `;
	if (Array.isArray(value)) {
		const flat = `[${value.map((v) => printJs(v, inner)).join(', ')}]`;
		if (flat.length <= 72 && !flat.includes('\n')) return flat;
		return `[\n${value.map((v) => `${inner}${printJs(v, inner)}`).join(',\n')}\n${indent}]`;
	}
	const entries = Object.entries(value);
	if (entries.length === 0) return '{}';
	const flat = `{ ${entries.map(([k, v]) => `${printKey(k)}: ${printJs(v, inner)}`).join(', ')} }`;
	if (flat.length <= 72 && !flat.includes('\n')) return flat;
	return `{\n${entries.map(([k, v]) => `${inner}${printKey(k)}: ${printJs(v, inner)}`).join(',\n')}\n${indent}}`;
}

export function collectionRef(name: string): string {
	return SAFE_KEY.test(name) && !name.includes('$') && !DB_METHODS.has(name) ? `db.${name}` : `db.getCollection(${JSON.stringify(name)})`;
}

export function fieldName(table: Table, columnId: string): string {
	if (table.primaryKey.length === 1 && table.primaryKey[0] === columnId) return '_id';
	return table.columns.find((c) => c.id === columnId)?.name ?? columnId;
}

function isKeyColumn(schema: Schema, table: Table, column: Column): boolean {
	if (table.primaryKey.includes(column.id)) return true;
	return schema.relations.some((r) => r.fromTable === table.id && r.fromColumns.includes(column.id));
}

export function bsonType(schema: Schema, table: Table, column: Column): string {
	const type = column.type;
	switch (type.kind) {
		case 'uuid':
			return isKeyColumn(schema, table, column) ? 'objectId' : 'string';
		case 'smallint':
		case 'int':
			return 'int';
		case 'bigint':
			return 'long';
		case 'real':
		case 'double':
			return 'double';
		case 'decimal':
			return 'decimal';
		case 'boolean':
			return 'bool';
		case 'date':
		case 'timestamp':
		case 'timestamptz':
			return 'date';
		case 'json':
			return 'object';
		case 'binary':
			return 'binData';
		case 'raw':
			return type.dialect === 'mongodb' ? type.sql : 'string';
		default:
			return 'string';
	}
}

function refsFor(schema: Schema, table: Table, column: Column): string[] {
	const refs: string[] = [];
	for (const relation of schema.relations) {
		if (relation.fromTable !== table.id) continue;
		const at = relation.fromColumns.indexOf(column.id);
		if (at === -1) continue;
		const target = schema.tables.find((t) => t.id === relation.toTable);
		const targetColumn = relation.toColumns[at];
		if (target && targetColumn) refs.push(`ref ${target.name}.${fieldName(target, targetColumn)}`);
	}
	return refs;
}

function property(schema: Schema, table: Table, column: Column): JsValue {
	const base = bsonType(schema, table, column);
	const isPk = table.primaryKey.includes(column.id);
	const out: { [key: string]: JsValue } = { bsonType: column.nullable && !isPk ? [base, 'null'] : base };
	if (fieldName(table, column.id) === '_id' && column.name !== '_id') out.title = column.name;
	if (column.type.kind === 'varchar' && column.type.length) out.maxLength = column.type.length;
	if (column.type.kind === 'char' && column.type.length) {
		out.minLength = column.type.length;
		out.maxLength = column.type.length;
	}
	const description = [column.comment, ...refsFor(schema, table, column)].filter((s): s is string => Boolean(s)).join(' · ');
	if (description) out.description = description;
	return out;
}

function keyDocument(table: Table, ids: string[]): JsValue {
	const doc: { [key: string]: JsValue } = {};
	for (const id of ids) doc[fieldName(table, id)] = 1;
	return doc;
}

function indexStatements(table: Table): string[] {
	const ref = collectionRef(table.name);
	const names = (ids: string[]) => ids.map((id) => table.columns.find((c) => c.id === id)?.name ?? id).join('_');
	const out: string[] = [];
	if (table.primaryKey.length > 1) {
		out.push(`${ref}.createIndex(${printJs(keyDocument(table, table.primaryKey))}, ${printJs({ unique: true, name: table.primaryKeyName ?? constraintName('mongodb', `pk_${table.name}`) })});`);
	}
	for (const unique of table.uniques) {
		if (unique.columns.length === 0) continue;
		out.push(`${ref}.createIndex(${printJs(keyDocument(table, unique.columns))}, ${printJs({ unique: true, name: unique.name ?? constraintName('mongodb', `uq_${table.name}_${names(unique.columns)}`) })});`);
	}
	for (const index of table.indexes) {
		if (index.columns.length === 0) continue;
		const options: { [key: string]: JsValue } = { name: index.name ?? constraintName('mongodb', `${index.unique ? 'ux' : 'ix'}_${table.name}_${names(index.columns)}`) };
		if (index.unique) options.unique = true;
		out.push(`${ref}.createIndex(${printJs(keyDocument(table, index.columns))}, ${printJs(options)});`);
	}
	return out;
}

function createCollection(schema: Schema, table: Table): string {
	const properties: { [key: string]: JsValue } = {};
	const required: string[] = [];
	for (const column of table.columns) {
		const field = fieldName(table, column.id);
		properties[field] = property(schema, table, column);
		if (!column.nullable || table.primaryKey.includes(column.id)) required.push(field);
	}
	const jsonSchema: { [key: string]: JsValue } = { bsonType: 'object', title: table.name };
	if (table.comment) jsonSchema.description = table.comment;
	if (required.length > 0) jsonSchema.required = required;
	jsonSchema.properties = properties;
	const options: JsValue = {
		validator: { $jsonSchema: jsonSchema },
		validationLevel: 'strict',
		validationAction: 'error'
	};
	return `db.createCollection(${JSON.stringify(table.name)}, ${printJs(options)});`;
}

export function generateMongo(schema: Schema): string {
	const blocks: string[] = [];
	for (const note of schema.notes) {
		if (!note.text.trim()) continue;
		blocks.push(
			note.text
				.trim()
				.split(/\r?\n/)
				.map((line) => `// ${line}`.trimEnd())
				.join('\n')
		);
	}
	for (const table of schema.tables) {
		const indexes = indexStatements(table);
		blocks.push([createCollection(schema, table), ...indexes].join('\n'));
	}
	return blocks.length > 0 ? `${blocks.join('\n\n')}\n` : '';
}
