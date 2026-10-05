import { finding } from '../codes';
import { LIMITS } from '../limits';
import type { Finding, MessageLink } from '../types';
import { inflate } from './inflate';

export type PdfReport = {
	readonly findings: Finding[];
	readonly links: MessageLink[];
};

type Marks = {
	javascript: boolean;
	launch: boolean;
	embedded: boolean;
	encrypted: boolean;
};

const NAME = /\/([^\s/[\]<>(){}%]+)/g;
const LITERAL_URI = /\/URI\s*\(((?:\\[\s\S]|[^\\)]){1,2048})\)/g;
const HEX_URI = /\/URI\s*<([0-9a-fA-F\s]{2,4096})>/g;
const BEFORE_KIND = /\/(?:s|type)\s*$/;
const ESCAPES: Readonly<Record<string, string>> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
const AFTER_VALUE = /^\s*(?:\d+\s+\d+\s+R(?![a-zA-Z])|<<|\[)/;
const FILTER = /\/Filter\s*(\[[^\]]{0,200}\]|\/[^\s/[\]<>(){}%]+)/;
const DIRECT_LENGTH = /\/Length\s+(\d+)(?!\s+\d+\s+R)/;
const OBJECT_STREAM = '/ObjStm';
const MAX_OBJECT_STREAMS = 20;
const STREAM_LIMIT = 8 * 1024 * 1024;
const DICTIONARY_REACH = 2000;
const MAX_URIS = LIMITS.links;

function decodeName(raw: string): string {
	return raw.replace(/#([0-9a-fA-F]{2})/g, (_whole, hex: string) => String.fromCharCode(Number.parseInt(hex, 16))).toLowerCase();
}

function unescapeString(raw: string): string {
	return raw
		.replace(/\\([0-7]{1,3})/g, (_whole, octal: string) => String.fromCharCode(Number.parseInt(octal, 8) & 0xff))
		.replace(/\\(\r\n|\r|\n)/g, '')
		.replace(/\\([nrtbf])/g, (_whole, code: string) => ESCAPES[code] ?? '')
		.replace(/\\([\s\S])/g, '$1');
}

function hexString(raw: string): string {
	const digits = raw.replace(/\s+/g, '');
	let out = '';
	for (let index = 0; index + 1 < digits.length; index += 2) out += String.fromCharCode(Number.parseInt(digits.slice(index, index + 2), 16));
	return out;
}

function scan(text: string, marks: Marks, uris: string[]): void {
	for (const match of text.matchAll(NAME)) {
		const name = decodeName(match[1] ?? '');
		if (name !== 'javascript' && name !== 'launch' && name !== 'embeddedfile' && name !== 'embeddedfiles' && name !== 'encrypt') continue;
		const index = match.index ?? 0;
		const before = decodeName(text.slice(Math.max(0, index - 16), index));
		const after = text.slice(index + match[0].length, index + match[0].length + 24);
		const typed = BEFORE_KIND.test(before) || AFTER_VALUE.test(after);
		if (name === 'encrypt') {
			if (AFTER_VALUE.test(after)) marks.encrypted = true;
		} else if (typed) {
			if (name === 'javascript') marks.javascript = true;
			else if (name === 'launch') marks.launch = true;
			else marks.embedded = true;
		}
	}
	for (const match of text.matchAll(LITERAL_URI)) {
		if (uris.length < MAX_URIS) uris.push(unescapeString(match[1] ?? ''));
	}
	for (const match of text.matchAll(HEX_URI)) {
		if (uris.length < MAX_URIS) uris.push(hexString(match[1] ?? ''));
	}
}

function streamAfter(text: string, from: number): { keyword: number; start: number; end: number } | null {
	let keyword = text.indexOf('stream', from);
	while (keyword >= 3 && text.startsWith('end', keyword - 3)) keyword = text.indexOf('stream', keyword + 6);
	if (keyword < 0 || keyword - from > DICTIONARY_REACH) return null;
	let start = keyword + 6;
	if (text.startsWith('\r\n', start)) start += 2;
	else if (text[start] === '\n' || text[start] === '\r') start += 1;
	const end = text.indexOf('endstream', start);
	return { keyword, start, end: end < 0 ? text.length : end };
}

export async function inspectPdf(bytes: Uint8Array): Promise<PdfReport> {
	const text = new TextDecoder('latin1').decode(bytes);
	const marks: Marks = { javascript: false, launch: false, embedded: false, encrypted: false };
	const uris: string[] = [];
	scan(text, marks, uris);

	let unreadable = false;
	let budget = LIMITS.inflatedBytes;
	let streams = 0;
	let from = 0;
	for (;;) {
		const at = text.indexOf(OBJECT_STREAM, from);
		if (at < 0) break;
		from = at + OBJECT_STREAM.length;
		const found = streamAfter(text, at);
		if (found === null) continue;
		if (streams >= MAX_OBJECT_STREAMS) {
			unreadable = true;
			break;
		}
		streams++;

		const dictionary = text.slice(Math.max(text.lastIndexOf('obj', at), 0), found.keyword);
		const filters = [...(FILTER.exec(dictionary)?.[1] ?? '').matchAll(NAME)].map((match) => decodeName(match[1] ?? ''));
		if (filters.length === 0) continue;
		if (filters.length !== 1 || (filters[0] !== 'flatedecode' && filters[0] !== 'fl')) {
			unreadable = true;
			continue;
		}

		const declared = Number(DIRECT_LENGTH.exec(dictionary)?.[1] ?? Number.NaN);
		const end = Number.isFinite(declared) && found.start + declared <= found.end ? found.start + declared : found.end;
		let data = bytes.subarray(found.start, end);
		while (data.length > 0 && (data[data.length - 1] === 0x0a || data[data.length - 1] === 0x0d)) data = data.subarray(0, data.length - 1);

		const inflated = await inflate(data, 'deflate', Math.min(STREAM_LIMIT, budget));
		if (inflated === null) {
			unreadable = true;
			continue;
		}
		budget -= inflated.length;
		scan(new TextDecoder('latin1').decode(inflated), marks, uris);
	}

	const findings: Finding[] = [];
	if (marks.javascript) findings.push(finding('file-pdf-javascript'));
	if (marks.launch) findings.push(finding('file-pdf-launch'));
	if (marks.embedded) findings.push(finding('file-pdf-embedded'));
	if (marks.encrypted || unreadable) findings.push(finding('file-parse-error'));

	const seen = new Set<string>();
	const links: MessageLink[] = [];
	for (const uri of uris) {
		const href = uri.trim();
		if (href === '' || seen.has(href) || links.length >= LIMITS.links) continue;
		seen.add(href);
		links.push({ href, text: null });
	}
	return { findings, links };
}
