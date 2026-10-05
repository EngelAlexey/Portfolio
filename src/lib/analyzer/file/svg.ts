import { finding } from '../codes';
import { LIMITS } from '../limits';
import type { MessageLink } from '../types';
import type { MarkupReport } from './html';
import { readTags } from './markup';

const HANDLER = /^on[a-z]+$/;

function isScriptUrl(value: string): boolean {
	return value.replace(/[\u0000- ]/g, '').toLowerCase().startsWith('javascript:');
}

export function inspectSvg(source: string): MarkupReport {
	const links: MessageLink[] = [];
	const seen = new Set<string>();
	let active = false;

	for (const tag of readTags(source)) {
		if (tag.name === 'script') active = true;
		for (const [key, value] of tag.attributes) {
			if (HANDLER.test(key)) active = true;
			if ((key === 'href' || key === 'xlink:href') && isScriptUrl(value)) active = true;
			if (tag.name === 'a' && (key === 'href' || key === 'xlink:href')) {
				const target = value.trim();
				if (target !== '' && !target.startsWith('#') && !isScriptUrl(target) && !seen.has(target) && links.length < LIMITS.links) {
					seen.add(target);
					links.push({ href: target.slice(0, LIMITS.urlChars), text: null });
				}
			}
		}
	}
	return { findings: active ? [finding('file-svg-script')] : [], links };
}
