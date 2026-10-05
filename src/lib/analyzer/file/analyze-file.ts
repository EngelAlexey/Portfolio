import { finding } from '../codes';
import { LIMITS } from '../limits';
import type { Finding, MessageLink } from '../types';
import { sha256Hex } from './hash';
import { displayName, nameFindings } from './name';
import { detectKind, type Kind } from './sniff';

export type FileFacts = {
	readonly name: string;
	readonly size: number;
	readonly kind: Kind | null;
	readonly sha256: string | null;
};

export type FileAnalysis = {
	readonly facts: FileFacts;
	readonly findings: readonly Finding[];
	readonly links: readonly MessageLink[];
};

export function tooLarge(name: string, size: number): FileAnalysis {
	return {
		facts: { name: displayName(name), size, kind: null, sha256: null },
		findings: [finding('file-too-large', { name: displayName(name), size: String(size), limit: String(LIMITS.fileBytes) })],
		links: []
	};
}

export async function analyzeFile(name: string, bytes: Uint8Array): Promise<FileAnalysis> {
	if (bytes.length > LIMITS.fileBytes) return tooLarge(name, bytes.length);

	const kind = detectKind(bytes);
	const sha256 = await sha256Hex(bytes);

	return {
		facts: { name: displayName(name), size: bytes.length, kind, sha256 },
		findings: nameFindings(name, kind),
		links: []
	};
}
