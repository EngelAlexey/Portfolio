import { isReserved } from '../dialects/reserved';
import { quote } from '../dialects/names';
import { createId } from '../model/ids';
import {
	emptySchema,
	LIMITS,
	type Action,
	type Column,
	type DefaultValue,
	type Extra,
	type LogicalType,
	type Relation,
	type Schema,
	type SqlDialectId,
	type Table
} from '../model/types';
import { issue, type CodeIssue } from './issues';
import { tokenize, type Token } from './sql-lexer';
import { splitStatements, type Statement } from './sql-split';
import { mapType, type TypeArg } from './sql-types';

export interface SqlParseResult {
	schema: Schema;
	issues: CodeIssue[];
	statements: number;
}

interface Ref {
	name: string;
	from: number;
	to: number;
}

interface PColumn {
	name: string;
	from: number;
	to: number;
	type: LogicalType;
	nullable: boolean;
	def: DefaultValue;
	comment?: string;
}

interface PKey {
	name?: string;
	columns: Ref[];
	from: number;
	to: number;
}

interface PIndex extends PKey {
	unique: boolean;
}

interface PFk {
	name?: string;
	columns: Ref[];
	table: Ref;
	refColumns: Ref[] | null;
	onDelete: Action;
	onUpdate: Action;
	statement: number;
	from: number;
	to: number;
}

interface PTable {
	name: string;
	from: number;
	to: number;
	statement: number;
	comment?: string;
	columns: PColumn[];
	pk: PKey | null;
	uniques: PKey[];
	indexes: PIndex[];
	fks: PFk[];
	checks: { name?: string; text: string }[];
}

class Failure {
	constructor(
		readonly code: string,
		readonly from: number,
		readonly to: number,
		readonly params?: Record<string, string | number>
	) {}
}

const NOISE_START = new Set([
	'SET',
	'RESET',
	'USE',
	'BEGIN',
	'START',
	'COMMIT',
	'ROLLBACK',
	'END',
	'LOCK',
	'UNLOCK',
	'DROP',
	'TRUNCATE',
	'INSERT',
	'UPDATE',
	'DELETE',
	'COPY',
	'REPLACE',
	'LOAD',
	'GRANT',
	'REVOKE',
	'PRINT',
	'SELECT',
	'ANALYZE',
	'VACUUM',
	'DECLARE',
	'SAVEPOINT',
	'RELEASE',
	'CHECKPOINT',
	'CLUSTER',
	'REINDEX',
	'REFRESH',
	'NOTIFY',
	'LISTEN',
	'UNLISTEN',
	'DISCARD',
	'FLUSH',
	'OPTIMIZE',
	'WITH',
	'VALUES',
	'EXPLAIN',
	'SHOW',
	'DESCRIBE',
	'DESC',
	'MERGE',
	'RAISERROR',
	'THROW',
	'WAITFOR',
	'DBCC',
	'BACKUP',
	'RESTORE',
	'SECURITY',
	'ABORT',
	'PREPARE',
	'DEALLOCATE',
	'FETCH',
	'CLOSE',
	'OPEN',
	'MOVE'
]);

const CREATE_BEFORE = new Set(['TYPE', 'DOMAIN', 'EXTENSION', 'COLLATION']);
const CREATE_IGNORED = new Set(['SCHEMA', 'DATABASE', 'SEQUENCE', 'ROLE', 'USER', 'LOGIN', 'TABLESPACE', 'GROUP']);
const CREATE_AFTER = new Set([
	'VIEW',
	'MATERIALIZED',
	'FUNCTION',
	'PROCEDURE',
	'PROC',
	'TRIGGER',
	'RULE',
	'POLICY',
	'EVENT',
	'AGGREGATE',
	'OPERATOR',
	'STATISTICS',
	'PUBLICATION',
	'SUBSCRIPTION',
	'SYNONYM',
	'CAST',
	'TRANSFORM',
	'LANGUAGE',
	'TRUSTED',
	'PROCEDURAL',
	'DEFINER',
	'ALGORITHM',
	'SQL',
	'RECURSIVE',
	'FOREIGN',
	'SERVER',
	'TEXT',
	'CONVERSION',
	'ACCESS',
	'DEFAULT',
	'CONSTRAINT',
	'EVENT',
	'XML',
	'COLUMNSTORE',
	'PARTITION',
	'FULLTEXT',
	'SPATIAL'
]);

const NOW_WORDS = new Set(['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME', 'LOCALTIMESTAMP', 'LOCALTIME', 'SYSDATE']);
const NOW_FUNCS = new Set([
	'NOW',
	'CURRENT_TIMESTAMP',
	'GETDATE',
	'GETUTCDATE',
	'SYSDATETIME',
	'SYSDATETIMEOFFSET',
	'SYSUTCDATETIME',
	'UTC_TIMESTAMP',
	'TRANSACTION_TIMESTAMP',
	'STATEMENT_TIMESTAMP',
	'CLOCK_TIMESTAMP',
	'LOCALTIMESTAMP',
	'LOCALTIME',
	'CURRENT_DATE',
	'CURDATE',
	'CURRENT_TIME',
	'CURTIME',
	'SYSDATE'
]);
const NUMERIC_KINDS = new Set(['smallint', 'int', 'bigint', 'real', 'double', 'decimal']);
const UUID_FUNCS = new Set(['GEN_RANDOM_UUID', 'UUID_GENERATE_V4', 'UUID_GENERATE_V1', 'UUID', 'NEWID', 'NEWSEQUENTIALID', 'UUIDV4']);
const BINARY_OPS = new Set(['+', '-', '*', '/', '%', '|', '&', '^', '=', '<', '>', '!']);
const ALTER_NOISE = new Set([
	'OWNER',
	'ENABLE',
	'DISABLE',
	'SET',
	'REPLICA',
	'CLUSTER',
	'INHERIT',
	'NO',
	'AUTO_INCREMENT',
	'ENGINE',
	'CONVERT',
	'FORCE',
	'ALGORITHM',
	'LOCK',
	'ATTACH',
	'DETACH',
	'VALIDATE',
	'OF',
	'NOT',
	'RESET',
	'ROW_FORMAT',
	'CHARACTER',
	'CHARSET',
	'COLLATE',
	'COMMENT',
	'CHECK',
	'NOCHECK',
	'REBUILD',
	'SWITCH',
	'TRIGGER',
	'ORDER',
	'DISCARD',
	'IMPORT',
	'TABLESPACE',
	'DEFAULT'
]);

class Cursor {
	i = 0;

	constructor(
		readonly tokens: Token[],
		readonly dialect: SqlDialectId,
		readonly input: string,
		readonly stmt: Statement
	) {}

	peek(k = 0): Token | undefined {
		return this.tokens[this.i + k];
	}

	atEnd(): boolean {
		return this.i >= this.tokens.length;
	}

	next(): Token {
		const token = this.tokens[this.i];
		if (!token) this.fail(['…']);
		this.i++;
		return token;
	}

	isWord(...words: string[]): boolean {
		const t = this.peek();
		return t?.type === 'word' && words.includes(t.upper);
	}

	isWordAt(k: number, ...words: string[]): boolean {
		const t = this.peek(k);
		return t?.type === 'word' && words.includes(t.upper);
	}

	acceptWord(...words: string[]): Token | undefined {
		return this.isWord(...words) ? this.next() : undefined;
	}

	acceptWords(sequence: string[]): boolean {
		for (let k = 0; k < sequence.length; k++) if (!this.isWordAt(k, sequence[k] ?? '')) return false;
		this.i += sequence.length;
		return true;
	}

	expectWord(...words: string[]): Token {
		if (!this.isWord(...words)) this.fail(words);
		return this.next();
	}

	isPunct(value: string): boolean {
		const t = this.peek();
		return t?.type === 'punct' && t.value === value;
	}

	acceptPunct(value: string): Token | undefined {
		return this.isPunct(value) ? this.next() : undefined;
	}

	expectPunct(value: string): Token {
		if (!this.isPunct(value)) this.fail([value]);
		return this.next();
	}

	fail(expected: string[], code = 'syntax'): never {
		const token = this.peek();
		if (!token) {
			const last = this.tokens[this.tokens.length - 1];
			const at = last ? last.end : this.stmt.end;
			throw new Failure(code, at, at, { expected: expected.join('|'), found: '' });
		}
		throw new Failure(code, token.start, token.end, { expected: expected.join('|'), found: this.input.slice(token.start, token.end).slice(0, 40) });
	}

	text(fromIndex: number, toIndex = this.i): string {
		const first = this.tokens[fromIndex];
		const last = this.tokens[toIndex - 1];
		if (!first || !last) return '';
		return this.input.slice(first.start, last.end);
	}

	skipGroup(): void {
		if (!this.isPunct('(') && !this.isPunct('[')) {
			this.next();
			return;
		}
		const open = this.next().value;
		const close = open === '(' ? ')' : ']';
		let depth = 1;
		while (!this.atEnd() && depth > 0) {
			const t = this.next();
			if (t.type === 'punct' && t.value === open) depth++;
			if (t.type === 'punct' && t.value === close) depth--;
		}
		if (depth > 0) this.fail([close]);
	}

	skipToElementEnd(): void {
		while (!this.atEnd() && !this.isPunct(',') && !this.isPunct(')')) this.skipGroup();
	}
}

class State {
	readonly tables = new Map<string, PTable>();
	readonly order: PTable[] = [];
	readonly extras: Extra[] = [];
	readonly issues: CodeIssue[] = [];
	ignored = 0;
	firstIgnored: { from: number; to: number } | null = null;
	readonly flags = new Set<string>();

	constructor(
		readonly dialect: SqlDialectId,
		readonly input: string
	) {}

	key(name: string): string {
		return this.dialect === 'postgres' ? name : name.toLowerCase();
	}

	table(name: string): PTable | undefined {
		return this.tables.get(this.key(name));
	}

	column(table: PTable, name: string): PColumn | undefined {
		const key = this.key(name);
		return table.columns.find((c) => this.key(c.name) === key);
	}

	once(flag: string, entry: CodeIssue): void {
		if (this.flags.has(flag)) return;
		this.flags.add(flag);
		this.issues.push(entry);
	}

	extra(stmt: Statement, placement: 'before' | 'after', sql?: string): void {
		this.extras.push({ id: createId(), dialect: this.dialect, sql: (sql ?? this.input.slice(stmt.start, stmt.end)).trim(), placement });
		const lineEnd = this.input.indexOf('\n', stmt.start);
		this.issues.push(issue('info', 'statement-preserved', stmt.start, lineEnd === -1 || lineEnd > stmt.end ? stmt.end : lineEnd));
	}

	ignore(stmt: Statement): void {
		this.ignored++;
		if (!this.firstIgnored) {
			const lineEnd = this.input.indexOf('\n', stmt.start);
			this.firstIgnored = { from: stmt.start, to: lineEnd === -1 || lineEnd > stmt.end ? stmt.end : lineEnd };
		}
	}
}

function identifier(c: Cursor, allowReserved = false): Ref {
	const t = c.peek();
	if (!t || (t.type !== 'word' && t.type !== 'quoted')) c.fail(['name']);
	if (t.type === 'word' && !allowReserved && isReserved(c.dialect, t.value)) {
		throw new Failure('reserved-word', t.start, t.end, { word: t.value });
	}
	c.next();
	const name = t.type === 'quoted' ? t.value : c.dialect === 'postgres' ? t.value.toLowerCase() : t.value;
	return { name, from: t.start, to: t.end };
}

function qualifiedName(c: Cursor, state: State): Ref {
	const first = identifier(c);
	const parts = [first];
	while (c.isPunct('.')) {
		c.next();
		if (c.isPunct('.')) continue;
		parts.push(identifier(c, true));
	}
	const last = parts[parts.length - 1] ?? first;
	if (parts.length > 1) {
		const schema = parts[parts.length - 2]?.name.toLowerCase();
		if (schema && schema !== 'public' && schema !== 'dbo') {
			state.once(`schema:${schema}`, issue('info', 'schema-ignored', first.from, last.to, { schema: parts[parts.length - 2]?.name ?? '' }));
		}
	}
	return { name: last.name, from: first.from, to: last.to };
}

function columnList(c: Cursor): Ref[] {
	c.expectPunct('(');
	const refs: Ref[] = [];
	do {
		refs.push(identifier(c, true));
	} while (c.acceptPunct(','));
	c.expectPunct(')');
	return refs;
}

function keyColumns(c: Cursor, state: State): { refs: Ref[]; plain: boolean } {
	c.expectPunct('(');
	const refs: Ref[] = [];
	let plain = true;
	do {
		if (c.isPunct('(')) {
			c.skipGroup();
			plain = false;
		} else {
			refs.push(identifier(c, true));
			if (c.isPunct('(') && c.dialect === 'mysql') {
				const at = c.peek();
				c.skipGroup();
				if (at) state.once('prefix', issue('info', 'prefix-ignored', at.start, at.end));
			} else if (c.isPunct('(') || c.isPunct('::') || c.isPunct('[')) {
				plain = false;
				c.skipGroup();
			}
		}
		while (!c.atEnd() && !c.isPunct(',') && !c.isPunct(')')) {
			if (c.acceptWord('ASC', 'DESC')) continue;
			if (c.acceptWords(['NULLS', 'FIRST']) || c.acceptWords(['NULLS', 'LAST'])) continue;
			if (c.acceptWord('COLLATE')) {
				c.next();
				continue;
			}
			plain = false;
			c.skipGroup();
		}
	} while (c.acceptPunct(','));
	c.expectPunct(')');
	return { refs, plain };
}

function parseAction(c: Cursor): Action {
	if (c.acceptWord('CASCADE')) return 'CASCADE';
	if (c.acceptWord('RESTRICT')) return 'RESTRICT';
	if (c.acceptWords(['NO', 'ACTION'])) return 'NO ACTION';
	if (c.acceptWords(['SET', 'NULL'])) {
		if (c.isPunct('(')) c.skipGroup();
		return 'SET NULL';
	}
	if (c.acceptWords(['SET', 'DEFAULT'])) {
		if (c.isPunct('(')) c.skipGroup();
		return 'SET DEFAULT';
	}
	return c.fail(['CASCADE', 'RESTRICT', 'SET NULL', 'SET DEFAULT', 'NO ACTION']);
}

function parseReferences(c: Cursor, state: State, columns: Ref[], name: string | undefined, statement: number, from: number): PFk {
	c.expectWord('REFERENCES');
	const table = qualifiedName(c, state);
	const refColumns = c.isPunct('(') ? columnList(c) : null;
	let onDelete: Action = 'NO ACTION';
	let onUpdate: Action = 'NO ACTION';
	for (;;) {
		if (c.acceptWord('MATCH')) {
			c.expectWord('FULL', 'PARTIAL', 'SIMPLE');
			continue;
		}
		if (c.isWord('ON') && c.isWordAt(1, 'DELETE')) {
			c.i += 2;
			onDelete = parseAction(c);
			continue;
		}
		if (c.isWord('ON') && c.isWordAt(1, 'UPDATE')) {
			c.i += 2;
			onUpdate = parseAction(c);
			continue;
		}
		if (c.acceptWords(['NOT', 'FOR', 'REPLICATION'])) continue;
		if (c.acceptWords(['NOT', 'DEFERRABLE']) || c.acceptWord('DEFERRABLE')) continue;
		if (c.acceptWords(['INITIALLY', 'DEFERRED']) || c.acceptWords(['INITIALLY', 'IMMEDIATE'])) continue;
		if (c.acceptWords(['NOT', 'VALID'])) continue;
		break;
	}
	const last = c.tokens[c.i - 1];
	return { name, columns, table, refColumns, onDelete, onUpdate, statement, from, to: last ? last.end : from };
}

function parseTypeArgs(c: Cursor): TypeArg[] {
	const args: TypeArg[] = [];
	if (!c.acceptPunct('(')) return args;
	if (c.acceptPunct(')')) return args;
	do {
		const t = c.next();
		if (t.type === 'number') args.push(Number(t.value));
		else if (t.type === 'word' && t.upper === 'MAX') args.push('MAX');
		else if (t.type === 'string') args.push(t.value);
		else if (t.type === 'punct' && (t.value === '-' || t.value === '+') && c.peek()?.type === 'number') args.push(Number(t.value + c.next().value));
		else if (t.type === 'word' && (t.upper === 'CHAR' || t.upper === 'BYTE')) continue;
		else {
			c.i--;
			c.fail(['number']);
		}
		while (c.isWord('CHAR', 'BYTE')) c.next();
	} while (c.acceptPunct(','));
	c.expectPunct(')');
	return args;
}

const INTERVAL_FIELDS = new Set(['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'TO']);

function parseDataType(c: Cursor, state: State) {
	const start = c.i;
	const first = c.peek();
	if (!first || (first.type !== 'word' && first.type !== 'quoted')) c.fail(['type']);
	c.next();
	const bracketWord = first.type === 'quoted' && c.dialect === 'sqlserver' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(first.value);
	let quoted = first.type === 'quoted' && !bracketWord;
	let base = first.type === 'word' || bracketWord ? first.value.toUpperCase() : first.value;
	while (c.isPunct('.')) {
		c.next();
		const part = c.next();
		quoted = quoted || part.type === 'quoted';
		base = part.type === 'word' ? part.upper : part.value;
		if (part.type === 'word' && part.upper !== 'INT4' && first.type === 'word' && first.upper === 'PG_CATALOG') quoted = false;
	}
	if (!quoted) {
		if (base === 'DOUBLE' && c.acceptWord('PRECISION')) base = 'DOUBLE PRECISION';
		if (base === 'NATIONAL') {
			const next = c.expectWord('CHARACTER', 'CHAR', 'VARCHAR');
			base = `NATIONAL ${next.upper}`;
		}
		if ((base === 'CHARACTER' || base === 'CHAR' || base === 'NATIONAL CHARACTER' || base === 'NATIONAL CHAR' || base === 'NCHAR' || base === 'BIT') && c.acceptWord('VARYING')) {
			base = `${base} VARYING`;
		}
		if (base === 'LONG' && c.isWord('VARCHAR', 'VARBINARY')) base = `LONG ${c.next().upper}`;
	}
	let args = parseTypeArgs(c);
	let tz = false;
	if (!quoted && (base === 'TIMESTAMP' || base === 'TIME')) {
		if (c.acceptWords(['WITH', 'TIME', 'ZONE'])) tz = true;
		else c.acceptWords(['WITHOUT', 'TIME', 'ZONE']);
		if (args.length === 0) args = parseTypeArgs(c);
	}
	if (!quoted && base === 'INTERVAL') {
		while (c.isWord(...INTERVAL_FIELDS)) c.next();
		parseTypeArgs(c);
	}
	let unsigned = false;
	while (c.dialect === 'mysql' && c.isWord('UNSIGNED', 'SIGNED', 'ZEROFILL')) {
		if (c.next().upper === 'UNSIGNED') unsigned = true;
	}
	let array = false;
	while (c.dialect === 'postgres' && c.isPunct('[')) {
		c.skipGroup();
		array = true;
	}
	if (c.dialect === 'postgres' && c.isWord('ARRAY')) {
		c.next();
		if (c.isPunct('[')) c.skipGroup();
		array = true;
	}
	const text = c.text(start);
	const parsed = mapType(c.dialect, base, args, { tz, array, unsigned, text, quoted });
	if (parsed.unsigned && c.dialect === 'mysql') state.once('unsigned', issue('info', 'unsigned-ignored', first.start, c.tokens[c.i - 1]?.end ?? first.end));
	return parsed;
}

function parseExpression(c: Cursor): { start: number; end: number } {
	const start = c.i;
	parseUnary(c);
	for (;;) {
		const t = c.peek();
		if (t?.type === 'punct' && BINARY_OPS.has(t.value)) {
			c.next();
			while (c.peek()?.type === 'punct' && BINARY_OPS.has(c.peek()?.value ?? '')) c.next();
			parseUnary(c);
			continue;
		}
		if (c.isWord('AT') && c.isWordAt(1, 'TIME')) {
			c.i += 3;
			parseUnary(c);
			continue;
		}
		if (c.isWord('AND', 'OR', 'LIKE', 'IS', 'IN', 'BETWEEN')) {
			c.next();
			parseUnary(c);
			continue;
		}
		break;
	}
	return { start, end: c.i };
}

function parseUnary(c: Cursor): void {
	while (c.isPunct('-') || c.isPunct('+') || c.isPunct('~') || c.isWord('NOT')) c.next();
	parsePrimary(c);
	for (;;) {
		if (c.acceptPunct('::')) {
			const t = c.next();
			while (c.isPunct('.')) {
				c.next();
				c.next();
			}
			if (t.type === 'word' && (t.upper === 'CHARACTER' || t.upper === 'DOUBLE' || t.upper === 'TIMESTAMP' || t.upper === 'TIME')) {
				while (c.isWord('VARYING', 'PRECISION', 'WITH', 'WITHOUT', 'TIME', 'ZONE')) c.next();
			}
			if (c.isPunct('(')) c.skipGroup();
			while (c.isPunct('[')) c.skipGroup();
			continue;
		}
		if (c.isPunct('[')) {
			c.skipGroup();
			continue;
		}
		break;
	}
}

function parsePrimary(c: Cursor): void {
	const t = c.peek();
	if (!t) c.fail(['expression']);
	if (t.type === 'string' || t.type === 'number' || t.type === 'quoted') {
		c.next();
		if (t.type === 'quoted' && c.isPunct('(')) c.skipGroup();
		return;
	}
	if (t.type === 'punct' && t.value === '(') {
		c.skipGroup();
		return;
	}
	if (t.type === 'word') {
		if (t.upper === 'CASE') {
			let depth = 0;
			while (!c.atEnd()) {
				const w = c.next();
				if (w.type === 'word' && w.upper === 'CASE') depth++;
				if (w.type === 'word' && w.upper === 'END') {
					depth--;
					if (depth === 0) return;
				}
			}
			c.fail(['END']);
		}
		if (t.upper === 'NEXT' && c.isWordAt(1, 'VALUE')) {
			c.i += 2;
			c.expectWord('FOR');
			c.next();
			while (c.acceptPunct('.')) c.next();
			return;
		}
		if (t.upper === 'ARRAY' && c.peek(1)?.type === 'punct' && c.peek(1)?.value === '[') {
			c.next();
			c.skipGroup();
			return;
		}
		if (t.upper === 'INTERVAL' && c.peek(1)?.type === 'string') {
			c.i += 2;
			while (c.isWord(...INTERVAL_FIELDS)) c.next();
			return;
		}
		const structural = ['NOT', 'NULL', 'PRIMARY', 'UNIQUE', 'REFERENCES', 'CHECK', 'CONSTRAINT', 'DEFAULT', 'COLLATE', 'COMMENT', 'ON'];
		if (structural.includes(t.upper) && t.upper !== 'NULL') c.fail(['expression']);
		c.next();
		while (c.isPunct('.')) {
			c.next();
			c.next();
		}
		if (c.isPunct('(')) c.skipGroup();
		return;
	}
	c.fail(['expression']);
}

function unwrap(tokens: Token[]): Token[] {
	let list = tokens;
	for (;;) {
		if (list.length < 2) return list;
		const first = list[0];
		const last = list[list.length - 1];
		if (first?.type !== 'punct' || first.value !== '(' || last?.type !== 'punct' || last.value !== ')') return list;
		let depth = 0;
		let wraps = true;
		for (let k = 0; k < list.length; k++) {
			const t = list[k];
			if (t?.type === 'punct' && t.value === '(') depth++;
			if (t?.type === 'punct' && t.value === ')') depth--;
			if (depth === 0 && k < list.length - 1) {
				wraps = false;
				break;
			}
		}
		if (!wraps) return list;
		list = list.slice(1, -1);
	}
}

function stripCast(tokens: Token[]): Token[] {
	let depth = 0;
	for (let k = 0; k < tokens.length; k++) {
		const t = tokens[k];
		if (t?.type === 'punct' && t.value === '(') depth++;
		if (t?.type === 'punct' && t.value === ')') depth--;
		if (depth === 0 && t?.type === 'punct' && t.value === '::') return tokens.slice(0, k);
	}
	return tokens;
}

function isCall(tokens: Token[], names: Set<string>, maxArgs: number): boolean {
	const name = tokens[0];
	if (name?.type !== 'word' || !names.has(name.upper)) return false;
	if (tokens.length === 1) return true;
	if (tokens[1]?.type !== 'punct' || tokens[1].value !== '(' || tokens[tokens.length - 1]?.value !== ')') return false;
	const inner = tokens.slice(2, -1);
	if (inner.length === 0) return true;
	return maxArgs > 0 && inner.length === 1 && inner[0]?.type === 'number';
}

function classifyDefault(dialect: SqlDialectId, tokens: Token[], text: string, type: LogicalType): DefaultValue {
	let list = stripCast(unwrap(tokens));
	list = unwrap(list);
	const first = list[0];
	if (list.length === 1 && first) {
		if (first.type === 'string') {
			const value = first.value;
			if (type.kind === 'boolean' && /^(0|1|true|false|t|f)$/i.test(value)) return { kind: 'literal', value: /^(1|true|t)$/i.test(value) };
			if (NUMERIC_KINDS.has(type.kind) && /^-?\d+(\.\d+)?$/.test(value)) return { kind: 'literal', value: Number(value) };
			return { kind: 'literal', value };
		}
		if (first.type === 'number' && !first.value.startsWith('0x')) {
			const value = Number(first.value);
			if (type.kind === 'boolean' && (value === 0 || value === 1)) return { kind: 'literal', value: value === 1 };
			return { kind: 'literal', value };
		}
		if (first.type === 'word') {
			if (first.upper === 'NULL') return { kind: 'literal', value: null };
			if (first.upper === 'TRUE' || first.upper === 'FALSE') return { kind: 'literal', value: first.upper === 'TRUE' };
			if (NOW_WORDS.has(first.upper)) return { kind: 'now' };
		}
	}
	if (list.length === 2 && first?.type === 'punct' && (first.value === '-' || first.value === '+') && list[1]?.type === 'number') {
		return { kind: 'literal', value: Number(first.value + (list[1]?.value ?? '0')) };
	}
	if (isCall(list, NOW_FUNCS, 1)) return { kind: 'now' };
	if (isCall(list, UUID_FUNCS, 0)) return { kind: 'uuid' };
	if (first?.type === 'word' && first.upper === 'NEXTVAL') return { kind: 'autoincrement' };
	if (first?.type === 'word' && first.upper === 'CAST' && list.length > 3) {
		const inner = list.slice(2, -1);
		const as = inner.findIndex((t) => t.type === 'word' && t.upper === 'AS');
		if (as > 0 && isCall(inner.slice(0, as), NOW_FUNCS, 1)) return { kind: 'now' };
	}
	return { kind: 'expression', dialect, sql: text };
}

function jsonCheckColumn(text: string): string | null {
	const norm = text.replace(/[\s[\]"`]/g, '').toLowerCase();
	const match = /^\(*isjson\(([^()]+)\)(=\(*1\)*|>\(*0\)*)?\)*$/.exec(norm);
	return match?.[1] ?? null;
}

function addCheck(state: State, table: PTable, text: string, name?: string): void {
	const column = state.dialect === 'sqlserver' ? jsonCheckColumn(text) : null;
	if (column) {
		const target = state.column(table, column);
		if (target && (target.type.kind === 'text' || target.type.kind === 'varchar')) {
			target.type = { kind: 'json' };
			return;
		}
	}
	table.checks.push({ name, text });
}

function parseColumnDef(c: Cursor, state: State, table: PTable, statement: number): PColumn {
	const name = identifier(c);
	if (state.column(table, name.name)) throw new Failure('column-duplicate', name.from, name.to, { column: name.name, table: table.name });
	if (table.columns.length >= LIMITS.columns) throw new Failure('limit-columns', name.from, name.to, { max: LIMITS.columns });
	const column: PColumn = { name: name.name, from: name.from, to: name.to, type: { kind: 'text' }, nullable: true, def: { kind: 'none' } };
	if (c.dialect === 'sqlserver' && c.isWord('AS')) {
		const start = c.i;
		c.next();
		parseExpression(c);
		c.acceptWord('PERSISTED');
		column.type = { kind: 'raw', dialect: 'sqlserver', sql: '' };
		column.def = { kind: 'computed', dialect: 'sqlserver', sql: c.text(start) };
		if (c.acceptWords(['NOT', 'NULL'])) column.nullable = false;
		table.columns.push(column);
		return column;
	}
	const parsed = parseDataType(c, state);
	column.type = parsed.type;
	if (parsed.autoincrement) column.def = { kind: 'autoincrement' };
	if (parsed.serialNotNullUnique) {
		column.nullable = false;
		table.uniques.push({ columns: [name], from: name.from, to: name.to });
	}
	table.columns.push(column);
	let pendingName: string | undefined;
	while (!c.atEnd() && !c.isPunct(',') && !c.isPunct(')')) {
		const start = c.i;
		const at = c.peek();
		if (c.acceptWord('CONSTRAINT')) {
			pendingName = identifier(c, true).name;
			continue;
		}
		if (c.acceptWords(['NOT', 'NULL'])) {
			column.nullable = false;
		} else if (c.acceptWord('NULL')) {
			column.nullable = true;
		} else if (c.isWord('PRIMARY') || (c.dialect === 'mysql' && c.isWord('KEY'))) {
			if (c.acceptWord('PRIMARY')) c.expectWord('KEY');
			else c.next();
			c.acceptWord('ASC', 'DESC');
			c.acceptWord('CLUSTERED', 'NONCLUSTERED');
			if (table.pk) throw new Failure('primary-key-duplicate', at?.start ?? name.from, c.tokens[c.i - 1]?.end ?? name.to, { table: table.name });
			table.pk = { name: pendingName, columns: [name], from: at?.start ?? name.from, to: c.tokens[c.i - 1]?.end ?? name.to };
			column.nullable = false;
		} else if (c.acceptWord('UNIQUE')) {
			c.acceptWord('KEY');
			c.acceptWord('CLUSTERED', 'NONCLUSTERED');
			table.uniques.push({ name: pendingName, columns: [name], from: at?.start ?? name.from, to: c.tokens[c.i - 1]?.end ?? name.to });
		} else if (c.acceptWord('DEFAULT')) {
			const range = parseExpression(c);
			const tokens = c.tokens.slice(range.start, range.end);
			column.def = classifyDefault(c.dialect, tokens, c.text(range.start, range.end), column.type);
			if (c.dialect === 'sqlserver' && c.acceptWords(['WITH', 'VALUES'])) continue;
		} else if (c.isWord('REFERENCES')) {
			table.fks.push(parseReferences(c, state, [name], pendingName, statement, at?.start ?? name.from));
		} else if (c.acceptWord('CHECK')) {
			const open = c.i;
			if (!c.isPunct('(')) c.fail(['(']);
			c.skipGroup();
			addCheck(state, table, c.text(open), pendingName);
			c.acceptWords(['NOT', 'FOR', 'REPLICATION']);
			c.acceptWords(['NO', 'INHERIT']);
		} else if (c.acceptWord('AUTO_INCREMENT', 'AUTOINCREMENT')) {
			column.def = { kind: 'autoincrement' };
		} else if (c.acceptWord('IDENTITY')) {
			if (c.isPunct('(')) c.skipGroup();
			c.acceptWords(['NOT', 'FOR', 'REPLICATION']);
			column.def = { kind: 'autoincrement' };
		} else if (c.isWord('GENERATED')) {
			c.next();
			if (c.acceptWords(['BY', 'DEFAULT'])) {
				c.expectWord('AS');
				c.expectWord('IDENTITY');
				if (c.isPunct('(')) c.skipGroup();
				column.def = { kind: 'autoincrement' };
			} else {
				c.expectWord('ALWAYS');
				c.expectWord('AS');
				if (c.acceptWord('IDENTITY')) {
					if (c.isPunct('(')) c.skipGroup();
					column.def = { kind: 'autoincrement' };
					state.once('identity-always', issue('info', 'identity-always', at?.start ?? 0, c.tokens[c.i - 1]?.end ?? 0));
				} else {
					if (!c.isPunct('(')) c.fail(['IDENTITY', '(']);
					c.skipGroup();
					c.acceptWord('STORED', 'VIRTUAL');
					column.def = { kind: 'computed', dialect: c.dialect, sql: c.text(start) };
				}
			}
		} else if (c.dialect === 'mysql' && c.isWord('AS') && c.peek(1)?.value === '(') {
			c.next();
			c.skipGroup();
			c.acceptWord('STORED', 'VIRTUAL');
			column.def = { kind: 'computed', dialect: 'mysql', sql: c.text(start) };
		} else if (c.dialect === 'mysql' && c.acceptWord('COMMENT')) {
			const t = c.next();
			if (t.type !== 'string') {
				c.i--;
				c.fail(['text']);
			}
			column.comment = t.value;
		} else if (c.acceptWord('COLLATE')) {
			c.next();
		} else if (c.acceptWords(['CHARACTER', 'SET']) || c.acceptWord('CHARSET')) {
			c.next();
		} else if (c.dialect === 'mysql' && c.isWord('ON') && c.isWordAt(1, 'UPDATE')) {
			c.i += 2;
			parseExpression(c);
			state.once('on-update', issue('info', 'on-update-ignored', at?.start ?? 0, c.tokens[c.i - 1]?.end ?? 0));
		} else if (c.acceptWord('ROWGUIDCOL', 'SPARSE', 'FILESTREAM', 'PERSISTED', 'VISIBLE', 'INVISIBLE', 'DEFERRABLE')) {
			continue;
		} else if (c.acceptWords(['NOT', 'DEFERRABLE']) || c.acceptWords(['NOT', 'FOR', 'REPLICATION'])) {
			continue;
		} else if (c.acceptWord('INITIALLY')) {
			c.expectWord('DEFERRED', 'IMMEDIATE');
		} else if (c.acceptWord('COLUMN_FORMAT', 'STORAGE', 'SRID', 'ENGINE_ATTRIBUTE')) {
			c.next();
		} else if (c.acceptWord('MASKED')) {
			c.expectWord('WITH');
			c.skipGroup();
		} else {
			c.fail(['NOT NULL', 'NULL', 'DEFAULT', 'PRIMARY KEY', 'UNIQUE', 'REFERENCES', 'CHECK', ',', ')']);
		}
		pendingName = undefined;
	}
	if (column.def.kind === 'autoincrement' && column.type.kind !== 'smallint' && column.type.kind !== 'int' && column.type.kind !== 'bigint') {
		column.def = { kind: 'none' };
	}
	return column;
}

function tableOptions(c: Cursor, state: State, table: PTable): void {
	while (!c.atEnd()) {
		if (c.dialect === 'mysql' && c.acceptWord('COMMENT')) {
			c.acceptPunct('=');
			const t = c.next();
			if (t.type === 'string') table.comment = t.value;
			continue;
		}
		const t = c.peek();
		if (t?.type === 'word' && (t.upper === 'INHERITS' || t.upper === 'PARTITION')) {
			state.once('table-options', issue('info', 'table-options-ignored', t.start, t.end, { option: t.value }));
		}
		c.skipGroup();
	}
}

function tableConstraint(c: Cursor, state: State, table: PTable, statement: number, alter: boolean): boolean {
	const start = c.i;
	const at = c.peek();
	let name: string | undefined;
	if (c.acceptWord('CONSTRAINT')) name = identifier(c, true).name;
	if (c.acceptWord('PRIMARY')) {
		c.expectWord('KEY');
		c.acceptWord('CLUSTERED', 'NONCLUSTERED');
		if (c.acceptWord('USING')) c.next();
		const { refs } = keyColumns(c, state);
		const end = c.tokens[c.i - 1]?.end ?? 0;
		skipIndexOptions(c);
		if (table.pk) throw new Failure('primary-key-duplicate', at?.start ?? 0, end, { table: table.name });
		table.pk = { name, columns: refs, from: at?.start ?? 0, to: end };
		return true;
	}
	if (c.acceptWord('UNIQUE')) {
		c.acceptWord('KEY', 'INDEX');
		c.acceptWord('CLUSTERED', 'NONCLUSTERED');
		let indexName: string | undefined;
		if (!c.isPunct('(') && !c.isWord('USING')) indexName = identifier(c, true).name;
		if (c.acceptWord('USING')) c.next();
		const { refs, plain } = keyColumns(c, state);
		skipIndexOptions(c);
		if (!plain) {
			preserveElement(state, table, c, start);
			return true;
		}
		table.uniques.push({ name: name ?? indexName, columns: refs, from: at?.start ?? 0, to: c.tokens[c.i - 1]?.end ?? 0 });
		return true;
	}
	if (c.acceptWord('FOREIGN')) {
		c.expectWord('KEY');
		let fkName = name;
		if (!c.isPunct('(')) fkName = identifier(c, true).name ?? fkName;
		const cols = columnList(c);
		table.fks.push(parseReferences(c, state, cols, fkName, statement, at?.start ?? 0));
		return true;
	}
	if (c.acceptWord('CHECK')) {
		const open = c.i;
		if (!c.isPunct('(')) c.fail(['(']);
		c.skipGroup();
		addCheck(state, table, c.text(open), name);
		c.acceptWords(['NOT', 'VALID']);
		c.acceptWords(['NO', 'INHERIT']);
		c.acceptWords(['NOT', 'FOR', 'REPLICATION']);
		return true;
	}
	if (c.isWord('EXCLUDE')) {
		c.skipToElementEnd();
		preserveElement(state, table, c, start);
		return true;
	}
	if (c.dialect === 'sqlserver' && name !== undefined && c.acceptWord('DEFAULT')) {
		const range = parseExpression(c);
		c.expectWord('FOR');
		const ref = identifier(c, true);
		const column = state.column(table, ref.name);
		if (!column) throw new Failure('column-unknown', ref.from, ref.to, { column: ref.name, table: table.name });
		column.def = classifyDefault(c.dialect, c.tokens.slice(range.start, range.end), c.text(range.start, range.end), column.type);
		return true;
	}
	if (name !== undefined) c.fail(['PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY', 'CHECK']);
	if (c.dialect === 'mysql' && c.isWord('FULLTEXT', 'SPATIAL')) {
		c.skipToElementEnd();
		preserveElement(state, table, c, start);
		return true;
	}
	if ((c.dialect === 'mysql' && c.isWord('KEY', 'INDEX')) || (c.dialect === 'sqlserver' && !alter && c.isWord('INDEX'))) {
		c.next();
		let indexName: string | undefined;
		if (!c.isPunct('(') && !c.isWord('USING')) indexName = identifier(c, true).name;
		const unique = c.dialect === 'sqlserver' && Boolean(c.acceptWord('UNIQUE'));
		c.acceptWord('CLUSTERED', 'NONCLUSTERED');
		if (c.acceptWord('USING')) c.next();
		const { refs, plain } = keyColumns(c, state);
		skipIndexOptions(c);
		if (!plain) {
			preserveElement(state, table, c, start);
			return true;
		}
		table.indexes.push({ name: indexName, columns: refs, unique, from: at?.start ?? 0, to: c.tokens[c.i - 1]?.end ?? 0 });
		return true;
	}
	return false;
}

function skipIndexOptions(c: Cursor): void {
	for (;;) {
		if (c.acceptWord('WITH') || c.acceptWord('INCLUDE')) {
			if (c.isPunct('(')) c.skipGroup();
			continue;
		}
		if (c.acceptWord('USING')) {
			if (c.acceptWord('INDEX')) {
				c.acceptWord('TABLESPACE');
			}
			c.next();
			continue;
		}
		if (c.acceptWord('ON')) {
			c.next();
			if (c.isPunct('(')) c.skipGroup();
			continue;
		}
		if (c.acceptWord('COMMENT')) {
			c.next();
			continue;
		}
		if (c.acceptWord('DEFERRABLE') || c.acceptWords(['NOT', 'DEFERRABLE'])) continue;
		if (c.acceptWord('INITIALLY')) {
			c.next();
			continue;
		}
		if (c.acceptWord('KEY_BLOCK_SIZE')) {
			c.acceptPunct('=');
			c.next();
			continue;
		}
		break;
	}
}

function preserveElement(state: State, table: PTable, c: Cursor, start: number): void {
	const text = c.text(start);
	state.extras.push({ id: createId(), dialect: state.dialect, sql: `ALTER TABLE ${quote(state.dialect, table.name)} ADD ${text}`, placement: 'after' });
	const first = c.tokens[start];
	if (first) state.issues.push(issue('info', 'element-preserved', first.start, c.tokens[c.i - 1]?.end ?? first.end));
}

function parseCreateTable(c: Cursor, state: State, stmt: Statement, statement: number, temporary: boolean): void {
	c.expectWord('TABLE');
	const ifNotExists = c.acceptWords(['IF', 'NOT', 'EXISTS']);
	const name = qualifiedName(c, state);
	if (temporary) {
		state.issues.push(issue('info', 'temporary-table-ignored', name.from, name.to, { table: name.name }));
		return;
	}
	if (c.isWord('AS', 'LIKE', 'PARTITION', 'OF', 'CLONE')) {
		state.extra(stmt, 'after');
		return;
	}
	const existing = state.table(name.name);
	if (existing) {
		if (ifNotExists) return;
		throw new Failure('table-duplicate', name.from, name.to, { table: name.name });
	}
	if (state.order.length >= LIMITS.tables) throw new Failure('limit-tables', name.from, name.to, { max: LIMITS.tables });
	const table: PTable = {
		name: name.name,
		from: name.from,
		to: name.to,
		statement,
		columns: [],
		pk: null,
		uniques: [],
		indexes: [],
		fks: [],
		checks: []
	};
	c.expectPunct('(');
	if (c.isPunct(')')) {
		if (c.dialect !== 'postgres') c.fail(['name']);
	} else {
		do {
			if (c.isPunct(')')) c.fail(['name']);
			if (c.dialect === 'postgres' && c.isWord('LIKE')) {
				const t = c.peek();
				c.skipToElementEnd();
				if (t) state.issues.push(issue('warning', 'like-ignored', t.start, c.tokens[c.i - 1]?.end ?? t.end));
				continue;
			}
			if (!tableConstraint(c, state, table, statement, false)) parseColumnDef(c, state, table, statement);
		} while (c.acceptPunct(','));
	}
	c.expectPunct(')');
	tableOptions(c, state, table);
	state.tables.set(state.key(table.name), table);
	state.order.push(table);
	for (const check of table.checks) {
		const prefix = check.name ? `CONSTRAINT ${quote(state.dialect, check.name)} ` : '';
		state.extras.push({ id: createId(), dialect: state.dialect, sql: `ALTER TABLE ${quote(state.dialect, table.name)} ADD ${prefix}CHECK ${check.text}`, placement: 'after' });
	}
	if (table.checks.length > 0) state.once(`checks:${table.name}`, issue('info', 'check-preserved', name.from, name.to, { table: table.name }));
	table.checks = [];
}

function parseCreateIndex(c: Cursor, state: State, stmt: Statement): void {
	const unique = Boolean(c.acceptWord('UNIQUE'));
	c.acceptWord('CLUSTERED', 'NONCLUSTERED');
	const special = c.acceptWord('FULLTEXT', 'SPATIAL', 'BITMAP', 'COLUMNSTORE');
	c.expectWord('INDEX');
	c.acceptWord('CONCURRENTLY');
	c.acceptWords(['IF', 'NOT', 'EXISTS']);
	let name: string | undefined;
	if (!c.isWord('ON')) name = identifier(c, true).name;
	if (c.acceptWord('USING')) c.next();
	c.expectWord('ON');
	c.acceptWord('ONLY');
	const tableRef = qualifiedName(c, state);
	let method: string | undefined;
	if (c.acceptWord('USING')) method = c.next().upper;
	const { refs, plain } = keyColumns(c, state);
	let simple = plain && !special && (method === undefined || method === 'BTREE');
	while (!c.atEnd()) {
		if (c.isWord('WHERE', 'INCLUDE') || (c.isWord('NULLS') && c.isWordAt(1, 'NOT'))) simple = false;
		c.skipGroup();
	}
	const table = state.table(tableRef.name);
	if (!table) throw new Failure('table-unknown', tableRef.from, tableRef.to, { table: tableRef.name });
	if (!simple) {
		state.extra(stmt, 'after');
		return;
	}
	table.indexes.push({ name, columns: refs, unique, from: stmt.start, to: stmt.end });
}

function parseAlterTable(c: Cursor, state: State, statement: number): void {
	c.expectWord('TABLE');
	c.acceptWords(['IF', 'EXISTS']);
	c.acceptWord('ONLY');
	const ref = qualifiedName(c, state);
	c.acceptPunct('*');
	const table = state.table(ref.name);
	if (!table) throw new Failure('table-unknown', ref.from, ref.to, { table: ref.name });
	let lastWasAddColumn = false;
	do {
		const actionStart = c.i;
		if (c.dialect === 'sqlserver' && c.acceptWord('WITH')) c.expectWord('CHECK', 'NOCHECK');
		if (c.acceptWord('ADD')) {
			lastWasAddColumn = false;
			if (c.dialect === 'postgres' && c.isWord('GENERATED')) c.fail(['COLUMN', 'CONSTRAINT']);
			if (!tableConstraint(c, state, table, statement, true)) {
				c.acceptWord('COLUMN');
				c.acceptWords(['IF', 'NOT', 'EXISTS']);
				if (c.isPunct('(') && c.dialect === 'mysql') {
					c.next();
					do parseColumnDef(c, state, table, statement);
					while (c.acceptPunct(','));
					c.expectPunct(')');
				} else {
					parseColumnDef(c, state, table, statement);
					lastWasAddColumn = true;
				}
			}
			continue;
		}
		if (c.dialect === 'sqlserver' && lastWasAddColumn && (c.peek()?.type === 'word' || c.peek()?.type === 'quoted') && !c.isWord('ADD', 'ALTER', 'DROP')) {
			parseColumnDef(c, state, table, statement);
			continue;
		}
		lastWasAddColumn = false;
		if (c.acceptWord('ALTER')) {
			c.acceptWord('COLUMN');
			const colRef = identifier(c, true);
			const column = state.column(table, colRef.name);
			if (!column) throw new Failure('column-unknown', colRef.from, colRef.to, { column: colRef.name, table: table.name });
			alterColumn(c, state, column);
			continue;
		}
		if (c.dialect === 'mysql' && c.isWord('MODIFY', 'CHANGE')) {
			const change = c.next().upper === 'CHANGE';
			c.acceptWord('COLUMN');
			let target: PColumn | undefined;
			if (change) {
				const old = identifier(c, true);
				target = state.column(table, old.name);
				if (!target) throw new Failure('column-unknown', old.from, old.to, { column: old.name, table: table.name });
			} else {
				const peek = c.peek();
				target = peek ? state.column(table, peek.type === 'quoted' ? peek.value : peek.value) : undefined;
				if (!target && peek) throw new Failure('column-unknown', peek.start, peek.end, { column: peek.value, table: table.name });
			}
			const at = target ? table.columns.indexOf(target) : -1;
			if (target) table.columns.splice(at, 1);
			const replaced = parseColumnDef(c, state, table, statement);
			table.columns.pop();
			table.columns.splice(at, 0, replaced);
			if (target && target.name !== replaced.name) renameRefs(state, table, target.name, replaced.name);
			c.acceptWord('FIRST');
			if (c.acceptWord('AFTER')) identifier(c, true);
			continue;
		}
		if (c.acceptWord('DROP')) {
			dropAction(c, state, table);
			continue;
		}
		if (c.acceptWord('RENAME')) {
			if (c.acceptWord('TO', 'AS')) {
				const next = identifier(c, true);
				state.tables.delete(state.key(table.name));
				table.name = next.name;
				state.tables.set(state.key(table.name), table);
				continue;
			}
			if (c.acceptWord('INDEX', 'KEY', 'CONSTRAINT')) {
				identifier(c, true);
				c.expectWord('TO');
				identifier(c, true);
				continue;
			}
			c.acceptWord('COLUMN');
			const oldRef = identifier(c, true);
			c.expectWord('TO');
			const newRef = identifier(c, true);
			const column = state.column(table, oldRef.name);
			if (!column) throw new Failure('column-unknown', oldRef.from, oldRef.to, { column: oldRef.name, table: table.name });
			renameRefs(state, table, column.name, newRef.name);
			column.name = newRef.name;
			continue;
		}
		if (c.isWord(...ALTER_NOISE)) {
			while (!c.atEnd() && !c.isPunct(',')) c.skipGroup();
			continue;
		}
		if (c.i === actionStart) c.fail(['ADD', 'ALTER', 'DROP', 'RENAME']);
	} while (c.acceptPunct(','));
	if (!c.atEnd()) c.fail([',']);
}

function renameRefs(state: State, table: PTable, from: string, to: string): void {
	const key = state.key(from);
	const swap = (refs: Ref[]) => refs.forEach((r) => {
		if (state.key(r.name) === key) r.name = to;
	});
	if (table.pk) swap(table.pk.columns);
	table.uniques.forEach((u) => swap(u.columns));
	table.indexes.forEach((i) => swap(i.columns));
	table.fks.forEach((f) => swap(f.columns));
	for (const other of state.order) for (const fk of other.fks) if (state.key(fk.table.name) === state.key(table.name) && fk.refColumns) swap(fk.refColumns);
}

function alterColumn(c: Cursor, state: State, column: PColumn): void {
	if (c.acceptWords(['SET', 'DEFAULT'])) {
		const range = parseExpression(c);
		column.def = classifyDefault(c.dialect, c.tokens.slice(range.start, range.end), c.text(range.start, range.end), column.type);
		return;
	}
	if (c.acceptWords(['DROP', 'DEFAULT'])) {
		column.def = { kind: 'none' };
		return;
	}
	if (c.acceptWords(['SET', 'NOT', 'NULL'])) {
		column.nullable = false;
		return;
	}
	if (c.acceptWords(['DROP', 'NOT', 'NULL'])) {
		column.nullable = true;
		return;
	}
	if (c.isWord('ADD') && c.isWordAt(1, 'GENERATED')) {
		c.i += 2;
		if (!c.acceptWords(['BY', 'DEFAULT'])) c.expectWord('ALWAYS');
		c.expectWord('AS');
		c.expectWord('IDENTITY');
		if (c.isPunct('(')) c.skipGroup();
		column.def = { kind: 'autoincrement' };
		return;
	}
	if (c.dialect === 'postgres' && (c.acceptWords(['SET', 'DATA', 'TYPE']) || c.acceptWord('TYPE'))) {
		const parsed = parseDataType(c, state);
		column.type = parsed.type;
		if (c.acceptWord('USING')) parseExpression(c);
		return;
	}
	if (c.dialect === 'sqlserver' && (c.peek()?.type === 'word' || c.peek()?.type === 'quoted') && !c.isWord('ADD', 'DROP')) {
		const parsed = parseDataType(c, state);
		column.type = parsed.type;
		if (c.acceptWords(['NOT', 'NULL'])) column.nullable = false;
		else if (c.acceptWord('NULL')) column.nullable = true;
		if (c.acceptWord('COLLATE')) c.next();
		return;
	}
	while (!c.atEnd() && !c.isPunct(',')) c.skipGroup();
}

function dropAction(c: Cursor, state: State, table: PTable): void {
	if (c.acceptWord('CONSTRAINT')) {
		c.acceptWords(['IF', 'EXISTS']);
		const ref = identifier(c, true);
		const key = state.key(ref.name);
		if (table.pk && table.pk.name && state.key(table.pk.name) === key) table.pk = null;
		table.uniques = table.uniques.filter((u) => !u.name || state.key(u.name) !== key);
		table.fks = table.fks.filter((f) => !f.name || state.key(f.name) !== key);
		c.acceptWord('CASCADE', 'RESTRICT');
		return;
	}
	if (c.acceptWords(['PRIMARY', 'KEY'])) {
		table.pk = null;
		return;
	}
	if (c.acceptWords(['FOREIGN', 'KEY'])) {
		const ref = identifier(c, true);
		table.fks = table.fks.filter((f) => !f.name || state.key(f.name) !== state.key(ref.name));
		return;
	}
	if (c.acceptWord('INDEX', 'KEY')) {
		const ref = identifier(c, true);
		table.indexes = table.indexes.filter((i) => !i.name || state.key(i.name) !== state.key(ref.name));
		table.uniques = table.uniques.filter((u) => !u.name || state.key(u.name) !== state.key(ref.name));
		return;
	}
	if (c.isWord('DEFAULT', 'CHECK', 'PERIOD', 'SYSTEM')) {
		while (!c.atEnd() && !c.isPunct(',')) c.skipGroup();
		return;
	}
	c.acceptWord('COLUMN');
	c.acceptWords(['IF', 'EXISTS']);
	const ref = identifier(c, true);
	const key = state.key(ref.name);
	const strip = (refs: Ref[]) => refs.filter((r) => state.key(r.name) !== key);
	table.columns = table.columns.filter((col) => state.key(col.name) !== key);
	if (table.pk) {
		table.pk.columns = strip(table.pk.columns);
		if (table.pk.columns.length === 0) table.pk = null;
	}
	table.uniques = table.uniques.map((u) => ({ ...u, columns: strip(u.columns) })).filter((u) => u.columns.length > 0);
	table.indexes = table.indexes.map((i) => ({ ...i, columns: strip(i.columns) })).filter((i) => i.columns.length > 0);
	table.fks = table.fks.filter((f) => !f.columns.some((r) => state.key(r.name) === key));
	c.acceptWord('CASCADE', 'RESTRICT');
}

function parseComment(c: Cursor, state: State, stmt: Statement): void {
	c.expectWord('ON');
	if (c.acceptWord('TABLE')) {
		const ref = qualifiedName(c, state);
		c.expectWord('IS');
		const value = c.next();
		const table = state.table(ref.name);
		if (!table) throw new Failure('table-unknown', ref.from, ref.to, { table: ref.name });
		table.comment = value.type === 'string' ? value.value : undefined;
		return;
	}
	if (c.acceptWord('COLUMN')) {
		const parts: Ref[] = [identifier(c, true)];
		while (c.acceptPunct('.')) parts.push(identifier(c, true));
		c.expectWord('IS');
		const value = c.next();
		const columnRef = parts[parts.length - 1];
		const tableRef = parts[parts.length - 2];
		if (!columnRef || !tableRef) c.fail(['name']);
		const table = state.table(tableRef.name);
		if (!table) throw new Failure('table-unknown', tableRef.from, tableRef.to, { table: tableRef.name });
		const column = state.column(table, columnRef.name);
		if (!column) throw new Failure('column-unknown', columnRef.from, columnRef.to, { column: columnRef.name, table: table.name });
		column.comment = value.type === 'string' ? value.value : undefined;
		return;
	}
	state.extra(stmt, 'after');
}

function parseExec(c: Cursor, state: State, stmt: Statement): void {
	c.next();
	const proc = c.peek();
	const procName: string[] = [];
	while (c.peek()?.type === 'word' || c.peek()?.type === 'quoted') {
		procName.push((c.next().value ?? '').toLowerCase());
		if (!c.acceptPunct('.')) break;
	}
	if (procName[procName.length - 1] !== 'sp_addextendedproperty' || !proc) {
		state.extra(stmt, 'after');
		return;
	}
	const order = ['name', 'value', 'level0type', 'level0name', 'level1type', 'level1name', 'level2type', 'level2name'];
	const args: Record<string, string> = {};
	let position = 0;
	while (!c.atEnd()) {
		let key = order[position];
		const t = c.peek();
		if (t?.type === 'word' && t.value.startsWith('@')) {
			key = t.value.slice(1).toLowerCase();
			c.next();
			c.expectPunct('=');
		}
		const value = c.next();
		if (key) args[key] = value.type === 'string' ? value.value : value.value;
		position++;
		if (!c.acceptPunct(',')) break;
	}
	if (args.name !== 'MS_Description' || (args.level1type ?? '').toUpperCase() !== 'TABLE' || !args.level1name) {
		state.extra(stmt, 'after');
		return;
	}
	const table = state.table(args.level1name);
	if (!table) throw new Failure('table-unknown', stmt.start, stmt.end, { table: args.level1name });
	if ((args.level2type ?? '').toUpperCase() === 'COLUMN' && args.level2name) {
		const column = state.column(table, args.level2name);
		if (!column) throw new Failure('column-unknown', stmt.start, stmt.end, { column: args.level2name, table: table.name });
		column.comment = args.value;
	} else {
		table.comment = args.value;
	}
}

function parseStatement(c: Cursor, state: State, stmt: Statement, index: number): void {
	const first = c.peek();
	if (!first) return;
	if (first.type !== 'word') c.fail(['CREATE', 'ALTER', 'COMMENT']);
	if (first.upper === 'CREATE') {
		c.next();
		if (c.acceptWords(['OR', 'REPLACE']) || c.acceptWords(['OR', 'ALTER'])) {
			state.extra(stmt, c.isWord(...CREATE_BEFORE) ? 'before' : 'after');
			return;
		}
		let temporary = false;
		if (c.acceptWord('GLOBAL', 'LOCAL')) temporary = true;
		if (c.acceptWord('TEMPORARY', 'TEMP')) temporary = true;
		c.acceptWord('UNLOGGED');
		if (c.isWord('TABLE')) return parseCreateTable(c, state, stmt, index, temporary);
		if (c.isWord('UNIQUE', 'CLUSTERED', 'NONCLUSTERED', 'INDEX', 'BITMAP') || (c.isWord('FULLTEXT', 'SPATIAL', 'COLUMNSTORE') && c.isWordAt(1, 'INDEX'))) {
			return parseCreateIndex(c, state, stmt);
		}
		if (c.isWord(...CREATE_BEFORE)) return state.extra(stmt, 'before');
		if (c.isWord(...CREATE_IGNORED)) {
			if (c.isWord('SCHEMA')) state.once('create-schema', issue('info', 'schema-ignored', stmt.start, stmt.end, { schema: c.peek(1)?.value ?? '' }));
			return state.ignore(stmt);
		}
		if (c.isWord(...CREATE_AFTER)) return state.extra(stmt, 'after');
		c.fail(['TABLE', 'INDEX', 'VIEW', 'FUNCTION', 'TYPE', 'TRIGGER']);
	}
	if (first.upper === 'ALTER') {
		c.next();
		if (c.isWord('TABLE')) {
			const ownerOnly = c.tokens.some((t, k) => t.type === 'word' && t.upper === 'OWNER' && c.tokens[k + 1]?.upper === 'TO');
			if (ownerOnly) return state.ignore(stmt);
			return parseAlterTable(c, state, index);
		}
		return state.ignore(stmt);
	}
	if (first.upper === 'COMMENT' && c.dialect === 'postgres') {
		c.next();
		return parseComment(c, state, stmt);
	}
	if ((first.upper === 'EXEC' || first.upper === 'EXECUTE') && c.dialect === 'sqlserver') return parseExec(c, state, stmt);
	if (first.upper === 'DO' || first.upper === 'CALL' || first.upper === 'EXEC' || first.upper === 'EXECUTE') return state.extra(stmt, 'after');
	if (first.upper === 'IF') {
		state.issues.push(issue('warning', 'statement-conditional', first.start, first.end));
		return state.ignore(stmt);
	}
	if (NOISE_START.has(first.upper)) return state.ignore(stmt);
	c.fail(['CREATE', 'ALTER', 'COMMENT']);
}

function resolveRefs(state: State, table: PTable, refs: Ref[], ids: Map<string, string>): string[] {
	return refs.map((ref) => {
		const id = ids.get(state.key(ref.name));
		if (!id) throw new Failure('column-unknown', ref.from, ref.to, { column: ref.name, table: table.name });
		return id;
	});
}

function resolve(state: State): Schema {
	const schema = emptySchema();
	const built = new Map<PTable, { table: Table; ids: Map<string, string> }>();
	for (const pt of state.order) {
		const ids = new Map<string, string>();
		const columns: Column[] = pt.columns.map((pc) => {
			const id = createId();
			ids.set(state.key(pc.name), id);
			const column: Column = { id, name: pc.name, type: pc.type, nullable: pc.nullable, default: pc.def };
			if (pc.comment) column.comment = pc.comment;
			return column;
		});
		const table: Table = { id: createId(), name: pt.name, x: 0, y: 0, columns, primaryKey: [], uniques: [], indexes: [] };
		if (pt.comment) table.comment = pt.comment;
		try {
			if (pt.pk) {
				table.primaryKey = resolveRefs(state, pt, pt.pk.columns, ids);
				if (pt.pk.name) table.primaryKeyName = pt.pk.name;
				for (const column of columns) if (table.primaryKey.includes(column.id)) column.nullable = false;
			}
		} catch (error) {
			if (error instanceof Failure) state.issues.push(issue('error', error.code, error.from, error.to, error.params));
			else throw error;
		}
		for (const unique of pt.uniques) {
			try {
				const cols = resolveRefs(state, pt, unique.columns, ids);
				table.uniques.push(unique.name ? { id: createId(), name: unique.name, columns: cols } : { id: createId(), columns: cols });
			} catch (error) {
				if (error instanceof Failure) state.issues.push(issue('error', error.code, error.from, error.to, error.params));
				else throw error;
			}
		}
		for (const index of pt.indexes) {
			try {
				const cols = resolveRefs(state, pt, index.columns, ids);
				table.indexes.push(index.name ? { id: createId(), name: index.name, columns: cols, unique: index.unique } : { id: createId(), columns: cols, unique: index.unique });
			} catch (error) {
				if (error instanceof Failure) state.issues.push(issue('error', error.code, error.from, error.to, error.params));
				else throw error;
			}
		}
		built.set(pt, { table, ids });
		schema.tables.push(table);
	}
	for (const pt of state.order) {
		const source = built.get(pt);
		if (!source) continue;
		for (const fk of pt.fks) {
			try {
				const target = state.table(fk.table.name);
				const targetBuilt = target ? built.get(target) : undefined;
				if (!target || !targetBuilt) throw new Failure('fk-table-unknown', fk.table.from, fk.table.to, { table: fk.table.name });
				const fromColumns = resolveRefs(state, pt, fk.columns, source.ids);
				let toColumns: string[];
				if (fk.refColumns) {
					toColumns = fk.refColumns.map((ref) => {
						const id = targetBuilt.ids.get(state.key(ref.name));
						if (!id) throw new Failure('fk-column-unknown', ref.from, ref.to, { column: ref.name, table: target.name });
						return id;
					});
				} else {
					toColumns = targetBuilt.table.primaryKey;
					if (toColumns.length === 0) throw new Failure('fk-no-key', fk.table.from, fk.table.to, { table: target.name });
				}
				if (toColumns.length !== fromColumns.length) {
					throw new Failure('fk-count', fk.from, fk.to, { from: fromColumns.length, to: toColumns.length });
				}
				if (target.statement > fk.statement) {
					state.issues.push(
						issue(state.dialect === 'mysql' ? 'warning' : 'error', state.dialect === 'mysql' ? 'fk-forward-mysql' : 'fk-forward', fk.table.from, fk.table.to, { table: target.name }, false)
					);
				}
				const relation: Relation = {
					id: createId(),
					fromTable: source.table.id,
					fromColumns,
					toTable: targetBuilt.table.id,
					toColumns,
					onDelete: fk.onDelete,
					onUpdate: fk.onUpdate
				};
				if (fk.name) relation.name = fk.name;
				schema.relations.push(relation);
			} catch (error) {
				if (error instanceof Failure) state.issues.push(issue('error', error.code, error.from, error.to, error.params));
				else throw error;
			}
		}
	}
	schema.extras = state.extras;
	return schema;
}

export function parseSql(dialect: SqlDialectId, input: string): SqlParseResult {
	const state = new State(dialect, input);
	if (input.length > LIMITS.code) {
		state.issues.push(issue('error', 'code-too-large', 0, 0, { max: LIMITS.code }));
		return { schema: emptySchema(), issues: state.issues, statements: 0 };
	}
	const lex = tokenize(dialect, input);
	for (const problem of lex.issues) state.issues.push(issue('error', problem.code, problem.from, problem.to));
	const statements = splitStatements(dialect, lex.tokens);
	statements.forEach((stmt, index) => {
		const cursor = new Cursor(stmt.tokens, dialect, input, stmt);
		try {
			parseStatement(cursor, state, stmt, index);
		} catch (error) {
			if (!(error instanceof Failure)) throw error;
			const nextStart = statements[index + 1]?.start ?? Number.POSITIVE_INFINITY;
			const truncated = lex.issues.some((p) => p.from >= stmt.start && p.from < nextStart && p.code !== 'unexpected-character');
			if (!truncated) state.issues.push(issue('error', error.code, error.from, error.to, error.params));
		}
	});
	const schema = resolve(state);
	if (state.ignored > 0 && state.firstIgnored) {
		state.issues.push(issue('info', 'statements-ignored', state.firstIgnored.from, state.firstIgnored.to, { count: state.ignored }));
	}
	state.issues.sort((a, b) => a.from - b.from);
	return { schema, issues: state.issues, statements: statements.length };
}
