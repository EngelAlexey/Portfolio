import type { SqlDialectId } from '../model/types';

export type TokenType = 'word' | 'quoted' | 'string' | 'number' | 'punct' | 'end' | 'batch';

export interface Token {
	type: TokenType;
	value: string;
	upper: string;
	start: number;
	end: number;
}

export interface LexIssue {
	code: 'unterminated-string' | 'unterminated-identifier' | 'unterminated-comment' | 'unexpected-character';
	from: number;
	to: number;
}

export interface LexResult {
	tokens: Token[];
	issues: LexIssue[];
}

const WORD_START = /[A-Za-z_À-￿]/;
const WORD_PART = /[A-Za-z0-9_$À-￿]/;
const DIGIT = /[0-9]/;
const SINGLE_PUNCT = new Set(['(', ')', ',', ';', '.', '+', '-', '*', '/', '%', '=', '<', '>', '!', '|', '&', '^', '~', '?', ':', '@', '[', ']', '{', '}']);

export function tokenize(dialect: SqlDialectId, input: string): LexResult {
	const tokens: Token[] = [];
	const issues: LexIssue[] = [];
	const n = input.length;
	let i = 0;
	let lineStart = true;
	let delimiter = ';';

	const push = (type: TokenType, value: string, start: number, end: number) => {
		tokens.push({ type, value, upper: type === 'word' ? value.toUpperCase() : '', start, end });
		lineStart = false;
	};

	const restOfLine = (from: number) => {
		const nl = input.indexOf('\n', from);
		return nl === -1 ? n : nl;
	};

	const readQuoted = (open: number, close: string, escapeDouble: boolean, backslash: boolean): { value: string; end: number } | null => {
		let j = open + 1;
		let value = '';
		while (j < n) {
			const ch = input[j] ?? '';
			if (backslash && ch === '\\' && j + 1 < n) {
				const next = input[j + 1] ?? '';
				value += next === 'n' ? '\n' : next === 't' ? '\t' : next === '0' ? '\0' : next;
				j += 2;
				continue;
			}
			if (ch === close) {
				if (escapeDouble && input[j + 1] === close) {
					value += close;
					j += 2;
					continue;
				}
				return { value, end: j + 1 };
			}
			value += ch;
			j++;
		}
		return null;
	};

	while (i < n) {
		const ch = input[i] ?? '';

		if (ch === '\n') {
			lineStart = true;
			i++;
			continue;
		}
		if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v' || ch === ' ' || ch === '﻿') {
			i++;
			continue;
		}

		if (lineStart && dialect === 'postgres' && ch === '\\') {
			i = restOfLine(i);
			continue;
		}

		if (lineStart && dialect === 'mysql' && /^delimiter[ \t]/i.test(input.slice(i, i + 10))) {
			const lineEnd = restOfLine(i);
			const value = input.slice(i + 9, lineEnd).trim();
			if (value) delimiter = value;
			i = lineEnd;
			continue;
		}

		if (lineStart && dialect === 'sqlserver' && /^go\b/i.test(input.slice(i, i + 3))) {
			const lineEnd = restOfLine(i);
			const rest = input.slice(i + 2, lineEnd);
			if (/^\s*(\d+\s*)?(--.*)?$/.test(rest)) {
				push('batch', 'GO', i, i + 2);
				lineStart = true;
				i = lineEnd;
				continue;
			}
		}

		if (delimiter !== ';' && input.startsWith(delimiter, i)) {
			push('end', delimiter, i, i + delimiter.length);
			i += delimiter.length;
			continue;
		}

		if (ch === '-' && input[i + 1] === '-') {
			i = restOfLine(i);
			continue;
		}
		if (ch === '#' && dialect === 'mysql') {
			i = restOfLine(i);
			continue;
		}
		if (ch === '/' && input[i + 1] === '*') {
			let depth = 1;
			let j = i + 2;
			while (j < n && depth > 0) {
				if (input[j] === '*' && input[j + 1] === '/') {
					depth--;
					j += 2;
				} else if (dialect === 'postgres' && input[j] === '/' && input[j + 1] === '*') {
					depth++;
					j += 2;
				} else {
					j++;
				}
			}
			if (depth > 0) {
				issues.push({ code: 'unterminated-comment', from: i, to: n });
				i = n;
			} else {
				i = j;
			}
			continue;
		}

		const prefix = ch.toUpperCase();
		if ((prefix === 'N' || prefix === 'E' || prefix === 'X' || prefix === 'B') && input[i + 1] === "'") {
			const backslash = prefix === 'E' || dialect === 'mysql';
			const read = readQuoted(i + 1, "'", true, backslash);
			if (!read) {
				issues.push({ code: 'unterminated-string', from: i, to: n });
				i = n;
				continue;
			}
			push('string', read.value, i, read.end);
			i = read.end;
			continue;
		}

		if (ch === "'") {
			const read = readQuoted(i, "'", true, dialect === 'mysql');
			if (!read) {
				issues.push({ code: 'unterminated-string', from: i, to: n });
				i = n;
				continue;
			}
			push('string', read.value, i, read.end);
			i = read.end;
			continue;
		}

		if (ch === '"') {
			const read = readQuoted(i, '"', true, dialect === 'mysql');
			if (!read) {
				issues.push({ code: dialect === 'mysql' ? 'unterminated-string' : 'unterminated-identifier', from: i, to: n });
				i = n;
				continue;
			}
			push(dialect === 'mysql' ? 'string' : 'quoted', read.value, i, read.end);
			i = read.end;
			continue;
		}

		if (ch === '`') {
			if (dialect !== 'mysql') {
				issues.push({ code: 'unexpected-character', from: i, to: i + 1 });
				i++;
				continue;
			}
			const read = readQuoted(i, '`', true, false);
			if (!read) {
				issues.push({ code: 'unterminated-identifier', from: i, to: n });
				i = n;
				continue;
			}
			push('quoted', read.value, i, read.end);
			i = read.end;
			continue;
		}

		if (ch === '[' && dialect === 'sqlserver') {
			const read = readQuoted(i, ']', true, false);
			if (!read) {
				issues.push({ code: 'unterminated-identifier', from: i, to: n });
				i = n;
				continue;
			}
			push('quoted', read.value, i, read.end);
			i = read.end;
			continue;
		}

		if (ch === '$' && dialect === 'postgres') {
			const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(input.slice(i, i + 64));
			if (tag) {
				const close = input.indexOf(tag[0], i + tag[0].length);
				if (close === -1) {
					issues.push({ code: 'unterminated-string', from: i, to: n });
					i = n;
					continue;
				}
				push('string', input.slice(i + tag[0].length, close), i, close + tag[0].length);
				i = close + tag[0].length;
				continue;
			}
		}

		if (DIGIT.test(ch) || (ch === '.' && DIGIT.test(input[i + 1] ?? ''))) {
			const hex = /^0x[0-9a-fA-F]+/.exec(input.slice(i, i + 256));
			const num = hex ?? /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(input.slice(i, i + 256));
			const text = num?.[0] ?? ch;
			push('number', text, i, i + text.length);
			i += text.length;
			continue;
		}

		if (WORD_START.test(ch) || ((ch === '@' || (ch === '#' && dialect === 'sqlserver')) && WORD_START.test(input[i + 1] ?? ''))) {
			let j = i + 1;
			while (j < n && (WORD_PART.test(input[j] ?? '') || (dialect === 'sqlserver' && (input[j] === '@' || input[j] === '#')))) j++;
			push('word', input.slice(i, j), i, j);
			i = j;
			continue;
		}

		if (ch === ':' && input[i + 1] === ':') {
			push('punct', '::', i, i + 2);
			i += 2;
			continue;
		}

		if (ch === '$') {
			let j = i + 1;
			while (j < n && DIGIT.test(input[j] ?? '')) j++;
			push('word', input.slice(i, j), i, j);
			i = j;
			continue;
		}

		if (SINGLE_PUNCT.has(ch)) {
			push('punct', ch, i, i + 1);
			i++;
			continue;
		}

		issues.push({ code: 'unexpected-character', from: i, to: i + 1 });
		i++;
	}

	return { tokens, issues };
}
