import type { DialectId, SqlDialectId } from '../model/types';
import { isReserved } from './reserved';

export const MAX_IDENTIFIER: Record<DialectId, number> = {
	postgres: 63,
	mysql: 64,
	sqlserver: 128,
	mongodb: 200
};

export const PLAIN_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const encoder = new TextEncoder();

export function byteLength(value: string): number {
	return encoder.encode(value).length;
}

export function hash(value: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < value.length; i++) {
		h ^= value.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(36).padStart(6, '0').slice(-6);
}

export function needsQuotes(dialect: SqlDialectId, name: string): boolean {
	if (!PLAIN_IDENTIFIER.test(name)) return true;
	if (isReserved(dialect, name)) return true;
	return dialect === 'postgres' && /[A-Z]/.test(name);
}

export function quote(dialect: SqlDialectId, name: string): string {
	if (!needsQuotes(dialect, name)) return name;
	if (dialect === 'mysql') return `\`${name.replaceAll('`', '``')}\``;
	if (dialect === 'sqlserver') return `[${name.replaceAll(']', ']]')}]`;
	return `"${name.replaceAll('"', '""')}"`;
}

export function constraintName(dialect: DialectId, base: string): string {
	const clean = base.replace(/[^A-Za-z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'c';
	const safe = /^[A-Za-z_]/.test(clean) ? clean : `c_${clean}`;
	const max = MAX_IDENTIFIER[dialect];
	if (byteLength(safe) <= max) return safe;
	return `${safe.slice(0, max - 7)}_${hash(safe)}`;
}
