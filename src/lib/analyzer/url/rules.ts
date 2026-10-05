import { finding } from '../codes';
import {
	ARCHIVE_EXTENSIONS,
	DANGEROUS_SCHEMES,
	DOWNLOAD_EXTENSIONS,
	DOWNLOAD_PARAMS,
	HANDOFF_SCHEMES,
	MACRO_EXTENSIONS,
	REDIRECT_PARAMS,
	SERVICE_HOSTS,
	SHORTENERS
} from '../data/links';
import { CLOUD_HOST_SUFFIXES } from '../data/suffixes';
import { KNOWN_TLDS, RISKY_TLDS } from '../data/tlds';
import { LIMITS } from '../limits';
import type { Finding, MessageLink } from '../types';
import { defang } from './defang';
import { matchBrand } from './lookalike';
import { toUnicodeHost } from './punycode';
import { splitHost } from './registrable';
import { isMixedScript } from './scripts';
import { unwrap } from './unwrap';

const MAX_UNWRAP = 3;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i;
const TEXT_HOST = /(?:https?:\/\/)?((?:[a-z0-9-]+\.)+([a-z]{2,24}))/i;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function shown(href: string): string {
	const value = defang(href);
	return value.length > 200 ? `${value.slice(0, 200)}…` : value;
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function looksLikeUrl(value: string): boolean {
	return /^(?:https?:)?\/\//i.test(value.trim());
}

function analyzeHref(href: string, text: string | null, depth: number, out: Finding[]): void {
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return;
	}

	const scheme = url.protocol.slice(0, -1).toLowerCase();
	const evidenceUrl = shown(href);

	if (DANGEROUS_SCHEMES.has(scheme)) {
		out.push(finding('link-scheme-dangerous', { url: evidenceUrl, scheme }));
		return;
	}
	if (HANDOFF_SCHEMES.has(scheme)) {
		out.push(finding('link-scheme-handoff', { url: evidenceUrl, scheme }));
		return;
	}
	if (scheme !== 'http' && scheme !== 'https') return;

	if (scheme === 'http') out.push(finding('link-http', { url: evidenceUrl }));

	const wrapped = depth < MAX_UNWRAP ? unwrap(url) : null;
	if (wrapped !== null) {
		out.push(
			finding('link-wrapper-unwrapped', {
				url: evidenceUrl,
				wrapper: wrapped.wrapper,
				destination: shown(wrapped.destination)
			})
		);
		analyzeHref(wrapped.destination, text, depth + 1, out);
		return;
	}

	if (url.username !== '' || url.password !== '') {
		out.push(finding('link-userinfo', { url: evidenceUrl, userinfo: safeDecode(url.username) }));
	}

	const host = url.hostname.toLowerCase();
	const isIp = IPV4.test(host) || host.startsWith('[');
	let registrable = host;

	if (isIp) {
		out.push(finding('link-ip-host', { url: evidenceUrl, host }));
	} else {
		const parts = splitHost(host);
		registrable = parts.registrable;
		const unicode = toUnicodeHost(host);
		const last = parts.labels.at(-1) ?? '';

		if (parts.labels.some((label) => label.startsWith('xn--'))) {
			out.push(finding('link-punycode', { url: evidenceUrl, host, unicode }));
		}
		if (unicode.split('.').some(isMixedScript)) {
			out.push(finding('link-mixed-script', { url: evidenceUrl, host: unicode }));
		}
		if (RISKY_TLDS.has(last)) out.push(finding('link-risky-tld', { url: evidenceUrl, tld: last }));
		if (SHORTENERS.has(parts.registrable)) out.push(finding('link-shortener', { url: evidenceUrl, host }));

		const service = SERVICE_HOSTS[host] ?? SERVICE_HOSTS[parts.registrable];
		if (service !== undefined) {
			out.push(finding('link-cloud-hosted', { url: evidenceUrl, service }));
		} else if (CLOUD_HOST_SUFFIXES.includes(parts.suffix)) {
			out.push(finding('link-cloud-hosted', { url: evidenceUrl, service: parts.suffix }));
		}

		if (parts.subdomains.length >= 4) {
			out.push(finding('link-many-subdomains', { url: evidenceUrl, count: String(parts.subdomains.length) }));
		}
		if (parts.labels.some((label) => label.length >= 20 && (label.match(/\d/g)?.length ?? 0) >= 3)) {
			out.push(finding('link-random-host', { url: evidenceUrl, host }));
		}

		const brand = matchBrand(splitHost(unicode));
		if (brand !== null) {
			const code =
				brand.kind === 'lookalike'
					? 'link-brand-lookalike'
					: brand.kind === 'in-subdomain'
						? 'link-brand-in-subdomain'
						: 'link-brand-in-domain';
			out.push(finding(code, { url: evidenceUrl, brand: brand.brand, host: unicode, how: brand.how }));
		}
	}

	if (url.port !== '') out.push(finding('link-nonstandard-port', { url: evidenceUrl, port: url.port }));

	const file = safeDecode(url.pathname).split('/').at(-1) ?? '';
	const extension = file.includes('.') ? (file.split('.').at(-1) ?? '').toLowerCase() : '';
	if (DOWNLOAD_EXTENSIONS.has(extension)) {
		out.push(finding('link-file-download', { url: evidenceUrl, file, extension }));
	} else if (MACRO_EXTENSIONS.has(extension)) {
		out.push(finding('link-macro-document', { url: evidenceUrl, file, extension }));
	} else if (ARCHIVE_EXTENSIONS.has(extension)) {
		out.push(finding('link-archive-download', { url: evidenceUrl, file, extension }));
	}

	let downloadParameter = false;
	for (const [name, value] of url.searchParams) {
		const key = name.toLowerCase();
		if (REDIRECT_PARAMS.has(key) && looksLikeUrl(value)) {
			out.push(finding('link-redirect-parameter', { url: evidenceUrl, parameter: key, destination: shown(value) }));
		}
		if (DOWNLOAD_PARAMS.has(key) && ['1', 'true', 'yes', ''].includes(value.toLowerCase())) downloadParameter = true;
		if (key === 'export' && value.toLowerCase() === 'download') downloadParameter = true;
	}
	if (downloadParameter || /\/download(?:\/|$)/i.test(url.pathname)) {
		out.push(finding('link-download-parameter', { url: evidenceUrl }));
	}

	const email = EMAIL.exec(safeDecode(`${url.search}${url.hash}`));
	if (email !== null) out.push(finding('link-email-in-url', { url: evidenceUrl, email: email[0] }));

	if (text !== null && !isIp && !text.includes('@')) {
		const match = TEXT_HOST.exec(text.slice(0, LIMITS.urlChars));
		const tld = (match?.[2] ?? '').toLowerCase();
		if (match !== null && KNOWN_TLDS.has(tld)) {
			const shownDomain = splitHost(match[1] ?? '').registrable;
			if (shownDomain !== registrable) {
				out.push(
					finding('link-text-mismatch', {
						url: evidenceUrl,
						shownText: text.slice(0, 120),
						shownDomain,
						realDomain: registrable
					})
				);
			}
		}
	}
}

export function analyzeLinks(links: readonly MessageLink[]): Finding[] {
	const out: Finding[] = [];
	const seen = new Set<string>();
	for (const link of links.slice(0, LIMITS.links)) {
		const found: Finding[] = [];
		analyzeHref(link.href.slice(0, LIMITS.urlChars), link.text, 0, found);
		for (const item of found) {
			const key = `${item.code}|${item.evidence['url'] ?? ''}`;
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(item);
		}
	}
	return out;
}
