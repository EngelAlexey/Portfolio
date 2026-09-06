#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const OUT = join(root, 'public', 'img');
const PHOTO = join(OUT, 'alex.jpg');

const PAPER = '#fafaf9';
const INK = '#1c1c21';
const INK_MUTED = '#65656e';
const LINE = '#e5e4e2';
const SEGURIDAD = '#b03a2a';

const COPY = {
	es: {
		name: 'Alex Herrera Manzanares',
		role: 'Desarrollador de Software · Enfoque en Ciberseguridad',
		line: 'Diseño la seguridad antes de escribir el código.',
		place: 'Costa Rica'
	},
	en: {
		name: 'Alex Herrera Manzanares',
		role: 'Software Developer · Cybersecurity focus',
		line: 'I design the security before writing the code.',
		place: 'Costa Rica'
	}
};

/** @param {string} s */
const escape = (s) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function photoHref() {
	if (!existsSync(PHOTO)) return null;
	return `data:image/jpeg;base64,${readFileSync(PHOTO).toString('base64')}`;
}

/** @param {'es' | 'en'} lang */
function card(lang) {
	const t = COPY[lang];
	const photo = photoHref();
	const textX = photo ? 300 : 96;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="1200" height="8" fill="${SEGURIDAD}"/>
  <rect x="${textX}" y="180" width="64" height="2" fill="${LINE}"/>
  ${
		photo
			? `<clipPath id="c"><rect x="96" y="215" width="160" height="160" rx="18"/></clipPath>
  <image href="${photo}" x="96" y="215" width="160" height="160" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/>
  <rect x="96" y="215" width="160" height="160" rx="18" fill="none" stroke="${LINE}" stroke-width="2"/>`
			: ''
	}
  <text x="${textX}" y="150" font-family="Geist, Segoe UI, Helvetica, Arial, sans-serif" font-size="26" font-weight="500" letter-spacing="3" fill="${SEGURIDAD}">${escape(
		t.place.toUpperCase()
	)}</text>
  <text x="${textX}" y="256" font-family="Geist, Segoe UI, Helvetica, Arial, sans-serif" font-size="62" font-weight="600" fill="${INK}">${escape(
		t.name
	)}</text>
  <text x="${textX}" y="312" font-family="Geist, Segoe UI, Helvetica, Arial, sans-serif" font-size="30" font-weight="400" fill="${INK_MUTED}">${escape(
		t.role
	)}</text>
  <text x="${textX}" y="420" font-family="Geist, Segoe UI, Helvetica, Arial, sans-serif" font-size="40" font-weight="500" fill="${INK}">${escape(
		t.line
	)}</text>
</svg>`;
}

const touchIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="180" height="180">
  <rect width="32" height="32" rx="7" fill="#17171c"/>
  <path d="M9.4 23 15 9h2.4l5.6 14h-2.9l-1.3-3.5h-5.6L11.9 23H9.4zm4.7-5.8h4l-2-5.4-2 5.4z" fill="#fafaf9"/>
</svg>`;

/**
 * @param {string} svg
 * @param {number} width
 * @param {string} file
 */
function render(svg, width, file) {
	const png = new Resvg(svg, {
		fitTo: { mode: 'width', value: width },
		font: { loadSystemFonts: true }
	})
		.render()
		.asPng();
	writeFileSync(join(OUT, file), png);
	console.log(`[og] ${file} — ${(png.length / 1024).toFixed(0)} KB`);
}

mkdirSync(OUT, { recursive: true });
render(card('es'), 1200, 'og-es.png');
render(card('en'), 1200, 'og-en.png');
render(touchIcon, 180, 'apple-touch-icon.png');
console.log(photoHref() ? '[og] photo composited' : '[og] no public/img/alex.jpg — cards drawn without it');
