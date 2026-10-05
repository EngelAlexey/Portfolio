import type { FileFacts } from './file/analyze-file';
import { analyzeHeaders } from './headers/rules';
import { LIMITS } from './limits';
import { analyzeSender } from './sender/rules';
import { analyzeText } from './text/rules';
import type { Finding, MessageLink, Severity } from './types';
import { extractLinks } from './url/extract';
import { analyzeLinks } from './url/rules';

export type MessageInput = {
	readonly text?: string;
	readonly links?: readonly MessageLink[];
	readonly sender?: string;
	readonly headers?: string;
};

export type Report = {
	readonly findings: readonly Finding[];
	readonly links: readonly MessageLink[];
	readonly truncated: boolean;
	readonly file?: FileFacts;
};

const ORDER: Readonly<Record<Severity, number>> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function sortFindings(findings: readonly Finding[]): Finding[] {
	return [...findings].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.code.localeCompare(b.code));
}

function key(href: string): string {
	try {
		return new URL(href).href;
	} catch {
		return href;
	}
}

function mergeLinks(given: readonly MessageLink[], found: readonly MessageLink[]): MessageLink[] {
	const seen = new Set<string>();
	const out: MessageLink[] = [];
	for (const link of [...given, ...found]) {
		const id = key(link.href);
		if (seen.has(id)) continue;
		seen.add(id);
		out.push(link);
	}
	return out;
}

export function analyzeMessage(input: MessageInput): Report {
	const text = (input.text ?? '').slice(0, LIMITS.inputChars);
	const extracted = extractLinks(text);
	const merged = mergeLinks(input.links ?? [], extracted.links);
	const links = merged.slice(0, LIMITS.links);

	const findings = sortFindings([
		...analyzeLinks(links),
		...analyzeText(text),
		...(input.sender === undefined || input.sender.trim() === '' ? [] : analyzeSender(input.sender)),
		...(input.headers === undefined || input.headers.trim() === '' ? [] : analyzeHeaders(input.headers))
	]);

	return { findings, links, truncated: extracted.truncated || merged.length > LIMITS.links };
}
