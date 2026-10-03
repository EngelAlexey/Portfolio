const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

export function createId(): string {
	const bytes = new Uint8Array(10);
	crypto.getRandomValues(bytes);
	let id = '';
	for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
	return id;
}

export function uniqueName(base: string, taken: Iterable<string>): string {
	const lower = new Set([...taken].map((name) => name.toLowerCase()));
	if (!lower.has(base.toLowerCase())) return base;
	let n = 2;
	while (lower.has(`${base}_${n}`.toLowerCase())) n++;
	return `${base}_${n}`;
}
