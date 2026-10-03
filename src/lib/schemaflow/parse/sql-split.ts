import type { SqlDialectId } from '../model/types';
import type { Token } from './sql-lexer';

export interface Statement {
	tokens: Token[];
	start: number;
	end: number;
}

const NOT_A_BLOCK = new Set(['TRAN', 'TRANSACTION', 'WORK', 'DISTRIBUTED', 'DIALOG', 'CONVERSATION', 'ISOLATION', 'DEFERRED', 'IMMEDIATE', 'EXCLUSIVE']);
const END_OF_CONSTRUCT = new Set(['IF', 'LOOP', 'WHILE', 'REPEAT', 'FOR']);
const BATCH_OBJECTS = new Set(['PROC', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'VIEW']);

function startsBatchObject(tokens: Token[]): boolean {
	if (tokens[0]?.upper !== 'CREATE' && tokens[0]?.upper !== 'ALTER') return false;
	let k = 1;
	if (tokens[k]?.upper === 'OR' && (tokens[k + 1]?.upper === 'ALTER' || tokens[k + 1]?.upper === 'REPLACE')) k += 2;
	return BATCH_OBJECTS.has(tokens[k]?.upper ?? '');
}

export function splitStatements(dialect: SqlDialectId, tokens: readonly Token[]): Statement[] {
	const statements: Statement[] = [];
	let current: Token[] = [];
	let depth = 0;

	const flush = () => {
		const first = current[0];
		const last = current[current.length - 1];
		if (first && last) statements.push({ tokens: current, start: first.start, end: last.end });
		current = [];
		depth = 0;
	};

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) continue;
		if (token.type === 'batch' || token.type === 'end') {
			flush();
			continue;
		}
		if (token.type === 'punct' && token.value === ';') {
			const batchObject = dialect === 'sqlserver' && startsBatchObject(current);
			if (depth === 0 && !batchObject) {
				flush();
				continue;
			}
			current.push(token);
			continue;
		}
		if (token.type === 'word') {
			const next = tokens[i + 1];
			if (token.upper === 'BEGIN') {
				const isBlock = next !== undefined && !(next.type === 'punct' && next.value === ';') && next.type !== 'end' && next.type !== 'batch' && !NOT_A_BLOCK.has(next.upper);
				if (isBlock) depth++;
			} else if (token.upper === 'CASE') {
				depth++;
			} else if (token.upper === 'END' && depth > 0 && !(next && END_OF_CONSTRUCT.has(next.upper))) {
				depth--;
			}
		}
		current.push(token);
	}
	flush();
	return statements;
}
