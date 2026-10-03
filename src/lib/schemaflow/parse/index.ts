import type { DialectId, Schema } from '../model/types';
import type { CodeIssue } from './issues';
import { parseMongo } from './mongo-parse';
import { parseSql } from './sql-parse';

export interface ParseResult {
	schema: Schema;
	issues: CodeIssue[];
	statements: number;
}

export function parseCode(dialect: DialectId, code: string): ParseResult {
	return dialect === 'mongodb' ? parseMongo(code) : parseSql(dialect, code);
}

export function hasBlocking(issues: readonly CodeIssue[]): boolean {
	return issues.some((i) => i.blocking);
}
