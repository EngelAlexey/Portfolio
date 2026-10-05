import { LIMITS } from './limits';
import type { MessageLink } from './types';

const MAX_HTML = 500_000;
const MAX_TEXT = 200;

export function linksFromHtml(html: string): MessageLink[] {
	const document = new DOMParser().parseFromString(html.slice(0, MAX_HTML), 'text/html');
	const links: MessageLink[] = [];
	for (const anchor of document.querySelectorAll('a[href]')) {
		const href = (anchor.getAttribute('href') ?? '').trim();
		if (href === '' || href.startsWith('#')) continue;
		const text = (anchor.textContent ?? '').replace(/\s+/g, ' ').trim();
		links.push({ href: href.slice(0, LIMITS.urlChars), text: text === '' ? null : text.slice(0, MAX_TEXT) });
		if (links.length >= LIMITS.links) break;
	}
	return links;
}
