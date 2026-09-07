import { SEMIBOLD, measure } from './fonts';

/**
 * Seven of the fifteen ficha titles already split a name from a descriptor with a
 * pipe. Breaking there first keeps the two halves on their own lines instead of
 * wrapping mid-phrase.
 */
export function splitTitle(title: string): string[] {
	const parts = title.split('|').map((part) => part.trim());
	return parts.length > 1 ? parts.filter(Boolean) : [title.trim()];
}

export function wrap(value: string, size: number, weight: number, maxPx: number): string[] {
	const words = value.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';

	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (line && measure(next, size, weight) > maxPx) {
			lines.push(line);
			line = word;
		} else {
			line = next;
		}
	}
	if (line) lines.push(line);
	return lines;
}

const SIZES = [60, 52, 46, 40];

/**
 * Step the size down rather than squeezing glyphs: resvg honours `textLength` by
 * changing advances, which looks broken.
 */
export function fitHeading(
	title: string,
	maxPx: number,
	maxLines = 3
): { lines: string[]; size: number } {
	const halves = splitTitle(title);

	for (const size of SIZES) {
		const lines = halves.flatMap((half) => wrap(half, size, SEMIBOLD, maxPx));
		if (lines.length <= maxLines) return { lines, size };
	}

	const size = SIZES[SIZES.length - 1];
	return { lines: halves.flatMap((half) => wrap(half, size, SEMIBOLD, maxPx)).slice(0, maxLines), size };
}
