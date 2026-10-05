import { finding } from '../codes';
import { DISK_EXTENSIONS, EXECUTABLE_EXTENSIONS, SCRIPT_EXTENSIONS, SHORTCUT_EXTENSIONS } from '../data/files';
import type { Finding, MessageLink } from '../types';
import { normalizeName, readCfb } from './cfb';
import { extensionOf } from './name';
import { inspectOoxml } from './ooxml';
import type { Kind } from './sniff';
import { declaredSize, isBomb, readZip } from './zip';

export type Inspection = {
	readonly findings: Finding[];
	readonly links: MessageLink[];
	readonly office: boolean | null;
};

const MAX_REPORTED = 3;
const MACRO_NAMES: ReadonlySet<string> = new Set(['vba', '_vba_project', '_vba_project_cur', 'macros']);
const EMBEDDED_NAMES: ReadonlySet<string> = new Set(['objectpool', 'ole10native']);
const NOTHING: Inspection = { findings: [], links: [], office: null };

function megabytes(size: number): string {
	return `${Math.round(size / (1024 * 1024))} MB`;
}

function isProgram(name: string): boolean {
	const extension = extensionOf(name);
	return EXECUTABLE_EXTENSIONS.has(extension) || SCRIPT_EXTENSIONS.has(extension) || SHORTCUT_EXTENSIONS.has(extension) || DISK_EXTENSIONS.has(extension);
}

async function inspectZip(bytes: Uint8Array): Promise<Inspection> {
	const listing = readZip(bytes);
	if (listing === null) return { findings: [finding('file-parse-error')], links: [], office: null };

	const findings: Finding[] = [];
	if (listing.truncated) findings.push(finding('file-parse-error'));
	if (isBomb(listing, bytes.length)) {
		findings.push(finding('file-archive-bomb', { unpacked: megabytes(declaredSize(listing)), packed: megabytes(bytes.length) }));
	}

	const office = await inspectOoxml(bytes, listing);
	if (office !== null) return { findings: [...findings, ...office.findings], links: office.links, office: office.family !== null };

	if (listing.entries.some((entry) => entry.encrypted)) findings.push(finding('file-encrypted'));
	const programs = listing.entries.filter((entry) => isProgram(entry.name)).map((entry) => entry.name);
	if (programs.length > 0) {
		const names = programs.slice(0, MAX_REPORTED).join(', ') + (programs.length > MAX_REPORTED ? '…' : '');
		findings.push(finding('file-archive-executable-inside', { file: names }));
	}
	return { findings, links: [], office: false };
}

function inspectOle(bytes: Uint8Array): Inspection {
	const names = readCfb(bytes);
	if (names === null) return { findings: [finding('file-parse-error')], links: [], office: null };

	const found = new Set(names.map(normalizeName));
	const findings: Finding[] = [];
	if ([...MACRO_NAMES].some((name) => found.has(name))) findings.push(finding('file-macro'));
	if ([...EMBEDDED_NAMES].some((name) => found.has(name))) findings.push(finding('file-embedded-object'));
	if (found.has('encryptedpackage')) findings.push(finding('file-encrypted'));
	return { findings, links: [], office: null };
}

export async function inspect(kind: Kind, bytes: Uint8Array): Promise<Inspection> {
	if (kind === 'zip') return inspectZip(bytes);
	if (kind === 'ole') return inspectOle(bytes);
	return NOTHING;
}
