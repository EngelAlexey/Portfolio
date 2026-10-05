export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SectionId = 'links' | 'text' | 'sender' | 'headers' | 'files';

export type Finding = {
	readonly code: string;
	readonly section: SectionId;
	readonly severity: Severity;
	readonly evidence: Readonly<Record<string, string>>;
};

export type MessageLink = {
	readonly href: string;
	readonly text: string | null;
};
