import { finding } from '../codes';
import { LIMITS } from '../limits';
import type { Finding, MessageLink } from '../types';
import { isRemote, shownTarget } from './remote';

export type RtfReport = {
	readonly findings: Finding[];
	readonly links: MessageLink[];
};

const OBJECT = /\\(?:objdata|objemb|objlink|objautlink)(?![a-zA-Z])/i;
const TEMPLATE = /\{\\\*\\template\s+([^}\r\n]{1,2048})\}/gi;
const HYPERLINK = /HYPERLINK\s+"([^"\r\n]{1,2048})"/gi;
const MAX_REPORTED = 3;

export function inspectRtf(bytes: Uint8Array): RtfReport {
	const text = new TextDecoder('latin1').decode(bytes);
	const findings: Finding[] = [];
	const links: MessageLink[] = [];
	const seen = new Set<string>();
	const add = (href: string): void => {
		const target = href.trim();
		if (target === '' || seen.has(target) || links.length >= LIMITS.links) return;
		seen.add(target);
		links.push({ href: target, text: null });
	};

	if (OBJECT.test(text)) findings.push(finding('file-rtf-object'));

	let templates = 0;
	for (const match of text.matchAll(TEMPLATE)) {
		const target = (match[1] ?? '').trim();
		if (!isRemote(target)) continue;
		if (/^https?:/i.test(target)) add(target);
		if (templates++ < MAX_REPORTED) findings.push(finding('file-external-template', { target: shownTarget(target) }));
	}
	for (const match of text.matchAll(HYPERLINK)) add(match[1] ?? '');

	return { findings, links };
}
