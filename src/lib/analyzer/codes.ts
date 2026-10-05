import codes from './codes.json';
import type { Finding, SectionId, Severity } from './types';

type CodeEntry = { readonly section: SectionId; readonly severity: Severity };

const FINDINGS: Readonly<Record<string, CodeEntry>> = codes.findings as Record<string, CodeEntry>;

export const FINDING_CODES: readonly string[] = Object.keys(FINDINGS);

export function finding(code: string, evidence: Readonly<Record<string, string>> = {}): Finding {
	const entry = FINDINGS[code];
	if (entry === undefined) throw new Error(`Unknown finding code: ${code}`);
	return { code, section: entry.section, severity: entry.severity, evidence };
}
