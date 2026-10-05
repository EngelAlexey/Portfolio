import type { Column, Extra, LogicalType, Table } from '../model/types';

export type Value = number | string | boolean | null;
export type Cell = string | null;

type Node =
	| { t: 'lit'; v: Value }
	| { t: 'col'; name: string; exact: boolean }
	| { t: 'list'; items: Node[] }
	| { t: 'not' | 'neg'; a: Node }
	| { t: 'bin'; op: string; a: Node; b: Node }
	| { t: 'is'; a: Node; what: 'null' | 'true' | 'false'; not: boolean }
	| { t: 'between'; a: Node; lo: Node; hi: Node; not: boolean }
	| { t: 'in'; a: Node; items: Node[]; not: boolean }
	| { t: 'quant'; op: string; a: Node; all: boolean; list: Node }
	| { t: 'fn'; name: string; args: Node[] }
	| { t: 'cast'; a: Node; to: string };

export interface Check {
	node: Node;
}

export interface Field {
	column: Column;
	type: LogicalType;
	cell: Cell;
	fixed: boolean;
}

interface Token {
	kind: 'num' | 'str' | 'word' | 'quoted' | 'op';
	text: string;
}

const UNKNOWN = new Error('unknown');

function tokenize(source: string): Token[] | null {
	const out: Token[] = [];
	let at = 0;
	while (at < source.length) {
		const char = source[at] as string;
		if (/\s/.test(char)) {
			at++;
			continue;
		}
		if (char === "'" || char === '"') {
			let text = '';
			let next = at + 1;
			for (;;) {
				if (next >= source.length) return null;
				if (source[next] === char) {
					if (source[next + 1] !== char) break;
					text += char;
					next += 2;
					continue;
				}
				text += source[next];
				next++;
			}
			out.push({ kind: char === "'" ? 'str' : 'quoted', text });
			at = next + 1;
			continue;
		}
		const rest = source.slice(at);
		const found = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
		if (found) {
			out.push({ kind: 'num', text: found[0] });
			at += found[0].length;
			continue;
		}
		const word = /^[\p{L}_][\p{L}\p{N}_$]*/u.exec(rest);
		if (word) {
			out.push({ kind: 'word', text: word[0] });
			at += word[0].length;
			continue;
		}
		const op = /^(?:<>|!=|<=|>=|\|\||::|!~\*|!~|~\*|[=<>+\-*/%(),[\]~.])/.exec(rest);
		if (!op) return null;
		out.push({ kind: 'op', text: op[0] });
		at += op[0].length;
	}
	return out;
}

function parseNode(source: string): Node | null {
	const tokens = tokenize(source);
	if (!tokens) return null;
	let at = 0;
	const fail = (): never => {
		throw new SyntaxError('check');
	};
	const isWord = (...names: string[]) => {
		const token = tokens[at];
		return token?.kind === 'word' && names.includes(token.text.toLowerCase());
	};
	const isOp = (...ops: string[]) => {
		const token = tokens[at];
		return token?.kind === 'op' && ops.includes(token.text);
	};
	const takeWord = (...names: string[]) => (isWord(...names) ? (at++, true) : false);
	const takeOp = (...ops: string[]) => (isOp(...ops) ? (at++, true) : false);
	const next = (): Token => tokens[at++] ?? fail();
	const list = (close: string): Node[] => {
		const items: Node[] = [];
		if (!isOp(close)) {
			items.push(orExpr());
			while (takeOp(',')) items.push(orExpr());
		}
		if (!takeOp(close)) fail();
		return items;
	};
	const typeName = (): string => {
		const token = next();
		if (token.kind !== 'word' && token.kind !== 'quoted') fail();
		let name = token.text.toLowerCase();
		if (name === 'double' && takeWord('precision')) name = 'double precision';
		else if ((name === 'character' || name === 'bit') && takeWord('varying')) name += ' varying';
		else if ((name === 'timestamp' || name === 'time') && takeWord('with', 'without')) {
			at += 2;
		}
		if (takeOp('(')) while (!takeOp(')')) next();
		while (takeOp('[')) if (!takeOp(']')) fail();
		return name;
	};
	const primary = (): Node => {
		const token = next();
		if (token.kind === 'num') return { t: 'lit', v: Number(token.text) };
		if (token.kind === 'str') return { t: 'lit', v: token.text };
		if (token.kind === 'op') {
			if (token.text !== '(') fail();
			const inner = orExpr();
			if (!takeOp(')')) fail();
			return inner;
		}
		const lower = token.text.toLowerCase();
		if (token.kind === 'word') {
			if (lower === 'true' || lower === 'false') return { t: 'lit', v: lower === 'true' };
			if (lower === 'null') return { t: 'lit', v: null };
			if (lower === 'array' && takeOp('[')) return { t: 'list', items: list(']') };
			if (takeOp('(')) return { t: 'fn', name: lower, args: list(')') };
		}
		let name = token.text;
		let exact = token.kind === 'quoted';
		while (takeOp('.')) {
			const part = next();
			if (part.kind !== 'word' && part.kind !== 'quoted') fail();
			name = part.text;
			exact = part.kind === 'quoted';
		}
		return { t: 'col', name, exact };
	};
	const unary = (): Node => {
		if (takeOp('-')) return { t: 'neg', a: unary() };
		if (takeOp('+')) return unary();
		let node = primary();
		while (takeOp('::')) node = { t: 'cast', a: node, to: typeName() };
		return node;
	};
	const binary = (ops: string[], inner: () => Node) => (): Node => {
		let left = inner();
		while (isOp(...ops)) left = { t: 'bin', op: next().text, a: left, b: inner() };
		return left;
	};
	const multiplicative = binary(['*', '/', '%'], unary);
	const additive = binary(['+', '-', '||'], multiplicative);
	const comparison = (): Node => {
		const left = additive();
		if (isOp('=', '<>', '!=', '<', '<=', '>', '>=')) {
			const op = next().text;
			if (isWord('any', 'some', 'all')) {
				const all = next().text.toLowerCase() === 'all';
				if (!takeOp('(')) fail();
				const source = orExpr();
				if (!takeOp(')')) fail();
				return { t: 'quant', op, a: left, all, list: source };
			}
			return { t: 'bin', op, a: left, b: additive() };
		}
		if (isOp('~', '~*', '!~', '!~*')) return { t: 'bin', op: next().text, a: left, b: additive() };
		return left;
	};
	const predicate = (): Node => {
		const left = comparison();
		if (takeWord('is')) {
			const not = takeWord('not');
			const what = isWord('null') ? 'null' : isWord('true') ? 'true' : isWord('false') ? 'false' : fail();
			at++;
			return { t: 'is', a: left, what, not };
		}
		const mark = at;
		const not = takeWord('not');
		if (takeWord('between')) {
			const lo = additive();
			if (!takeWord('and')) fail();
			return { t: 'between', a: left, lo, hi: additive(), not };
		}
		if (takeWord('in')) {
			if (!takeOp('(')) fail();
			return { t: 'in', a: left, items: list(')'), not };
		}
		if (isWord('like', 'ilike')) {
			const node: Node = { t: 'bin', op: next().text.toLowerCase(), a: left, b: additive() };
			return not ? { t: 'not', a: node } : node;
		}
		at = mark;
		return left;
	};
	const notExpr = (): Node => (takeWord('not') ? { t: 'not', a: notExpr() } : predicate());
	const andExpr = binaryWord('and', notExpr);
	const orExpr = binaryWord('or', andExpr);
	function binaryWord(word: string, inner: () => Node): () => Node {
		return () => {
			let left = inner();
			while (takeWord(word)) left = { t: 'bin', op: word, a: left, b: inner() };
			return left;
		};
	}
	try {
		const node = orExpr();
		return at === tokens.length ? node : null;
	} catch (error) {
		if (error instanceof SyntaxError) return null;
		throw error;
	}
}

type Env = (name: string, exact: boolean) => Value | undefined;

function compare(a: Value, b: Value): number | null {
	if (a === null || b === null) return null;
	if (typeof a === 'number' && typeof b === 'number') return Math.sign(a - b);
	if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
	if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
	const [number, word] = typeof a === 'number' ? [a, b] : [b, a];
	if (typeof number === 'number' && typeof word === 'string' && word.trim() !== '' && Number.isFinite(Number(word))) return Math.sign(typeof a === 'number' ? number - Number(word) : Number(word) - number);
	throw UNKNOWN;
}

const ordered = (op: string, sign: number | null): boolean | null => {
	if (sign === null) return null;
	if (op === '=') return sign === 0;
	if (op === '<>' || op === '!=') return sign !== 0;
	if (op === '<') return sign < 0;
	if (op === '<=') return sign <= 0;
	if (op === '>') return sign > 0;
	return sign >= 0;
};

const negate = (value: boolean | null, not: boolean): boolean | null => (value === null || !not ? value : !value);

function matcher(pattern: string, flags: string): RegExp {
	if (pattern.length > 200 || /\[\[:|\\[ymMYA-Z]|\(\?/.test(pattern)) throw UNKNOWN;
	try {
		return new RegExp(pattern, flags);
	} catch {
		throw UNKNOWN;
	}
}

function like(text: string, pattern: string, insensitive: boolean): boolean {
	const source = [...pattern].map((char) => (char === '%' ? '.*' : char === '_' ? '.' : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('');
	return new RegExp(`^${source}$`, `s${insensitive ? 'i' : ''}`).test(text);
}

function text(value: Value): string | null {
	if (value === null) return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	throw UNKNOWN;
}

function numbers(value: Value): number | null {
	if (value === null) return null;
	if (typeof value === 'number') return value;
	throw UNKNOWN;
}

function evaluate(node: Node, env: Env): Value {
	const walk = (inner: Node) => evaluate(inner, env);
	const attempt = (inner: Node): Value | undefined => {
		try {
			return walk(inner);
		} catch (error) {
			if (error === UNKNOWN) return undefined;
			throw error;
		}
	};
	switch (node.t) {
		case 'lit':
			return node.v;
		case 'col': {
			const value = env(node.name, node.exact);
			if (value === undefined) throw UNKNOWN;
			return value;
		}
		case 'list':
			throw UNKNOWN;
		case 'not': {
			const value = walk(node.a);
			if (value === null) return null;
			if (typeof value !== 'boolean') throw UNKNOWN;
			return !value;
		}
		case 'neg': {
			const value = numbers(walk(node.a));
			return value === null ? null : -value;
		}
		case 'is': {
			const value = walk(node.a);
			const result = node.what === 'null' ? value === null : node.what === 'true' ? value === true : value === false;
			return node.not ? !result : result;
		}
		case 'between': {
			const value = walk(node.a);
			const low = ordered('>=', compare(value, walk(node.lo)));
			const high = ordered('<=', compare(value, walk(node.hi)));
			const both = low === false || high === false ? false : low === null || high === null ? null : true;
			return negate(both, node.not);
		}
		case 'in': {
			const value = walk(node.a);
			if (value === null) return null;
			let missing = false;
			for (const item of node.items) {
				const sign = compare(value, walk(item));
				if (sign === 0) return !node.not;
				if (sign === null) missing = true;
			}
			return missing ? null : node.not;
		}
		case 'quant': {
			if (node.list.t !== 'list') throw UNKNOWN;
			const value = walk(node.a);
			if (value === null) return null;
			let missing = false;
			for (const item of node.list.items) {
				const result = ordered(node.op, compare(value, walk(item)));
				if (result === null) missing = true;
				else if (result === !node.all) return result;
			}
			return missing ? null : node.all;
		}
		case 'cast': {
			const value = walk(node.a);
			if (value === null) return null;
			if (/^(int|integer|bigint|smallint|int[248]|serial)$/.test(node.to)) return Math.round(numbers(typeof value === 'string' ? Number(value) : value) ?? 0);
			if (/^(numeric|decimal|real|float[48]?|double precision)$/.test(node.to)) return numbers(typeof value === 'string' ? Number(value) : value);
			if (/^(text|varchar|character varying|char|character|bpchar)$/.test(node.to)) return String(value);
			return value;
		}
		case 'fn': {
			const args = node.args.map(walk);
			const first = args[0] ?? null;
			if (node.name === 'coalesce') return args.find((value) => value !== null) ?? null;
			if (node.name === 'nullif') return args.length === 2 && compare(args[0] ?? null, args[1] ?? null) === 0 ? null : first;
			if (args.length !== 1) throw UNKNOWN;
			if (node.name === 'abs') {
				const value = numbers(first);
				return value === null ? null : Math.abs(value);
			}
			const value = text(first);
			if (value === null) return null;
			if (node.name === 'char_length' || node.name === 'character_length' || node.name === 'length') return [...value].length;
			if (node.name === 'lower') return value.toLowerCase();
			if (node.name === 'upper') return value.toUpperCase();
			if (node.name === 'trim' || node.name === 'btrim') return value.trim();
			throw UNKNOWN;
		}
		case 'bin': {
			if (node.op === 'and' || node.op === 'or') {
				const left = attempt(node.a);
				const right = attempt(node.b);
				const decisive = node.op !== 'and';
				if (left === decisive || right === decisive) return decisive;
				if (left === undefined || right === undefined || (left !== null && typeof left !== 'boolean') || (right !== null && typeof right !== 'boolean')) throw UNKNOWN;
				return left === null || right === null ? null : !decisive;
			}
			const a = walk(node.a);
			const b = walk(node.b);
			if (['=', '<>', '!=', '<', '<=', '>', '>='].includes(node.op)) return ordered(node.op, compare(a, b));
			if (node.op === '+' || node.op === '-' || node.op === '*' || node.op === '%') {
				const x = numbers(a);
				const y = numbers(b);
				if (x === null || y === null) return null;
				if (node.op === '%') {
					if (y === 0) throw UNKNOWN;
					return x % y;
				}
				return node.op === '+' ? x + y : node.op === '-' ? x - y : x * y;
			}
			if (node.op === '||') {
				const x = text(a);
				const y = text(b);
				return x === null || y === null ? null : x + y;
			}
			const subject = text(a);
			const pattern = text(b);
			if (subject === null || pattern === null) return null;
			if (node.op === 'like' || node.op === 'ilike') return like(subject, pattern, node.op === 'ilike');
			if (node.op === '~' || node.op === '~*') return matcher(pattern, node.op === '~*' ? 'i' : '').test(subject);
			if (node.op === '!~' || node.op === '!~*') return !matcher(pattern, node.op === '!~*' ? 'i' : '').test(subject);
			throw UNKNOWN;
		}
	}
}

const wanted = (name: string) => name.replace(/^"|"$/g, '').replaceAll('""', '"');

function owns(table: Table, reference: string): boolean {
	const last = reference.split('.').pop() ?? reference;
	return last.startsWith('"') ? wanted(last) === table.name : last.toLowerCase() === table.name;
}

export function checksOf(table: Table, extras: readonly Extra[]): Check[] {
	const out: Check[] = [];
	for (const extra of extras) {
		if (extra.dialect !== 'postgres') continue;
		const found = /^\s*ALTER\s+TABLE\s+(?:ONLY\s+)?(?:IF\s+EXISTS\s+)?((?:"(?:[^"]|"")+"|[\w$]+)(?:\.(?:"(?:[^"]|"")+"|[\w$]+))?)\s+ADD\s+(?:CONSTRAINT\s+(?:"(?:[^"]|"")+"|[\w$]+)\s+)?CHECK\s*(\([\s\S]*\))\s*(?:NOT\s+VALID\s*)?(?:NO\s+INHERIT\s*)?;?\s*$/i.exec(extra.sql);
		if (!found || !owns(table, found[1] ?? '')) continue;
		const node = parseNode(found[2] ?? '');
		if (node) out.push({ node });
	}
	return out;
}

export function referenced(check: Check): string[] {
	const found = { numbers: [] as number[], strings: [] as string[], columns: [] as string[] };
	gather(check.node, found);
	return found.columns;
}

export function evaluateCheck(source: string, values: Readonly<Record<string, Value>>): Value | undefined {
	const check = parseCheck(source);
	if (!check) return undefined;
	const env: Env = (name) => (Object.hasOwn(values, name) ? values[name] : Object.hasOwn(values, name.toLowerCase()) ? values[name.toLowerCase()] : undefined);
	try {
		return evaluate(check.node, env);
	} catch (error) {
		if (error === UNKNOWN) return undefined;
		throw error;
	}
}

export function parseCheck(source: string): Check | null {
	const node = parseNode(source);
	return node ? { node } : null;
}

function valueOf(field: Field): Value | undefined {
	const { cell, type } = field;
	if (cell === null) return null;
	if (cell === 'true' || cell === 'false') return cell === 'true';
	if (type.kind === 'raw' || type.kind === 'json' || type.kind === 'binary') return undefined;
	if (/^-?\d+(\.\d+)?$/.test(cell)) return Number(cell);
	const quoted = /^'([\s\S]*)'$/.exec(cell);
	return quoted ? (quoted[1] ?? '').replaceAll("''", "'") : undefined;
}

function environment(fields: readonly Field[]): Env {
	return (name, exact) => {
		const found = fields.find((field) => field.column.name === (exact ? name : name.toLowerCase()));
		return found ? valueOf(found) : undefined;
	};
}

function broken(checks: readonly Check[], fields: readonly Field[]): Check[] {
	const env = environment(fields);
	return checks.filter((check) => {
		try {
			return evaluate(check.node, env) === false;
		} catch (error) {
			if (error === UNKNOWN) return false;
			throw error;
		}
	});
}

function gather(node: Node, out: { numbers: number[]; strings: string[]; columns: string[] }): void {
	switch (node.t) {
		case 'lit':
			if (typeof node.v === 'number') out.numbers.push(node.v);
			else if (typeof node.v === 'string') out.strings.push(node.v);
			return;
		case 'col':
			out.columns.push(node.exact ? node.name : node.name.toLowerCase());
			return;
		case 'list':
			node.items.forEach((item) => gather(item, out));
			return;
		case 'not':
		case 'neg':
		case 'cast':
		case 'is':
			gather(node.a, out);
			return;
		case 'bin':
			gather(node.a, out);
			gather(node.b, out);
			return;
		case 'between':
			[node.a, node.lo, node.hi].forEach((item) => gather(item, out));
			return;
		case 'in':
			[node.a, ...node.items].forEach((item) => gather(item, out));
			return;
		case 'quant':
			gather(node.a, out);
			gather(node.list, out);
			return;
		case 'fn':
			node.args.forEach((item) => gather(item, out));
	}
}

const pad = (n: number) => String(n).padStart(2, '0');

function spread<T>(values: readonly T[], n: number): T[] {
	const shift = (n - 1) % Math.max(1, values.length);
	return [...values.slice(shift), ...values.slice(0, shift)];
}

function candidates(field: Field, fields: readonly Field[], found: { numbers: number[]; strings: string[] }, n: number): string[] {
	const type = field.type;
	const unique = (values: string[]) => [...new Set(values)];
	const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
	if (type.kind === 'boolean') return ['true', 'false'];
	if (type.kind === 'smallint' || type.kind === 'int' || type.kind === 'bigint' || type.kind === 'decimal' || type.kind === 'real' || type.kind === 'double') {
		const others = fields.filter((other) => other !== field && other.cell !== null && /^-?\d+(\.\d+)?$/.test(other.cell)).map((other) => Number(other.cell));
		const seeds = [...spread(found.numbers, n), ...found.numbers.flatMap((v) => [v + n, v - n, v + 1, v - 1, v * 2, v + 10 * n]), ...others.flatMap((v) => [v, v + 1, v - 1, v * 2]), n * 10, n, 1, 0, 100, 1000];
		const limit = type.kind === 'smallint' ? 32767 : type.kind === 'int' ? 2147483647 : Number.MAX_SAFE_INTEGER;
		if (type.kind === 'decimal') {
			const scale = type.scale ?? 2;
			const room = 10 ** ((type.precision ?? 12) - scale);
			return unique(seeds.filter((v) => Number.isFinite(v) && Math.abs(v) < room).map((v) => v.toFixed(scale)));
		}
		if (type.kind === 'real' || type.kind === 'double') return unique(seeds.filter(Number.isFinite).map(String));
		return unique(seeds.filter((v) => Number.isInteger(v) && Math.abs(v) <= limit).map(String));
	}
	if (type.kind === 'varchar' || type.kind === 'char' || type.kind === 'text') {
		const room = type.kind === 'varchar' || type.kind === 'char' ? (type.length ?? Infinity) : Infinity;
		const sizes = found.numbers.filter((v) => Number.isInteger(v) && v >= 0 && v <= 100).flatMap((v) => ['x'.repeat(v), 'x'.repeat(v + 1)]);
		const patterns = found.strings.flatMap((s) => (/[%_]/.test(s) ? [s.replace(/[%_]/g, 'x'), s.replaceAll('%', '')] : []));
		return unique([...spread(found.strings, n), ...patterns, ...sizes].filter((s) => [...s].length <= room && s !== '').map(quote));
	}
	if (type.kind === 'date' || type.kind === 'timestamp' || type.kind === 'timestamptz') {
		const tail = type.kind === 'date' ? '' : type.kind === 'timestamp' ? ' 09:00:00' : ' 09:00:00+00';
		const given = found.strings.filter((s) => /^\d{4}-\d{2}-\d{2}/.test(s)).map((s) => (type.kind === 'date' ? s.slice(0, 10) : s.length > 10 ? s : `${s}${tail}`));
		return unique([...spread(given, n), `2026-02-${pad(n)}${tail}`, `2026-03-${pad(n)}${tail}`, `2025-12-${pad(n)}${tail}`, `2027-01-${pad(n)}${tail}`].map(quote));
	}
	return [];
}

function cluster(target: Check, checks: readonly Check[]): Check[] {
	const names = new Set(referenced(target));
	const group = new Set([target]);
	for (let grew = true; grew; ) {
		grew = false;
		for (const check of checks) {
			if (group.has(check) || !referenced(check).some((name) => names.has(name))) continue;
			group.add(check);
			referenced(check).forEach((name) => names.add(name));
			grew = true;
		}
	}
	return [...group];
}

function fix(target: Check, checks: readonly Check[], fields: Field[], failing: readonly Check[], n: number): Field[] | null {
	const found = { numbers: [] as number[], strings: [] as string[], columns: [] as string[] };
	for (const check of cluster(target, checks)) gather(check.node, found);
	const options = fields
		.filter((field) => !field.fixed && found.columns.includes(field.column.name))
		.map((field) => ({ field, values: candidates(field, fields, found, n) }))
		.filter((option) => option.values.length > 0)
		.reverse();
	const attempt = (changes: [Field, string][]): Field[] | null => {
		const trial = fields.map((field) => ({ ...field, cell: changes.find(([changed]) => changed === field)?.[1] ?? field.cell }));
		const now = broken(checks, trial);
		return !now.includes(target) && now.every((check) => failing.includes(check)) ? trial : null;
	};
	for (const option of options) {
		for (const value of option.values) {
			const done = attempt([[option.field, value]]);
			if (done) return done;
		}
	}
	for (let i = 0; i < options.length; i++) {
		for (let j = i + 1; j < options.length; j++) {
			for (const first of options[i]?.values ?? []) {
				for (const second of options[j]?.values ?? []) {
					const done = attempt([
						[options[i]?.field as Field, first],
						[options[j]?.field as Field, second]
					]);
					if (done) return done;
				}
			}
		}
	}
	return null;
}

export function repair(checks: readonly Check[], fields: Field[], n: number): Cell[] | null {
	let current = fields;
	let changed = false;
	for (let round = 0; round < checks.length; round++) {
		const failing = broken(checks, current);
		const target = failing[0];
		if (!target) break;
		const better = fix(target, checks, current, failing, n);
		if (!better) break;
		current = better;
		changed = true;
	}
	return changed ? current.map((field) => field.cell) : null;
}
