import { fold } from './fold';
import type { Schema } from './types';

export type SearchHit = { kind: 'table'; table: string } | { kind: 'column'; table: string; column: string };

export const SEARCH_LIMIT = 30;

const words = (name: string) => fold(name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')).split(/[^a-z0-9]+/).filter(Boolean);

function tier(name: string, term: string): number {
	const text = fold(name);
	if (text === term) return 0;
	if (text.startsWith(term)) return 1;
	if (words(name).some((word) => word.startsWith(term))) return 2;
	return text.includes(term) ? 3 : -1;
}

export function searchSchema(schema: Schema, query: string, limit = SEARCH_LIMIT): SearchHit[] {
	const terms = fold(query).split(/[\s.]+/).filter(Boolean);
	if (terms.length === 0) return schema.tables.slice(0, limit).map((table) => ({ kind: 'table', table: table.id }));
	const last = terms[terms.length - 1] ?? '';
	const lead = terms.slice(0, -1);
	const found: { hit: SearchHit; tier: number; column: number }[] = [];
	for (const table of schema.tables) {
		const tiers = terms.map((term) => tier(table.name, term));
		if (tiers.every((value) => value >= 0)) found.push({ hit: { kind: 'table', table: table.id }, tier: Math.max(...tiers), column: 0 });
		if (!lead.every((term) => tier(table.name, term) >= 0)) continue;
		for (const column of table.columns) {
			const value = tier(column.name, last);
			if (value >= 0) found.push({ hit: { kind: 'column', table: table.id, column: column.id }, tier: value, column: 1 });
		}
	}
	return found
		.map((entry, order) => ({ ...entry, order }))
		.sort((a, b) => a.tier - b.tier || a.column - b.column || a.order - b.order)
		.slice(0, limit)
		.map((entry) => entry.hit);
}
