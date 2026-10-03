import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { schemaflowEn } from '../i18n/schemaflow-en';
import { schemaflowEs } from '../i18n/schemaflow-es';
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
