#!/usr/bin/env node
import { copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CV_REPO = process.env.CV_SOURCE_DIR ?? 'D:/GitHub/Personal/CV';

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
