#!/usr/bin/env node
/**
 * Copies the built CV PDFs out of the CV repo and into `public/cv/`.
 *
 * Astro serves `public/`, and the deploy host has no access to the CV repo, so
 * the PDFs are committed here. This runs on `prebuild` to keep them current.
 *
 * Two different situations, deliberately handled differently:
 *
 * - The CV repo is not on this machine at all — a build server, a fresh clone.
 *   Nothing to sync, so trust the committed PDFs and carry on. Failing here
 *   would mean the site could only ever be built from one laptop.
 * - The CV repo is here but a PDF is missing. That is a real problem: the
 *   previous version only warned, and because the source filenames had been
 *   renamed months earlier, the site quietly shipped a stale PDF for weeks. A
 *   build that can reach the source and still cannot produce the real document
 *   should not produce a site.
 */
import { copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CV_REPO = process.env.CV_SOURCE_DIR ?? 'D:/GitHub/Personal/CV';

/** `<variant>-<lang>` → the exact filename `build-pdf.mjs` writes. */
const FILES = [
	['ciberseguridad-es', 'Alex Herrera Manzanares - CV Ciberseguridad.pdf'],
	['ciberseguridad-en', 'Alex Herrera Manzanares - CV Cybersecurity (EN).pdf'],
	['desarrollo-es', 'Alex Herrera Manzanares - CV Desarrollo.pdf'],
	['desarrollo-en', 'Alex Herrera Manzanares - CV Development (EN).pdf'],
	['general-es', 'Alex Herrera Manzanares - CV General.pdf'],
	['general-en', 'Alex Herrera Manzanares - CV General (EN).pdf']
];

/** @param {string} path */
const exists = async (path) =>
	access(path).then(
		() => true,
		() => false
	);

if (!(await exists(CV_REPO))) {
	console.log(
		`[sync-cv] ${CV_REPO} not reachable — keeping the ${FILES.length} PDFs committed in public/cv/.`
	);
	process.exit(0);
}

const missing = [];

for (const [key, sourceName] of FILES) {
	const from = `${CV_REPO}/${sourceName}`;
	const to = resolve(root, `public/cv/CV-Alex-Herrera-Manzanares-${key}.pdf`);

	if (!(await exists(from))) {
		missing.push(sourceName);
		continue;
	}

	await mkdir(dirname(to), { recursive: true });
	await copyFile(from, to);
	console.log(`[sync-cv] ${key}`);
}

if (missing.length) {
	console.error(
		`\n[sync-cv] ${missing.length} CV(s) not found in ${CV_REPO}:\n` +
			missing.map((name) => `  · ${name}`).join('\n') +
			`\n\nRun \`node build-pdf.mjs\` in the CV repo, or set CV_SOURCE_DIR.\n`
	);
	process.exit(1);
}

console.log(`[sync-cv] ${FILES.length} CVs in sync`);
