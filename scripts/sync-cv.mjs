/**
 * Copies the CV PDFs out of the CV repo so the site can serve them, and keeps
 * the two projects independent: the portfolio never reads from that folder at
 * runtime, only at build time.
 *
 * Missing source is not an error — the site falls back to whatever is already
 * in `static/cv/`, and the contact page says when a language is unavailable.
 */
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const CV_REPO = process.env.CV_SOURCE_DIR ?? 'D:/GitHub/Personal/CV';

const FILES = [
	{
		from: `${CV_REPO}/CV - Alex Herrera Manzanares (2 paginas).pdf`,
		to: resolve(root, 'static/cv/CV-Alex-Herrera-Manzanares-es.pdf')
	},
	{
		from: `${CV_REPO}/CV - Alex Herrera Manzanares (EN).pdf`,
		to: resolve(root, 'static/cv/CV-Alex-Herrera-Manzanares-en.pdf')
	}
];

const exists = async (path) =>
	stat(path).then(
		() => true,
		() => false
	);

for (const file of FILES) {
	if (!(await exists(file.from))) {
		console.warn(`[sync-cv] skipped, source not found: ${file.from}`);
		continue;
	}
	await mkdir(dirname(file.to), { recursive: true });
	await copyFile(file.from, file.to);
	console.log(`[sync-cv] ${file.to.replace(root, '.')}`);
}
