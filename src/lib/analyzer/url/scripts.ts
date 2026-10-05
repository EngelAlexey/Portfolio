const SCRIPTS: readonly (readonly [string, RegExp])[] = [
	['latin', /\p{Script=Latin}/u],
	['cyrillic', /\p{Script=Cyrillic}/u],
	['greek', /\p{Script=Greek}/u],
	['armenian', /\p{Script=Armenian}/u],
	['cherokee', /\p{Script=Cherokee}/u]
];

export function isMixedScript(label: string): boolean {
	const found = new Set<string>();
	for (const character of label) {
		for (const [name, pattern] of SCRIPTS) {
			if (pattern.test(character)) found.add(name);
		}
	}
	return found.size > 1;
}
