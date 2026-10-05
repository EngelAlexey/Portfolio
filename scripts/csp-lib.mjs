// @ts-check
import { createHash } from 'node:crypto';

const SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
const HEAD = /<head(\s[^>]*)?>/i;
const META = /<meta http-equiv="Content-Security-Policy"[^>]*>/i;

const ANALYTICS_SCRIPT = ['https://www.googletagmanager.com'];
const ANALYTICS_IMAGE = ['https://*.google-analytics.com', 'https://*.googletagmanager.com'];
const ANALYTICS_CONNECT = ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'];

/**
 * @param {string} attributes
 * @returns {boolean}
 */
function runsAsScript(attributes) {
	if (/\ssrc\s*=/i.test(` ${attributes}`)) return false;
	const type = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(` ${attributes}`)?.[1]?.toLowerCase();
	return type === undefined || type === 'module' || type === 'text/javascript' || type === 'application/javascript';
}

/**
 * @param {string} html
 * @returns {string[]}
 */
export function inlineScriptHashes(html) {
	/** @type {string[]} */
	const hashes = [];
	for (const match of html.matchAll(SCRIPT)) {
		if (!runsAsScript(match[1] ?? '')) continue;
		const body = match[2] ?? '';
		if (body.trim() === '') continue;
		const hash = `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
		if (!hashes.includes(hash)) hashes.push(hash);
	}
	return hashes;
}

/**
 * @param {readonly string[]} hashes
 * @returns {string}
 */
export function buildPolicy(hashes) {
	return [
		"default-src 'none'",
		`script-src 'self' ${[...hashes, ...ANALYTICS_SCRIPT].join(' ')}`,
		"style-src 'self' 'unsafe-inline'",
		`img-src 'self' data: ${ANALYTICS_IMAGE.join(' ')}`,
		"font-src 'self'",
		`connect-src 'self' ${ANALYTICS_CONNECT.join(' ')}`,
		"worker-src 'self'",
		"form-action 'none'",
		"base-uri 'none'",
		"object-src 'none'"
	].join('; ');
}

/**
 * @param {string} html
 * @param {string} [policy]
 * @returns {string}
 */
export function withPolicy(html, policy = buildPolicy(inlineScriptHashes(html))) {
	const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
	const without = html.replace(META, '');
	if (!HEAD.test(without)) throw new Error('The page has no <head> element');
	return without.replace(HEAD, (open) => `${open}${meta}`);
}

/**
 * @param {string} html
 * @returns {string[]}
 */
export function missingHashes(html) {
	const policy = META.exec(html)?.[0] ?? '';
	return inlineScriptHashes(html).filter((hash) => !policy.includes(hash));
}
