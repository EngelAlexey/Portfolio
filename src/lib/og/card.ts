import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { FAMILY, REGULAR, SEMIBOLD, fontFiles, measure } from './fonts';
import { palette } from './palette';
import { fitHeading, wrap } from './text';
import { OG_CARD } from './paths';
import { areaChips, type CardSpec } from './specs';

const PAD = 96;
const PHOTO = join(process.cwd(), 'public', 'img', 'alex.jpg');

const escape = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const font = (size: number, weight: number, fill: string, extra = '') =>
	`font-family="${FAMILY}" font-size="${size}" font-weight="${weight}" fill="${fill}"${extra}`;

let photoHref: string | null | undefined;

function portrait(): string | null {
	if (photoHref === undefined) {
		photoHref = existsSync(PHOTO)
			? `data:image/jpeg;base64,${readFileSync(PHOTO).toString('base64')}`
			: null;
	}
	return photoHref;
}

export function cardSvg(spec: CardSpec): string {
	const colors = palette(spec.theme);
	const accent = spec.accent === 'brand' ? colors.area.seguridad : colors.area[spec.accent];
	const photo = spec.portrait ? portrait() : null;

	const x = photo ? 300 : PAD;
	const column = OG_CARD.width - x - PAD;

	const heading = fitHeading(spec.heading, column, 2);
	const metaLines = spec.meta ? wrap(spec.meta, 28, REGULAR, column).slice(0, 2) : [];

	let y = 258;
	const body: string[] = [];

	for (const line of heading.lines) {
		body.push(
			`<text x="${x}" y="${y}" ${font(heading.size, SEMIBOLD, colors.ink)}>${escape(line)}</text>`
		);
		y += Math.round(heading.size * 1.18);
	}

	y += 14;
	for (const line of metaLines) {
		body.push(`<text x="${x}" y="${y}" ${font(28, REGULAR, colors.inkMuted)}>${escape(line)}</text>`);
		y += 38;
	}

	const chips = areaChips(spec);
	if (chips.length) {
		let chipX = x;
		const chipY = Math.max(y + 10, OG_CARD.height - 158);
		for (const chip of chips) {
			const width = Math.round(measure(chip.label, 24, REGULAR) + 40);
			const swatch = colors.area[chip.id];
			body.push(
				`<rect x="${chipX}" y="${chipY}" width="${width}" height="44" rx="10" fill="${swatch.bg}" stroke="${swatch.line}" stroke-width="1.5"/>`,
				`<text x="${chipX + 20}" y="${chipY + 30}" ${font(24, REGULAR, swatch.fg)}>${escape(chip.label)}</text>`
			);
			chipX += width + 14;
		}
	}

	const footY = OG_CARD.height - 66;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD.width}" height="${OG_CARD.height}" viewBox="0 0 ${OG_CARD.width} ${OG_CARD.height}">
  <rect width="${OG_CARD.width}" height="${OG_CARD.height}" fill="${colors.paper}"/>
  <rect x="0" y="0" width="${OG_CARD.width}" height="8" fill="${accent.fg}"/>
  <text x="${x}" y="150" ${font(26, SEMIBOLD, accent.fg, ' letter-spacing="3"')}>${escape(spec.eyebrow)}</text>
  <rect x="${x}" y="180" width="64" height="2" fill="${colors.line}"/>
  ${
		photo
			? `<clipPath id="portrait"><rect x="${PAD}" y="215" width="160" height="160" rx="18"/></clipPath>
  <image href="${photo}" x="${PAD}" y="215" width="160" height="160" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)"/>
  <rect x="${PAD}" y="215" width="160" height="160" rx="18" fill="none" stroke="${colors.line}" stroke-width="2"/>`
			: ''
	}
  ${body.join('\n  ')}
  <rect x="${PAD}" y="${footY - 34}" width="${OG_CARD.width - PAD * 2}" height="1" fill="${colors.line}"/>
  <text x="${PAD}" y="${footY}" ${font(26, REGULAR, colors.inkMuted)}>${escape(spec.footer)}</text>
</svg>`;
}

export function renderCard(spec: CardSpec): Buffer {
	return new Resvg(cardSvg(spec), {
		fitTo: { mode: 'width', value: OG_CARD.width },
		font: { loadSystemFonts: false, fontFiles: fontFiles(), defaultFontFamily: FAMILY }
	})
		.render()
		.asPng();
}
