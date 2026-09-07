import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AREA_IDS, AREAS, type AreaId } from '../areas';

export type Swatch = { fg: string; bg: string; line: string };
export type Palette = {
	paper: string;
	ink: string;
	inkMuted: string;
	line: string;
	area: Record<AreaId, Swatch>;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
	const rad = (h * Math.PI) / 180;
	const a = c * Math.cos(rad);
	const b = c * Math.sin(rad);

	const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

	return [
		4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
		-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
		-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S
	];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

const encode = (v: number) =>
	v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(clamp01(v), 1 / 2.4) - 0.055;

const hex = (rgb: number[]) =>
	'#' +
	rgb
		.map((v) =>
			Math.round(clamp01(encode(v)) * 255)
				.toString(16)
				.padStart(2, '0')
		)
		.join('');

export function oklchToHex(l: number, c: number, h: number): string {
	let rgb = oklchToRgb(l, c, h);
	if (inGamut(rgb)) return hex(rgb);

	let lo = 0;
	let hi = c;
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2;
		rgb = oklchToRgb(l, mid, h);
		if (inGamut(rgb)) lo = mid;
		else hi = mid;
	}
	return hex(oklchToRgb(l, lo, h));
}

const OKLCH = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/;

let CACHE: Palette | null = null;

export function palette(): Palette {
	if (CACHE) return CACHE;

	const css = readFileSync(join(process.cwd(), 'src', 'app.css'), 'utf8');
	const start = css.indexOf(':root');
	const open = css.indexOf('{', start);
	const block = css.slice(open + 1, css.indexOf('}', open));

	const read = (name: string): string => {
		const line = block
			.split('\n')
			.find((l) => l.trim().startsWith(`--${name}:`));
		const match = line ? OKLCH.exec(line) : null;
		if (!match) throw new Error(`[og] src/app.css has no --${name} in :root`);
		return oklchToHex(Number(match[1]) / 100, Number(match[2]), Number(match[3]));
	};

	const area = Object.fromEntries(
		AREA_IDS.map((id) => {
			const token = AREAS[id].token;
			return [
				id,
				{
					fg: read(`area-${token}-fg`),
					bg: read(`area-${token}-bg`),
					line: read(`area-${token}-line`)
				}
			];
		})
	) as Record<AreaId, Swatch>;

	CACHE = {
		paper: read('paper'),
		ink: read('ink'),
		inkMuted: read('ink-muted'),
		line: read('line'),
		area
	};
	return CACHE;
}
