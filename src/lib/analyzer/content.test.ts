import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeMessage } from './analyze';
import { FINDING_CODES } from './codes';
import { analyzerEn } from '../i18n/analyzer-en';
import { analyzerEs } from '../i18n/analyzer-es';

const ROOT = join(__dirname, '..', '..', 'content', 'analyzer');
const HIDDEN = new Set(['how', 'kind', 'start', 'end']);

type Family = { readonly id: string; readonly codes: string[]; readonly urls: string[]; readonly body: string };

function read(lang: 'es' | 'en'): Family[] {
	return readdirSync(ROOT).map((id) => {
		const text = readFileSync(join(ROOT, id, `${lang}.mdx`), 'utf8').replaceAll('\r\n', '\n');
		const front = text.split('---')[1] ?? '';
		const codes = [...(/codes:\n((?:  - .+\n)+)/.exec(front)?.[1] ?? '').matchAll(/  - (.+)/g)].map((match) => match[1] ?? '');
		const urls = [...front.matchAll(/url: (.+)/g)].map((match) => match[1] ?? '');
		return { id, codes, urls, body: text.split('---').slice(2).join('---') };
	});
}

const shape = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(shape);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]));
	}
	return typeof value;
};

describe('analyzer texts', () => {
	it('has a title for every code in both languages', () => {
		expect(Object.keys(analyzerEs.findings).sort()).toEqual([...FINDING_CODES].sort());
		expect(Object.keys(analyzerEn.findings).sort()).toEqual([...FINDING_CODES].sort());
	});

	it('has the same structure in both languages', () => {
		expect(shape(analyzerEn)).toEqual(shape(analyzerEs));
	});

	it('keeps the same placeholders in both languages', () => {
		const holes = (text: string): string => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join();
		expect(holes(analyzerEn.result.summaryOne)).toBe(holes(analyzerEs.result.summaryOne));
		expect(holes(analyzerEn.result.summaryMany)).toBe(holes(analyzerEs.result.summaryMany));
		expect(holes(analyzerEn.status.truncated)).toBe(holes(analyzerEs.status.truncated));
	});

	it('does not use a dash as punctuation', () => {
		for (const strings of [analyzerEs, analyzerEn]) expect(JSON.stringify(strings)).not.toMatch(/[—–]/);
	});

	it('labels every piece of evidence a finding can show', () => {
		const report = analyzeMessage({
			text: [analyzerEs.sample.message, analyzerEs.sample.links].join('\n'),
			sender: analyzerEs.sample.sender,
			headers: analyzerEs.sample.headers
		});
		for (const item of report.findings) {
			for (const key of Object.keys(item.evidence)) {
				if (HIDDEN.has(key)) continue;
				expect(analyzerEs.result.evidence, `${item.code}.${key}`).toHaveProperty([key]);
				expect(analyzerEn.result.evidence, `${item.code}.${key}`).toHaveProperty([key]);
			}
		}
	});
});

describe('analyzer explanations', () => {
	const es = read('es');
	const en = read('en');

	it('explains every code exactly once in each language', () => {
		for (const families of [es, en]) {
			const codes = families.flatMap((family) => family.codes);
			expect([...codes].sort()).toEqual([...FINDING_CODES].sort());
		}
	});

	it('covers the same codes and the same sources in both languages', () => {
		for (const family of es) {
			const pair = en.find((candidate) => candidate.id === family.id);
			expect(pair?.codes, family.id).toEqual(family.codes);
			expect(pair?.urls, family.id).toEqual(family.urls);
		}
	});

	it('has three sections and one to three sources in every explanation', () => {
		for (const family of [...es, ...en]) {
			expect([...family.body.matchAll(/^## /gm)].length, family.id).toBe(3);
			expect(family.urls.length, family.id).toBeGreaterThanOrEqual(1);
			expect(family.urls.length, family.id).toBeLessThanOrEqual(3);
		}
	});

	it('never uses a dash as punctuation', () => {
		for (const family of [...es, ...en]) expect(family.body, family.id).not.toMatch(/[—–]/);
	});
});

describe('analyzer sample', () => {
	it.each([
		['Spanish', analyzerEs],
		['English', analyzerEn]
	])('shows the expected signals in %s', (_name, strings) => {
		const report = analyzeMessage({
			text: [strings.sample.message, strings.sample.links].join('\n'),
			sender: strings.sample.sender,
			headers: strings.sample.headers
		});
		const codes = report.findings.map((item) => item.code);
		for (const code of [
			'link-shortener',
			'link-risky-tld',
			'text-credentials-request',
			'text-callback-number',
			'text-urgency',
			'hdr-auth-fail',
			'hdr-from-return-path-mismatch',
			'hdr-reply-to-mismatch'
		]) {
			expect(codes, code).toContain(code);
		}
	});
});
