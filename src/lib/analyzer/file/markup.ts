import { unescapeXml } from './entities';

export type Tag = {
	readonly name: string;
	readonly attributes: ReadonlyMap<string, string>;
	readonly body: string;
};

const MAX_TAGS = 50_000;
const MAX_TAG_CHARS = 4096;
const MAX_BODY_CHARS = 1024 * 1024;
const RAW_TEXT: ReadonlySet<string> = new Set(['script', 'style']);
const NAME = /^([a-zA-Z][a-zA-Z0-9:-]*)/;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function attributesOf(source: string): Map<string, string> {
	const out = new Map<string, string>();
	for (const match of source.matchAll(ATTRIBUTE)) {
		const key = (match[1] ?? '').toLowerCase();
		if (!out.has(key)) out.set(key, unescapeXml(match[2] ?? match[3] ?? match[4] ?? ''));
	}
	return out;
}

export function readTags(source: string): Tag[] {
	const lower = source.toLowerCase();
	const tags: Tag[] = [];
	let at = 0;
	let close = -1;

	while (at < source.length && tags.length < MAX_TAGS) {
		const open = source.indexOf('<', at);
		if (open < 0) break;
		if (source.startsWith('<!--', open)) {
			const end = source.indexOf('-->', open + 4);
			if (end < 0) break;
			at = end + 3;
			continue;
		}
		if (close < open) {
			close = source.indexOf('>', open);
			if (close < 0) break;
		}
		at = open + 1;
		if (close - open > MAX_TAG_CHARS) continue;

		const inner = source.slice(open + 1, close);
		const named = NAME.exec(inner);
		if (named === null) continue;

		const name = (named[1] ?? '').toLowerCase();
		const attributes = attributesOf(inner.slice(named[0].length));
		let body = '';
		at = close + 1;
		if (RAW_TEXT.has(name) && !inner.endsWith('/')) {
			const end = lower.indexOf(`</${name}`, at);
			body = source.slice(at, end < 0 ? source.length : Math.min(end, at + MAX_BODY_CHARS));
			at = end < 0 ? source.length : end;
		}
		tags.push({ name, attributes, body });
	}
	return tags;
}
