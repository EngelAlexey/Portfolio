import { KNOWN_TLDS } from '../data/tlds';
import { LIMITS } from '../limits';
import type { MessageLink } from '../types';

export type Extracted = { readonly links: readonly MessageLink[]; readonly truncated: boolean };

const EXPLICIT = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const SCHEMES =
	/\b(?:javascript|vbscript|data|file|ms-msdt|search-ms|ms-officecmd|ms-appinstaller|itms-services|intent):[^\s<>"'`]+/gi;
const BARE = /(^|[^\w@.:/-])((?:[a-z0-9-]+\.)+([a-z]{2,24}))(?::\d{2,5})?(?:[/?#][^\s<>"'`]*)?/gi;

export function refang(text: string): string {
	return text
		.replace(/\bhxxp(s?):\/\//gi, 'http$1://')
		.replace(/\[\.\]|\(\.\)|\{\.\}/g, '.')
		.replace(/\[:\]/g, ':');
}

function count(value: string, character: string): number {
	let total = 0;
	for (const current of value) if (current === character) total++;
	return total;
}

function trimTail(value: string): string {
	let end = value.length;
	while (end > 0) {
		const last = value.charAt(end - 1);
		const head = value.slice(0, end);
		if ('.,;:!?\'"»}>'.includes(last)) {
			end--;
			continue;
		}
		if (last === ')' && count(head, ')') > count(head, '(')) {
			end--;
			continue;
		}
		if (last === ']' && count(head, ']') > count(head, '[')) {
			end--;
			continue;
		}
		break;
	}
	return value.slice(0, end);
}

function normalise(raw: string): string {
	if (/^www\./i.test(raw)) return `https://${raw}`;
	if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
	return `https://${raw}`;
}

export function extractLinks(input: string): Extracted {
	const text = refang(input.slice(0, LIMITS.inputChars));
	const found: string[] = [];
	let masked = text;

	for (const pattern of [EXPLICIT, SCHEMES]) {
		pattern.lastIndex = 0;
		for (const match of text.matchAll(pattern)) {
			const value = trimTail(match[0]);
			if (value.length > 3) found.push(value);
			masked = masked.replace(match[0], ' '.repeat(match[0].length));
		}
	}

	for (const match of masked.matchAll(BARE)) {
		const tld = (match[3] ?? '').toLowerCase();
		if (!KNOWN_TLDS.has(tld)) continue;
		const prefix = (match[1] ?? '').length;
		if (masked.charAt(match.index + match[0].length) === '@') continue;
		const value = trimTail(match[0].slice(prefix));
		if (value.length > 3) found.push(value);
	}

	const seen = new Set<string>();
	const links: MessageLink[] = [];
	for (const raw of found) {
		const href = normalise(raw).slice(0, LIMITS.urlChars);
		if (seen.has(href)) continue;
		seen.add(href);
		links.push({ href, text: null });
	}

	return { links: links.slice(0, LIMITS.links), truncated: links.length > LIMITS.links };
}
