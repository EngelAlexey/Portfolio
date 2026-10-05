export const LIMITS = {
	inputChars: 200_000,
	links: 200,
	urlChars: 2_048,
	fileBytes: 25 * 1024 * 1024,
	inflatedRatio: 100,
	inflatedBytes: 100 * 1024 * 1024,
	archiveEntries: 1_000,
	archiveDepth: 1,
	analysisMs: 10_000
} as const;
