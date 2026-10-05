import { finding } from '../codes';
import { TACTICS } from '../data/phrases';
import { LIMITS } from '../limits';
import type { Finding } from '../types';

const MAX_MATCHES = 50;

const COMPILED = TACTICS.map((tactic) => ({
	code: tactic.code,
	pattern: new RegExp(`(?:^|[^a-z0-9])(${tactic.patterns.join('|')})(?![a-z0-9])`, 'g')
}));

export function foldText(text: string): string {
	return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function analyzeText(input: string): Finding[] {
	const text = input.slice(0, LIMITS.inputChars);
	const folded = foldText(text);
	const aligned = folded.length === text.length;
	const out: Finding[] = [];

	for (const { code, pattern } of COMPILED) {
		let start = -1;
		let end = -1;
		let phrase = '';
		let count = 0;
		for (const match of folded.matchAll(pattern)) {
			count++;
			if (count === 1) {
				const found = match[1] ?? '';
				end = match.index + match[0].length;
				start = end - found.length;
				phrase = aligned ? text.slice(start, end) : found;
			}
			if (count >= MAX_MATCHES) break;
		}
		if (count === 0) continue;
		out.push(
			finding(code, {
				phrase: phrase.slice(0, 160),
				start: aligned ? String(start) : '',
				end: aligned ? String(end) : '',
				count: String(count)
			})
		);
	}

	return out;
}
