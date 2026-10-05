import { describe, expect, it } from 'vitest';
import {
	CONSENT_MAX_AGE_MS,
	analyticsCookieNames,
	cookieDomains,
	expiredCookie,
	parseDecision,
	serializeDecision
} from './consent';

const NOW = Date.UTC(2026, 9, 4);

describe('consent decision', () => {
	it('reads back what it wrote', () => {
		expect(parseDecision(serializeDecision('granted', NOW), NOW)).toBe('granted');
		expect(parseDecision(serializeDecision('denied', NOW), NOW)).toBe('denied');
	});

	it('asks again when nothing is stored', () => {
		expect(parseDecision(null, NOW)).toBeNull();
	});

	it('asks again after 24 months', () => {
		const stored = serializeDecision('granted', NOW);
		expect(parseDecision(stored, NOW + CONSENT_MAX_AGE_MS)).toBe('granted');
		expect(parseDecision(stored, NOW + CONSENT_MAX_AGE_MS + 1)).toBeNull();
	});

	it('asks again when the stored version is not the current one', () => {
		const stored = JSON.stringify({ analytics: 'granted', at: NOW, v: 0 });
		expect(parseDecision(stored, NOW)).toBeNull();
	});

	it('asks again when the timestamp is in the future', () => {
		expect(parseDecision(serializeDecision('granted', NOW + 1), NOW)).toBeNull();
	});

	it('treats damaged values as no decision', () => {
		for (const raw of ['', 'granted', '{', 'null', '[]', '{"analytics":"yes","at":1,"v":1}', '{"analytics":"granted","v":1}']) {
			expect(parseDecision(raw, NOW), raw).toBeNull();
		}
	});
});

describe('analytics cookies', () => {
	it('finds only the Google Analytics cookies', () => {
		const header = 'theme=dark; _ga=GA1.1.1; _ga_TB0F0YLTWX=GS2.1; other_ga=1; _gat=1';
		expect(analyticsCookieNames(header)).toEqual(['_ga', '_ga_TB0F0YLTWX']);
	});

	it('finds none in an empty header', () => {
		expect(analyticsCookieNames('')).toEqual([]);
	});

	it('lists the host and its parent domains without the top-level domain', () => {
		expect(cookieDomains('www.alexherrera.dev')).toEqual(['www.alexherrera.dev', 'alexherrera.dev']);
		expect(cookieDomains('alexherrera.dev')).toEqual(['alexherrera.dev']);
		expect(cookieDomains('localhost')).toEqual(['localhost']);
	});

	it('writes a cookie that expires immediately', () => {
		expect(expiredCookie('_ga', null)).toBe('_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/');
		expect(expiredCookie('_ga', 'alexherrera.dev')).toBe(
			'_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/; domain=alexherrera.dev'
		);
	});
});
