import { finding } from '../codes';
import {
	DISK_EXTENSIONS,
	DOCUMENT_EXTENSIONS,
	EXECUTABLE_EXTENSIONS,
	EXPECTED_KINDS,
	SCRIPT_EXTENSIONS,
	SHORTCUT_EXTENSIONS
} from '../data/files';
import type { Finding } from '../types';
import type { Kind } from './sniff';

const BIDI = /[‎‏‪-‮⁦-⁩]/g;
const MAX_NAME = 200;
const MAX_NAME_CHECK = 300;
const TEXTUAL: ReadonlySet<string> = new Set(['text', 'html', 'svg']);

export function displayName(name: string): string {
	const shown = name.replace(BIDI, (character) => `[U+${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}]`);
	return shown.length > MAX_NAME ? `${shown.slice(0, MAX_NAME)}…` : shown;
}

export function extensionOf(name: string): string {
	const index = name.lastIndexOf('.');
	return index < 0 ? '' : name.slice(index + 1).trim().toLowerCase();
}

function previousExtension(name: string): string {
	const parts = name.split('.');
	return parts.length < 3 ? '' : (parts.at(-2) ?? '').trim().toLowerCase();
}

export function nameFindings(full: string, kind: Kind): Finding[] {
	const name = full.length > MAX_NAME_CHECK ? `${full.slice(0, MAX_NAME_CHECK / 2)}${full.slice(-MAX_NAME_CHECK / 2)}` : full;
	const out: Finding[] = [];
	const extension = extensionOf(name);
	const evidence = { name: displayName(name), extension, detected: kind };

	if (BIDI.test(name)) out.push(finding('file-rtlo', { name: displayName(name) }));
	BIDI.lastIndex = 0;

	const dangerous = EXECUTABLE_EXTENSIONS.has(extension) || SCRIPT_EXTENSIONS.has(extension) || SHORTCUT_EXTENSIONS.has(extension);
	const hidden = /\s{5,}\.[a-z0-9]+$/i.test(name);
	if (dangerous && (DOCUMENT_EXTENSIONS.has(previousExtension(name)) || hidden)) {
		out.push(finding('file-double-extension', evidence));
	}

	if (EXECUTABLE_EXTENSIONS.has(extension) || kind === 'pe' || kind === 'elf' || kind === 'macho') {
		out.push(finding('file-executable', evidence));
	}
	if (SCRIPT_EXTENSIONS.has(extension)) out.push(finding('file-script', evidence));
	if (SHORTCUT_EXTENSIONS.has(extension) || kind === 'lnk') out.push(finding('file-shortcut', evidence));
	if (DISK_EXTENSIONS.has(extension) || kind === 'iso') out.push(finding('file-disk-image', evidence));

	const expected = EXPECTED_KINDS[extension];
	if (expected !== undefined && kind !== 'unknown' && !expected.includes(kind)) {
		const compatible = expected.every((value) => TEXTUAL.has(value)) && TEXTUAL.has(kind);
		if (!compatible) out.push(finding('file-type-mismatch', evidence));
	}

	return out;
}
