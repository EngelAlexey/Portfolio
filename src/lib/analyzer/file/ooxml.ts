import { finding } from '../codes';
import { LIMITS } from '../limits';
import type { Finding, MessageLink } from '../types';
import { defang } from '../url/defang';
import { readEntry, type ZipEntry, type ZipListing } from './zip';

export type OfficeFamily = 'word' | 'excel' | 'powerpoint';

export type OoxmlReport = {
	readonly family: OfficeFamily | null;
	readonly findings: Finding[];
	readonly links: MessageLink[];
};

type Relationship = {
	readonly type: string;
	readonly target: string;
	readonly external: boolean;
};

const RELS_LIMIT = 1024 * 1024;
const XML_LIMIT = 8 * 1024 * 1024;
const MAX_RELS_FILES = 100;
const MAX_RELATIONSHIPS = 500;
const MAX_LINK_PARTS = 20;
const MAX_REPORTED = 3;
const MAX_SHOWN = 200;
const REMOTE = /^(?:(?:https?|ftps?|smb|webdav|dav|file):\/\/[^/]|\\\\|\/\/)/i;
const DDE_FIELD = /(?:w:instr\s*=\s*["']|<w:instrText[^>]*>)\s*(?:DDEAUTO|DDE)\b/i;

function named(listing: ZipListing, wanted: string): ZipEntry | undefined {
	return listing.entries.find((entry) => entry.name.toLowerCase() === wanted.toLowerCase());
}

function unescapeXml(value: string): string {
	return value
		.replace(/&#(x[0-9a-f]+|\d+);/gi, (whole, code: string) => {
			const point = code.startsWith('x') || code.startsWith('X') ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10);
			return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : whole;
		})
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function relationships(xml: string): Relationship[] {
	const out: Relationship[] = [];
	for (const tag of xml.matchAll(/<Relationship\b[^>]*>/gi)) {
		if (out.length >= MAX_RELATIONSHIPS) break;
		const attributes = new Map<string, string>();
		for (const match of tag[0].matchAll(/([A-Za-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
			attributes.set((match[1] ?? '').toLowerCase(), unescapeXml(match[2] ?? match[3] ?? ''));
		}
		out.push({
			type: (attributes.get('type') ?? '').split('/').at(-1)?.toLowerCase() ?? '',
			target: (attributes.get('target') ?? '').trim().slice(0, LIMITS.urlChars),
			external: (attributes.get('targetmode') ?? '').toLowerCase() === 'external'
		});
	}
	return out;
}

function familyOf(names: readonly string[]): OfficeFamily | null {
	if (names.some((name) => /^word\//i.test(name))) return 'word';
	if (names.some((name) => /^xl\//i.test(name))) return 'excel';
	if (names.some((name) => /^ppt\//i.test(name))) return 'powerpoint';
	return null;
}

function shown(target: string): string {
	const text = defang(target);
	return text.length > MAX_SHOWN ? `${text.slice(0, MAX_SHOWN)}…` : text;
}

export async function inspectOoxml(bytes: Uint8Array, listing: ZipListing): Promise<OoxmlReport | null> {
	if (named(listing, '[Content_Types].xml') === undefined) return null;

	const names = listing.entries.map((entry) => entry.name);
	const findings: Finding[] = [];
	const links: MessageLink[] = [];
	let budget = LIMITS.inflatedBytes;

	const read = async (entry: ZipEntry, limit: number): Promise<string | null> => {
		const data = await readEntry(bytes, entry, Math.min(limit, budget));
		if (data === null) return null;
		budget -= data.length;
		return new TextDecoder().decode(data);
	};

	const macro = names.find((name) => /(?:^|\/)vbaproject\.bin$|^xl\/macrosheets\//i.test(name));
	if (macro !== undefined) findings.push(finding('file-macro', { part: macro }));

	const embedded = names.filter((name) => /(?:^|\/)embeddings\/[^/]+$/i.test(name));
	if (embedded.length > 0) {
		const part = embedded.slice(0, MAX_REPORTED).join(', ') + (embedded.length > MAX_REPORTED ? '…' : '');
		findings.push(finding('file-embedded-object', { part }));
	}

	const document = named(listing, 'word/document.xml');
	const xml = document === undefined ? null : await read(document, XML_LIMIT);
	let dde = xml !== null && DDE_FIELD.test(xml);
	if (!dde) {
		const parts = listing.entries.filter((entry) => /^xl\/externalLinks\/[^/]+\.xml$/i.test(entry.name)).slice(0, MAX_LINK_PARTS);
		for (const part of parts) {
			const content = await read(part, XML_LIMIT);
			if (content !== null && /<ddeLink\b/i.test(content)) {
				dde = true;
				break;
			}
		}
	}
	if (dde) findings.push(finding('file-dde', {}));

	const seen = new Set<string>();
	let templates = 0;
	let externals = 0;
	const parts = listing.entries.filter((entry) => /\.rels$/i.test(entry.name)).slice(0, MAX_RELS_FILES);
	for (const part of parts) {
		const content = await read(part, RELS_LIMIT);
		if (content === null) continue;
		for (const relationship of relationships(content)) {
			if (!relationship.external || relationship.target === '') continue;
			if (relationship.type === 'hyperlink') {
				if (!seen.has(relationship.target) && links.length < LIMITS.links) {
					seen.add(relationship.target);
					links.push({ href: relationship.target, text: null });
				}
				continue;
			}
			if (!REMOTE.test(relationship.target)) continue;
			if (/^https?:/i.test(relationship.target) && !seen.has(relationship.target) && links.length < LIMITS.links) {
				seen.add(relationship.target);
				links.push({ href: relationship.target, text: null });
			}
			if (relationship.type === 'attachedtemplate') {
				if (templates++ < MAX_REPORTED) findings.push(finding('file-external-template', { target: shown(relationship.target) }));
			} else if (externals++ < MAX_REPORTED) {
				findings.push(finding('file-external-link', { target: shown(relationship.target) }));
			}
		}
	}

	return { family: familyOf(names), findings, links };
}
