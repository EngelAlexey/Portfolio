import { parse as parseJs } from 'acorn';
import { createId } from '../model/ids';
import { emptySchema, LIMITS, type Column, type LogicalType, type Relation, type Schema, type Table } from '../model/types';
import { issue, type CodeIssue } from './issues';

export interface MongoParseResult {
	schema: Schema;
	issues: CodeIssue[];
	statements: number;
}

type Lit =
	| { kind: 'object'; entries: { key: string; keyStart: number; keyEnd: number; value: Lit }[]; start: number; end: number }
	| { kind: 'array'; items: Lit[]; start: number; end: number }
	| { kind: 'scalar'; value: string | number | boolean | null; start: number; end: number };

interface JsNode {
	type: string;
	start: number;
	end: number;
	[key: string]: unknown;
}

class Failure {
	constructor(
		readonly code: string,
		readonly from: number,
		readonly to: number,
		readonly params?: Record<string, string | number>
	) {}
}

const BSON_TYPES = new Set([
	'double',
	'string',
	'object',
	'array',
	'binData',
	'objectId',
	'bool',
	'date',
	'null',
	'regex',
	'javascript',
	'int',
	'timestamp',
	'long',
	'decimal',
	'minKey',
	'maxKey',
	'number'
]);
const JSON_TYPES = new Set(['object', 'array', 'number', 'boolean', 'string', 'null']);
const KEYWORDS = new Set([
	'bsonType',
	'type',
	'required',
	'properties',
	'minimum',
	'maximum',
	'exclusiveMinimum',
	'exclusiveMaximum',
	'multipleOf',
	'minLength',
	'maxLength',
	'pattern',
	'enum',
	'title',
	'description',
	'items',
	'additionalItems',
	'minItems',
	'maxItems',
	'uniqueItems',
	'minProperties',
	'maxProperties',
	'additionalProperties',
	'patternProperties',
	'dependencies',
	'allOf',
	'anyOf',
	'oneOf',
	'not'
]);
const UNSUPPORTED = new Set(['$ref', '$schema', 'default', 'definitions', 'format', 'id', '$id', 'examples', 'const', '$defs']);

function node(value: unknown): JsNode | null {
	return value && typeof value === 'object' && 'type' in value ? (value as JsNode) : null;
}

function evaluate(n: JsNode): Lit {
	switch (n.type) {
		case 'ObjectExpression': {
			const entries: { key: string; keyStart: number; keyEnd: number; value: Lit }[] = [];
			for (const raw of (n.properties as JsNode[]) ?? []) {
				if (raw.type !== 'Property' || raw.computed || raw.method || raw.kind !== 'init') throw new Failure('mongo-not-literal', raw.start, raw.end);
				const key = node(raw.key);
				const value = node(raw.value);
				if (!key || !value) throw new Failure('mongo-not-literal', raw.start, raw.end);
				let name: string;
				if (key.type === 'Identifier') name = String(key.name);
				else if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')) name = String(key.value);
				else throw new Failure('mongo-not-literal', key.start, key.end);
				if (raw.shorthand) throw new Failure('mongo-not-literal', raw.start, raw.end);
				entries.push({ key: name, keyStart: key.start, keyEnd: key.end, value: evaluate(value) });
			}
			return { kind: 'object', entries, start: n.start, end: n.end };
		}
		case 'ArrayExpression': {
			const items: Lit[] = [];
			for (const element of (n.elements as (JsNode | null)[]) ?? []) {
				if (!element || element.type === 'SpreadElement') throw new Failure('mongo-not-literal', n.start, n.end);
				items.push(evaluate(element));
			}
			return { kind: 'array', items, start: n.start, end: n.end };
		}
		case 'Literal': {
			const value = n.value;
			if (n.regex || (value !== null && typeof value === 'object') || typeof value === 'bigint') throw new Failure('mongo-not-literal', n.start, n.end);
			return { kind: 'scalar', value: value as string | number | boolean | null, start: n.start, end: n.end };
		}
		case 'UnaryExpression': {
			const argument = node(n.argument);
			if ((n.operator === '-' || n.operator === '+') && argument?.type === 'Literal' && typeof argument.value === 'number') {
				return { kind: 'scalar', value: n.operator === '-' ? -argument.value : argument.value, start: n.start, end: n.end };
			}
			throw new Failure('mongo-not-literal', n.start, n.end);
		}
		case 'TemplateLiteral': {
			const quasis = (n.quasis as JsNode[]) ?? [];
			if (((n.expressions as unknown[]) ?? []).length > 0 || quasis.length !== 1) throw new Failure('mongo-not-literal', n.start, n.end);
			const cooked = (quasis[0]?.value as { cooked?: string } | undefined)?.cooked ?? '';
			return { kind: 'scalar', value: cooked, start: n.start, end: n.end };
		}
		default:
			throw new Failure('mongo-not-literal', n.start, n.end);
	}
}

function get(lit: Lit | undefined, key: string): Lit | undefined {
	return lit?.kind === 'object' ? lit.entries.find((e) => e.key === key)?.value : undefined;
}

function str(lit: Lit | undefined): string | undefined {
	return lit?.kind === 'scalar' && typeof lit.value === 'string' ? lit.value : undefined;
}

function int(lit: Lit | undefined): number | undefined {
	return lit?.kind === 'scalar' && typeof lit.value === 'number' && Number.isInteger(lit.value) ? lit.value : undefined;
}

interface Collection {
	name: string;
	start: number;
	end: number;
	statement: number;
	schema?: Lit;
	indexes: { keys: Lit; options?: Lit; start: number; end: number }[];
}

function checkSchema(lit: Lit, issues: CodeIssue[], depth = 0): void {
	if (lit.kind !== 'object' || depth > 20) return;
	for (const entry of lit.entries) {
		if (UNSUPPORTED.has(entry.key)) {
			issues.push(issue('error', 'mongo-keyword-unsupported', entry.keyStart, entry.keyEnd, { keyword: entry.key }));
			continue;
		}
		if (!KEYWORDS.has(entry.key)) {
			issues.push(issue('error', 'mongo-keyword-unknown', entry.keyStart, entry.keyEnd, { keyword: entry.key }));
			continue;
		}
		const value = entry.value;
		if (entry.key === 'bsonType') {
			const list = value.kind === 'array' ? value.items : [value];
			for (const item of list) {
				const name = str(item);
				if (!name || !BSON_TYPES.has(name)) issues.push(issue('error', 'mongo-bsontype', item.start, item.end, { value: name ?? '?' }));
			}
		}
		if (entry.key === 'type') {
			const list = value.kind === 'array' ? value.items : [value];
			for (const item of list) {
				const name = str(item);
				if (name === 'integer') issues.push(issue('error', 'mongo-type-integer', item.start, item.end));
				else if (!name || !JSON_TYPES.has(name)) issues.push(issue('error', 'mongo-bsontype', item.start, item.end, { value: name ?? '?' }));
			}
		}
		if (entry.key === 'properties' || entry.key === 'patternProperties') {
			if (value.kind !== 'object') issues.push(issue('error', 'mongo-not-object', value.start, value.end, { keyword: entry.key }));
			else for (const property of value.entries) checkSchema(property.value, issues, depth + 1);
		}
		if (entry.key === 'items' || entry.key === 'not' || entry.key === 'additionalProperties' || entry.key === 'additionalItems') {
			if (value.kind === 'object') checkSchema(value, issues, depth + 1);
			if (value.kind === 'array') for (const item of value.items) checkSchema(item, issues, depth + 1);
		}
		if (entry.key === 'allOf' || entry.key === 'anyOf' || entry.key === 'oneOf') {
			if (value.kind !== 'array') issues.push(issue('error', 'mongo-not-array', value.start, value.end, { keyword: entry.key }));
			else for (const item of value.items) checkSchema(item, issues, depth + 1);
		}
		if (entry.key === 'required') {
			if (value.kind !== 'array' || value.items.some((i) => str(i) === undefined)) {
				issues.push(issue('error', 'mongo-not-array', value.start, value.end, { keyword: entry.key }));
			}
		}
	}
}

function typeFor(property: Lit | undefined): { type: LogicalType; nullable: boolean } {
	const raw = get(property, 'bsonType') ?? get(property, 'type');
	const names = (raw?.kind === 'array' ? raw.items : raw ? [raw] : []).map((i) => str(i)).filter((s): s is string => Boolean(s));
	const nullable = names.includes('null');
	const main = names.find((n) => n !== 'null') ?? 'string';
	const maxLength = int(get(property, 'maxLength'));
	const minLength = int(get(property, 'minLength'));
	switch (main) {
		case 'objectId':
			return { type: { kind: 'uuid' }, nullable };
		case 'int':
			return { type: { kind: 'int' }, nullable };
		case 'long':
			return { type: { kind: 'bigint' }, nullable };
		case 'double':
		case 'number':
			return { type: { kind: 'double' }, nullable };
		case 'decimal':
			return { type: { kind: 'decimal' }, nullable };
		case 'bool':
		case 'boolean':
			return { type: { kind: 'boolean' }, nullable };
		case 'date':
			return { type: { kind: 'timestamptz' }, nullable };
		case 'object':
			return { type: { kind: 'json' }, nullable };
		case 'binData':
			return { type: { kind: 'binary' }, nullable };
		case 'string':
			if (maxLength !== undefined && minLength === maxLength) return { type: { kind: 'char', length: maxLength }, nullable };
			if (maxLength !== undefined) return { type: { kind: 'varchar', length: maxLength }, nullable };
			return { type: { kind: 'text' }, nullable };
		default:
			return { type: { kind: 'raw', dialect: 'mongodb', sql: main }, nullable };
	}
}

function splitDescription(text: string): { comment?: string; refs: { collection: string; field: string }[] } {
	const parts = text.split(' · ');
	const refs: { collection: string; field: string }[] = [];
	const rest: string[] = [];
	for (const part of parts) {
		const match = /^ref\s+(.+)\.([^.\s]+)$/.exec(part.trim());
		if (match?.[1] && match[2]) refs.push({ collection: match[1], field: match[2] });
		else rest.push(part);
	}
	const comment = rest.join(' · ').trim();
	return comment ? { comment, refs } : { refs };
}

function callee(n: JsNode): { object: JsNode | null; property: string | null } {
	const member = node(n.callee);
	if (!member || member.type !== 'MemberExpression') return { object: null, property: null };
	const property = node(member.property);
	let name: string | null = null;
	if (property?.type === 'Identifier' && !member.computed) name = String(property.name);
	if (property?.type === 'Literal' && typeof property.value === 'string') name = property.value;
	return { object: node(member.object), property: name };
}

function isDb(n: JsNode | null): boolean {
	return n?.type === 'Identifier' && n.name === 'db';
}

function collectionOf(n: JsNode | null): string | null {
	if (!n) return null;
	if (n.type === 'MemberExpression' && isDb(node(n.object))) {
		const property = node(n.property);
		if (property?.type === 'Identifier' && !n.computed) return String(property.name);
		if (property?.type === 'Literal' && typeof property.value === 'string') return property.value;
	}
	if (n.type === 'CallExpression') {
		const target = callee(n);
		if (isDb(target.object) && target.property === 'getCollection') {
			const arg = node((n.arguments as unknown[])[0]);
			if (arg?.type === 'Literal' && typeof arg.value === 'string') return arg.value;
		}
	}
	return null;
}

function blankShellUse(input: string): string {
	return input.replace(/^[ \t]*use[ \t]+[\w$-]+[ \t]*;?[ \t]*$/gim, (line) => ' '.repeat(line.length));
}

export function parseMongo(input: string): MongoParseResult {
	const issues: CodeIssue[] = [];
	const schema = emptySchema();
	if (input.length > LIMITS.code) {
		issues.push(issue('error', 'code-too-large', 0, 0, { max: LIMITS.code }));
		return { schema, issues, statements: 0 };
	}
	let program: JsNode;
	try {
		program = parseJs(blankShellUse(input), { ecmaVersion: 'latest', sourceType: 'script', allowAwaitOutsideFunction: true }) as unknown as JsNode;
	} catch (error) {
		const pos = typeof (error as { pos?: number }).pos === 'number' ? (error as { pos: number }).pos : 0;
		const message = String((error as Error).message ?? '').replace(/\s*\(\d+:\d+\)$/, '');
		issues.push(issue('error', 'js-syntax', pos, Math.min(input.length, pos + 1), { message }));
		return { schema, issues, statements: 0 };
	}

	const collections = new Map<string, Collection>();
	const order: Collection[] = [];
	const body = (program.body as JsNode[]) ?? [];

	body.forEach((statement, index) => {
		try {
			if (statement.type === 'EmptyStatement') return;
			if (statement.type !== 'ExpressionStatement') throw new Failure('mongo-unsupported', statement.start, statement.end);
			let expression = node(statement.expression);
			if (expression?.type === 'AwaitExpression') expression = node(expression.argument);
			if (!expression) throw new Failure('mongo-unsupported', statement.start, statement.end);
			if (expression.type === 'AssignmentExpression') {
				const left = node(expression.left);
				const right = node(expression.right);
				if (left?.type === 'Identifier' && left.name === 'db' && right?.type === 'CallExpression' && callee(right).property === 'getSiblingDB') return;
				throw new Failure('mongo-unsupported', statement.start, statement.end);
			}
			if (expression.type !== 'CallExpression') throw new Failure('mongo-unsupported', statement.start, statement.end);
			const args = ((expression.arguments as unknown[]) ?? []).map(node).filter((a): a is JsNode => a !== null);
			const target = callee(expression);
			const plainCallee = node(expression.callee);
			if (plainCallee?.type === 'Identifier' && plainCallee.name === 'use') return;
			if (isDb(target.object) && target.property === 'createCollection') {
				const nameArg = args[0] ? evaluate(args[0]) : undefined;
				const name = str(nameArg);
				if (!name || !nameArg) throw new Failure('mongo-collection-name', expression.start, expression.end);
				if (name.includes('$') || name.startsWith('system.') || !name.trim()) throw new Failure('mongo-collection-name', nameArg.start, nameArg.end);
				if (collections.has(name)) throw new Failure('table-duplicate', nameArg.start, nameArg.end, { table: name });
				if (order.length >= LIMITS.tables) throw new Failure('limit-tables', nameArg.start, nameArg.end, { max: LIMITS.tables });
				const options = args[1] ? evaluate(args[1]) : undefined;
				const validator = get(options, 'validator');
				const jsonSchema = get(validator, '$jsonSchema');
				if (validator && !jsonSchema) issues.push(issue('warning', 'mongo-validator-query', validator.start, validator.end));
				if (jsonSchema) checkSchema(jsonSchema, issues);
				const collection: Collection = { name, start: nameArg.start, end: nameArg.end, statement: index, schema: jsonSchema, indexes: [] };
				collections.set(name, collection);
				order.push(collection);
				return;
			}
			if (isDb(target.object) && target.property === 'runCommand') {
				const command = args[0] ? evaluate(args[0]) : undefined;
				const name = str(get(command, 'collMod'));
				const collection = name ? collections.get(name) : undefined;
				if (!name || !collection) throw new Failure('table-unknown', expression.start, expression.end, { table: name ?? '?' });
				const jsonSchema = get(get(command, 'validator'), '$jsonSchema');
				if (jsonSchema) {
					checkSchema(jsonSchema, issues);
					collection.schema = jsonSchema;
				}
				return;
			}
			if (target.property === 'createIndex' || target.property === 'createIndexes') {
				const name = collectionOf(target.object);
				if (!name) throw new Failure('mongo-unsupported', statement.start, statement.end);
				const collection = collections.get(name);
				if (!collection) throw new Failure('table-unknown', expression.start, expression.end, { table: name });
				const first = args[0] ? evaluate(args[0]) : undefined;
				const options = args[1] ? evaluate(args[1]) : undefined;
				if (!first) throw new Failure('mongo-not-literal', expression.start, expression.end);
				const keysList = target.property === 'createIndexes' ? (first.kind === 'array' ? first.items : []) : [first];
				for (const keys of keysList) collection.indexes.push({ keys, options, start: expression.start, end: expression.end });
				return;
			}
			throw new Failure('mongo-unsupported', statement.start, statement.end);
		} catch (error) {
			if (error instanceof Failure) issues.push(issue('error', error.code, error.from, error.to, error.params));
			else throw error;
		}
	});

	const built = new Map<string, { table: Table; fields: Map<string, string>; refs: { column: string; collection: string; field: string; start: number; end: number }[] }>();
	for (const collection of order) {
		const table: Table = { id: createId(), name: collection.name, x: 0, y: 0, columns: [], primaryKey: [], uniques: [], indexes: [] };
		const fields = new Map<string, string>();
		const refs: { column: string; collection: string; field: string; start: number; end: number }[] = [];
		const description = str(get(collection.schema, 'description'));
		if (description) table.comment = description;
		const required = new Set((get(collection.schema, 'required')?.kind === 'array' ? (get(collection.schema, 'required') as { items: Lit[] }).items : []).map((i) => str(i) ?? ''));
		const properties = get(collection.schema, 'properties');
		if (properties?.kind === 'object') {
			for (const entry of properties.entries) {
				if (entry.key.startsWith('$')) {
					issues.push(issue('error', 'mongo-field-dollar', entry.keyStart, entry.keyEnd, { field: entry.key }));
					continue;
				}
				if (table.columns.length >= LIMITS.columns) {
					issues.push(issue('error', 'limit-columns', entry.keyStart, entry.keyEnd, { max: LIMITS.columns }));
					break;
				}
				const title = str(get(entry.value, 'title'));
				const name = entry.key === '_id' && title ? title : entry.key;
				const { type, nullable } = typeFor(entry.value);
				const column: Column = { id: createId(), name, type, nullable: nullable || !required.has(entry.key), default: { kind: 'none' } };
				const text = str(get(entry.value, 'description'));
				if (text) {
					const parsed = splitDescription(text);
					if (parsed.comment) column.comment = parsed.comment;
					const at = get(entry.value, 'description');
					for (const ref of parsed.refs) refs.push({ column: column.id, ...ref, start: at?.start ?? entry.keyStart, end: at?.end ?? entry.keyEnd });
				}
				if (entry.key === '_id') {
					column.nullable = false;
					table.primaryKey = [column.id];
				}
				fields.set(entry.key, column.id);
				if (entry.key !== name) fields.set(name, column.id);
				table.columns.push(column);
			}
		}
		for (const field of required) {
			if (field && !fields.has(field)) {
				const list = get(collection.schema, 'required');
				issues.push(issue('error', 'mongo-required-unknown', list?.start ?? collection.start, list?.end ?? collection.end, { field }));
			}
		}
		for (const index of collection.indexes) {
			if (index.keys.kind !== 'object') {
				issues.push(issue('error', 'mongo-not-object', index.start, index.end, { keyword: 'createIndex' }));
				continue;
			}
			const special = index.keys.entries.some((e) => !(e.value.kind === 'scalar' && (e.value.value === 1 || e.value.value === -1)));
			const columns: string[] = [];
			for (const entry of index.keys.entries) {
				const id = fields.get(entry.key);
				if (!id) {
					issues.push(issue('error', 'column-unknown', entry.keyStart, entry.keyEnd, { column: entry.key, table: collection.name }));
					continue;
				}
				columns.push(id);
			}
			if (columns.length !== index.keys.entries.length) continue;
			if (special) {
				issues.push(issue('info', 'mongo-index-special', index.start, index.end));
				continue;
			}
			const unique = get(index.options, 'unique')?.kind === 'scalar' && (get(index.options, 'unique') as { value: unknown }).value === true;
			const name = str(get(index.options, 'name'));
			if (unique && table.primaryKey.length === 0 && name === `pk_${collection.name}`) {
				table.primaryKey = columns;
				for (const column of table.columns) if (columns.includes(column.id)) column.nullable = false;
				continue;
			}
			if (unique) table.uniques.push(name ? { id: createId(), name, columns } : { id: createId(), columns });
			else table.indexes.push(name ? { id: createId(), name, columns, unique: false } : { id: createId(), columns, unique: false });
		}
		built.set(collection.name, { table, fields, refs });
		schema.tables.push(table);
	}
	for (const { table, refs } of built.values()) {
		for (const ref of refs) {
			const target = built.get(ref.collection);
			const targetColumn = target?.fields.get(ref.field);
			if (!target || !targetColumn) {
				issues.push(issue('warning', 'mongo-ref-unknown', ref.start, ref.end, { ref: `${ref.collection}.${ref.field}` }, false));
				continue;
			}
			const relation: Relation = {
				id: createId(),
				fromTable: table.id,
				fromColumns: [ref.column],
				toTable: target.table.id,
				toColumns: [targetColumn],
				onDelete: 'NO ACTION',
				onUpdate: 'NO ACTION'
			};
			schema.relations.push(relation);
		}
	}
	issues.sort((a, b) => a.from - b.from);
	return { schema, issues, statements: body.length };
}
