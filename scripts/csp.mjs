// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { missingHashes, withPolicy } from './csp-lib.mjs';

const dist = process.argv[2] ?? 'dist';
const PAGES = ['es/herramientas/phishing.html', 'en/tools/phishing.html'];

let failed = false;

for (const page of PAGES) {
	const path = join(dist, page);
	if (!existsSync(path)) {
		console.error(`[csp] missing ${path}`);
		failed = true;
		continue;
	}
	const html = withPolicy(readFileSync(path, 'utf8'));
	const missing = missingHashes(html);
	if (missing.length > 0) {
		console.error(`[csp] ${page}: ${missing.length} inline script(s) without a hash`);
		failed = true;
		continue;
	}
	writeFileSync(path, html);
	console.log(`[csp] ${page}: policy written`);
}

if (failed) process.exit(1);
