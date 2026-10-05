import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { schemaflowEn } from '../i18n/schemaflow-en';
import { schemaflowEs } from '../i18n/schemaflow-es';
import { schemaflowUiEn } from '../i18n/schemaflow-ui-en';
import { schemaflowUiEs } from '../i18n/schemaflow-ui-es';
import { WARNING_CODES } from './dialects/migrate';
import { RULE_IDS } from './validate/rules';

const parseDir = join(__dirname, 'parse');

function emittedCodes(): Set<string> {
	const codes = new Set<string>(['syntax', 'engine', 'engine-timeout']);
	for (const file of readdirSync(parseDir)) {
		if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
		const text = readFileSync(join(parseDir, file), 'utf8');
		for (const m of text.matchAll(/issue\(\s*(?:'(?:error|warning|info)'|[^,]+),\s*'([a-z-]+)'/g)) if (m[1]) codes.add(m[1]);
		for (const m of text.matchAll(/issue\(\s*[^,]+,\s*[^,]*\?\s*'([a-z-]+)'\s*:\s*'([a-z-]+)'/g)) {
			if (m[1]) codes.add(m[1]);
			if (m[2]) codes.add(m[2]);
		}
		for (const m of text.matchAll(/new Failure\(\s*'([a-z-]+)'/g)) if (m[1]) codes.add(m[1]);
		for (const m of text.matchAll(/code: '([a-z-]+)'/g)) if (m[1]) codes.add(m[1]);
		for (const m of text.matchAll(/'(unterminated-[a-z]+|unexpected-character)'/g)) if (m[1]) codes.add(m[1]);
	}
	return codes;
}

describe('messages', () => {
	it('has a Spanish and an English text for every code the parsers emit', () => {
		for (const code of emittedCodes()) {
			expect(schemaflowEs.codes, code).toHaveProperty([code]);
			expect(schemaflowEn.codes, code).toHaveProperty([code]);
		}
	});

	it('has a text for every rule', () => {
		for (const rule of RULE_IDS) {
			expect(schemaflowEs.rules, rule).toHaveProperty([rule]);
			expect(schemaflowEn.rules, rule).toHaveProperty([rule]);
		}
	});

	it('keeps the same placeholders in both languages', () => {
		const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
		for (const [code, text] of Object.entries(schemaflowEs.codes)) {
			expect(holes(schemaflowEn.codes[code as keyof typeof schemaflowEs.codes]), code).toBe(holes(text));
		}
		for (const [rule, text] of Object.entries(schemaflowEs.rules)) {
			const en = schemaflowEn.rules[rule as keyof typeof schemaflowEs.rules] as Record<string, string>;
			for (const [key, value] of Object.entries(text as Record<string, string>)) expect(holes(en[key] ?? ''), `${rule}.${key}`).toBe(holes(value));
		}
	});

	it('uses Spanish and English quotation marks', () => {
		const all = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(all) : []);
		for (const text of all(schemaflowEs)) expect(text, text).not.toMatch(/"[^"]*\{[^}]+\}[^"]*"/);
		for (const text of all(schemaflowEn)) expect(text, text).not.toMatch(/[«»]/);
	});
});

describe('interface texts for migrations, exports, queries, templates, elements and canvas tools', () => {
	const leaves = (o: unknown, path = ''): [string, string][] =>
		typeof o === 'string' ? [[path, o]] : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k)) : [];
	const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
	const parts = (ui: typeof schemaflowUiEs) => ({ migration: ui.migration, exportCode: ui.exportCode, query: ui.pg.query, types: ui.types, gallery: ui.gallery, palette: ui.palette, relate: ui.relate, density: ui.density, finder: ui.finder, align: ui.align, history: ui.history, shortcuts: ui.shortcuts });

	it('has a text for every migration warning in both languages', () => {
		for (const code of WARNING_CODES) {
			expect(schemaflowUiEs.migration.warnings, code).toHaveProperty([code]);
			expect(schemaflowUiEn.migration.warnings, code).toHaveProperty([code]);
		}
	});

	it('has the same texts in both languages', () => {
		const paths = (ui: typeof schemaflowUiEs) => leaves(parts(ui)).map(([path]) => path).sort();
		expect(paths(schemaflowUiEn)).toEqual(paths(schemaflowUiEs));
	});

	it('keeps the same placeholders in both languages', () => {
		const en = new Map(leaves(parts(schemaflowUiEn)));
		for (const [path, text] of leaves(parts(schemaflowUiEs))) expect(holes(en.get(path) ?? ''), path).toBe(holes(text));
	});

	it('uses the quotation marks of each language', () => {
		for (const [path, text] of leaves(parts(schemaflowUiEn))) expect(text, path).not.toMatch(/[«»]/);
		for (const [path, text] of leaves(parts(schemaflowUiEs))) expect(text, path).not.toMatch(/"/);
	});
});
