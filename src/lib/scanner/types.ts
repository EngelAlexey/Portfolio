export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SectionId = 'connection' | 'headers' | 'cookies' | 'content' | 'email';
export type UnreviewedStatus = 'error' | 'blocked' | 'not_applicable';

export type ScannerStrings = {
	readonly scanning: string;
	readonly done: string;
	readonly errors: Readonly<Record<string, string>>;
	readonly resultTitle: string;
	readonly copy: string;
	readonly copied: string;
	readonly copiedStatus: string;
	readonly copyError: string;
	readonly summaryOne: string;
	readonly summaryMany: string;
	readonly facts: {
		readonly status: string;
		readonly https: string;
		readonly redirectsOne: string;
		readonly redirectsMany: string;
		readonly headers: string;
		readonly time: string;
	};
	readonly redirects: string;
	readonly headersTitle: string;
	readonly lineOk: string;
	readonly missing: string;
	readonly notSent: string;
	readonly currentValue: string;
	readonly guide: string;
	readonly guides: Readonly<Record<string, string>>;
	readonly headerHints: Readonly<Record<string, string>>;
	readonly findingsTitle: string;
	readonly noFindings: string;
	readonly blockedPage: string;
	readonly passedTitle: string;
	readonly notesTitle: string;
	readonly sections: Readonly<Record<SectionId, string>>;
	readonly sectionStatus: Readonly<Record<UnreviewedStatus, string>>;
	readonly severity: Readonly<Record<Severity, string>>;
	readonly findings: Readonly<Record<string, string>>;
	readonly passed: Readonly<Record<string, string>>;
	readonly notes: Readonly<Record<string, string>>;
};

export type Finding = {
	readonly code: string;
	readonly evidence?: Readonly<Record<string, unknown>>;
};

export type Section = {
	readonly status: string;
	readonly findings: readonly Finding[];
	readonly passed: readonly string[];
	readonly notes: readonly string[];
};

export type Hop = {
	readonly url: string;
	readonly status: number;
	readonly location: string;
};

export type Scan = {
	readonly host: string;
	readonly displayHost: string;
	readonly finalUrl: string | null;
	readonly status: number | null;
	readonly hops: readonly Hop[];
	readonly headers: Readonly<Record<string, readonly string[]>>;
	readonly sections: Readonly<Partial<Record<SectionId, Section>>>;
};
