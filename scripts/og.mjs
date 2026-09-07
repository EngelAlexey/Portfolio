#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const OUT = join(process.cwd(), 'public', 'img');

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
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
	writeFileSync(join(OUT, file), png);
	console.log(`[og] ${file} — ${(png.length / 1024).toFixed(0)} KB`);
}

mkdirSync(OUT, { recursive: true });
render(touchIcon, 180, 'apple-touch-icon.png');
render(touchIcon, 96, 'favicon-96.png');
