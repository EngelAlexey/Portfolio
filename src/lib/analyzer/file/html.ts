import { finding } from '../codes';
import { LIMITS } from '../limits';
import type { Finding, MessageLink } from '../types';
import { isRemote, shownTarget } from './remote';
import { readTags } from './markup';

export type MarkupReport = {
	readonly findings: Finding[];
	readonly links: MessageLink[];
};

const PASSIVE_TYPES = /^(?:application\/(?:ld\+)?json|application\/importmap|text\/template|text\/x-template|text\/html)$/i;
const BUILDS_FILE = /new\s+Blob\b/;
const SAVES_FILE = /createObjectURL|msSaveOrOpenBlob|msSaveBlob|\.download\s*=|saveAs\s*\(/;
const DECODES = /atob\s*\(|fromCharCode|new\s+Uint8Array|base64/i;
const REFRESH = /url\s*=\s*['"]?([^'";]+)/i;

export function inspectHtml(source: string): MarkupReport {
	const findings: Finding[] = [];
	const links: MessageLink[] = [];
	const seen = new Set<string>();
	const add = (href: string): void => {
		const target = href.trim();
		if (target === '' || target.startsWith('#') || seen.has(target) || links.length >= LIMITS.links) return;
		seen.add(target);
		links.push({ href: target.slice(0, LIMITS.urlChars), text: null });
	};

	let scripts = 0;
	let code = '';
	let password = false;
	const forms: string[] = [];

	for (const tag of readTags(source)) {
		const attributes = tag.attributes;
		if (tag.name === 'script') {
			const type = attributes.get('type') ?? '';
			if (!PASSIVE_TYPES.test(type.trim())) {
				scripts++;
				if (code.length < 2 * 1024 * 1024) code += `${tag.body}\n`;
				const src = attributes.get('src');
				if (src !== undefined && isRemote(src)) add(src);
			}
		} else if (tag.name === 'input' && (attributes.get('type') ?? '').trim().toLowerCase() === 'password') {
			password = true;
		} else if (tag.name === 'form') {
			forms.push(attributes.get('action') ?? '');
		} else if (tag.name === 'a') {
			add(attributes.get('href') ?? '');
		} else if (tag.name === 'iframe') {
			add(attributes.get('src') ?? '');
		} else if (tag.name === 'meta' && (attributes.get('http-equiv') ?? '').toLowerCase() === 'refresh') {
			const target = REFRESH.exec(attributes.get('content') ?? '')?.[1];
			if (target !== undefined) add(target);
		}
	}

	for (const action of forms) add(action);

	const smuggling = BUILDS_FILE.test(code) && SAVES_FILE.test(code) && DECODES.test(code);
	if (smuggling) findings.push(finding('file-html-smuggling'));
	else if (scripts > 0) findings.push(finding('file-html-script'));

	if (password) {
		const remote = forms.find((action) => isRemote(action));
		findings.push(finding('file-html-password-form', remote === undefined ? {} : { target: shownTarget(remote) }));
	}
	return { findings, links };
}
