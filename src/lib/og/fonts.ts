import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FAMILY = 'Geist';
export const REGULAR = 400;
export const SEMIBOLD = 600;

const DIR = join(process.cwd(), 'scripts', 'fonts');

export const fontFiles = (): string[] => [
	join(DIR, 'Geist-Regular.ttf'),
	join(DIR, 'Geist-SemiBold.ttf')
];

type Metrics = { unitsPerEm: number; advance: (codePoint: number) => number };

/**
 * Real advances out of the font's own tables. Estimating them would be fine until
 * the first 54-character title silently ran off the card, and the card is the one
 * artefact nobody looks at after it ships.
 */
function readMetrics(file: string): Metrics {
	const buf = readFileSync(file);
	const tables = new Map<string, number>();
	const numTables = buf.readUInt16BE(4);
	for (let i = 0; i < numTables; i++) {
		const rec = 12 + i * 16;
		tables.set(buf.toString('ascii', rec, rec + 4), buf.readUInt32BE(rec + 8));
	}

	const head = tables.get('head');
	const hhea = tables.get('hhea');
	const hmtx = tables.get('hmtx');
	const cmap = tables.get('cmap');
	if (head === undefined || hhea === undefined || hmtx === undefined || cmap === undefined) {
		throw new Error(`[og] ${file} is missing a required table`);
	}

	const unitsPerEm = buf.readUInt16BE(head + 18);
	const numHMetrics = buf.readUInt16BE(hhea + 34);

	const advanceOf = (glyph: number): number => {
		const i = Math.min(glyph, numHMetrics - 1);
		return buf.readUInt16BE(hmtx + i * 4);
	};

	// Prefer a full-Unicode subtable, fall back to the BMP one.
	let best = 0;
	let bestScore = -1;
	const numSub = buf.readUInt16BE(cmap + 2);
	for (let i = 0; i < numSub; i++) {
		const rec = cmap + 4 + i * 8;
		const offset = cmap + buf.readUInt32BE(rec + 4);
		const format = buf.readUInt16BE(offset);
		const score = format === 12 ? 2 : format === 4 ? 1 : 0;
		if (score > bestScore) {
			bestScore = score;
			best = offset;
		}
	}
	if (bestScore <= 0) throw new Error(`[og] ${file} has no usable cmap subtable`);

	const format = buf.readUInt16BE(best);
	const lookup =
		format === 12
			? (cp: number): number => {
					const groups = buf.readUInt32BE(best + 12);
					for (let i = 0; i < groups; i++) {
						const g = best + 16 + i * 12;
						const start = buf.readUInt32BE(g);
						const end = buf.readUInt32BE(g + 4);
						if (cp >= start && cp <= end) return buf.readUInt32BE(g + 8) + (cp - start);
					}
					return 0;
				}
			: (cp: number): number => {
					if (cp > 0xffff) return 0;
					const segX2 = buf.readUInt16BE(best + 6);
					const ends = best + 14;
					const starts = ends + segX2 + 2;
					const deltas = starts + segX2;
					const ranges = deltas + segX2;
					for (let s = 0; s < segX2; s += 2) {
						if (buf.readUInt16BE(ends + s) < cp) continue;
						if (buf.readUInt16BE(starts + s) > cp) return 0;
						const rangeOffset = buf.readUInt16BE(ranges + s);
						if (rangeOffset === 0) {
							return (cp + buf.readInt16BE(deltas + s)) & 0xffff;
						}
						const at = ranges + s + rangeOffset + (cp - buf.readUInt16BE(starts + s)) * 2;
						const glyph = buf.readUInt16BE(at);
						return glyph === 0 ? 0 : (glyph + buf.readInt16BE(deltas + s)) & 0xffff;
					}
					return 0;
				};

	const cache = new Map<number, number>();
	return {
		unitsPerEm,
		advance: (cp) => {
			let width = cache.get(cp);
			if (width === undefined) {
				width = advanceOf(lookup(cp));
				cache.set(cp, width);
			}
			return width;
		}
	};
}

let CACHE: Record<number, Metrics> | null = null;

const metrics = (weight: number): Metrics => {
	if (!CACHE) {
		const [regular, semibold] = fontFiles();
		CACHE = { [REGULAR]: readMetrics(regular), [SEMIBOLD]: readMetrics(semibold) };
	}
	return CACHE[weight >= 500 ? SEMIBOLD : REGULAR];
};

/** Width of `value` in px when set at `size` px. */
export function measure(value: string, size: number, weight = REGULAR): number {
	const font = metrics(weight);
	let units = 0;
	for (const char of value) units += font.advance(char.codePointAt(0) ?? 32);
	return (units / font.unitsPerEm) * size;
}
