import { readSchema } from './serialize';
import { DIALECTS, type DialectId, type Schema } from './types';

const KEY = 'sf:v1';

export interface Saved {
	schema: Schema;
	dialect: DialectId;
	savedAt: number;
}

export function loadSaved(): Saved | null | 'corrupt' {
	let raw: string | null;
	try {
		raw = localStorage.getItem(KEY);
	} catch {
		return null;
	}
	if (!raw) return null;
	try {
		const value = JSON.parse(raw) as { schema?: unknown; dialect?: unknown; savedAt?: unknown };
		const schema = readSchema(value.schema);
		if (!schema) return 'corrupt';
		const dialect = DIALECTS.includes(value.dialect as DialectId) ? (value.dialect as DialectId) : 'postgres';
		return { schema, dialect, savedAt: typeof value.savedAt === 'number' ? value.savedAt : 0 };
	} catch {
		return 'corrupt';
	}
}

export function save(schema: Schema, dialect: DialectId): boolean {
	try {
		localStorage.setItem(KEY, JSON.stringify({ schema, dialect, savedAt: Date.now() }));
		return true;
	} catch {
		return false;
	}
}

export function clearSaved(): void {
	try {
		localStorage.removeItem(KEY);
	} catch {
		return;
	}
}

export function onExternalChange(listener: () => void): void {
	window.addEventListener('storage', (event) => {
		if (event.key === KEY) listener();
	});
}
