#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const OUT = join(root, 'src', 'lib', 'lastmod.json');

/** @param {...string} args */
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

function isShallow() {
	try {
		return git('rev-parse', '--is-shallow-repository') === 'true';
	} catch {
		return true;
	}
}

/** @param {string[]} files */
function lastCommit(files) {
	const dates = files
		.filter((file) => existsSync(join(root, file)))
		.map((file) => {
			try {
				return git('log', '-1', '--format=%cI', '--', file);
			} catch {
				return '';
			}
		})
		.filter(Boolean);

	return dates.sort().at(-1) ?? null;
}

if (isShallow()) {
	console.log('[lastmod] shallow clone — keeping the committed src/lib/lastmod.json');
	process.exit(0);
}

const I18N = ['src/lib/i18n/es.ts', 'src/lib/i18n/en.ts'];
const CONTENT = 'src/content/projects';

const PAGES = {
	home: ['src/components/pages/Home.astro', 'src/lib/about.ts', CONTENT, ...I18N],
	projects: ['src/components/pages/Projects.astro', CONTENT, ...I18N],
	about: ['src/components/pages/About.astro', 'src/lib/about.ts', ...I18N],
	contact: ['src/components/pages/Contact.astro', 'src/lib/site.ts', ...I18N]
};

/** @type {Record<string, string>} */
const map = {};

for (const [key, files] of Object.entries(PAGES)) {
	const date = lastCommit(files);
	if (date) map[key] = date;
}

const contentDir = join(root, 'src', 'content', 'projects');
for (const slug of readdirSync(contentDir, { withFileTypes: true })) {
	if (!slug.isDirectory()) continue;
	const files = readdirSync(join(contentDir, slug.name)).map(
		(file) => `src/content/projects/${slug.name}/${file}`
	);
	const date = lastCommit(files);
	if (date) map[`project:${slug.name}`] = date;
}

writeFileSync(OUT, JSON.stringify(map, null, '\t') + '\n');
console.log(`[lastmod] ${Object.keys(map).length} entries`);
