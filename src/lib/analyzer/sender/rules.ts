import { finding } from '../codes';
import { BRANDS } from '../data/brands';
import { FREEMAIL_DOMAINS } from '../data/phrases';
import { KNOWN_TLDS } from '../data/tlds';
import type { Finding } from '../types';
import { foldText } from '../text/rules';
import { matchBrand, ownsDomain } from '../url/lookalike';
import { toUnicodeHost } from '../url/punycode';
import { splitHost } from '../url/registrable';
import { isMixedScript } from '../url/scripts';

export type Sender = {
	readonly name: string | null;
	readonly address: string | null;
	readonly domain: string | null;
};

const ANGLE = /<([^<>\s]+@[^<>\s]+)>/;
const BARE = /([^\s<>"',;()]+@[^\s<>"',;()]+)/;
const NAME_ADDRESS = /([a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+)/i;
const NAME_DOMAIN = /((?:[a-z0-9-]+\.)+([a-z]{2,24}))/i;

export function parseSender(raw: string): Sender {
	const text = raw.trim().slice(0, 500);
	const angle = ANGLE.exec(text);
	const bare = BARE.exec(text);
	const found = angle?.[1] ?? bare?.[1] ?? null;
	const address = found === null ? null : found.toLowerCase().replace(/[>.,;]+$/, '');
	let name = text;
	if (angle !== null) name = text.slice(0, angle.index);
	else if (bare !== null) name = text.replace(bare[0], '');
	name = name.trim().replace(/^["']+|["']+$/g, '').trim();
	const domain = address === null ? null : address.slice(address.lastIndexOf('@') + 1);
	return { name: name === '' ? null : name, address, domain };
}

export function analyzeSender(raw: string): Finding[] {
	const sender = parseSender(raw);
	if (sender.domain === null || sender.address === null) return [];

	const out: Finding[] = [];
	const unicode = toUnicodeHost(sender.domain);
	const parts = splitHost(unicode);
	const evidence = { name: sender.name ?? '', address: sender.address };

	const brand = matchBrand(parts);
	if (brand !== null) {
		out.push(finding('sender-lookalike', { ...evidence, domain: unicode, brand: brand.brand, how: brand.how }));
	} else if (unicode.split('.').some(isMixedScript)) {
		out.push(finding('sender-lookalike', { ...evidence, domain: unicode, brand: '', how: 'script' }));
	}

	if (sender.name === null) return out;

	const shownAddress = NAME_ADDRESS.exec(sender.name);
	const shownDomain =
		shownAddress !== null
			? (shownAddress[1] ?? '').slice((shownAddress[1] ?? '').lastIndexOf('@') + 1)
			: (() => {
					const match = NAME_DOMAIN.exec(sender.name);
					return match !== null && KNOWN_TLDS.has((match[2] ?? '').toLowerCase()) ? (match[1] ?? '') : '';
				})();
	if (shownDomain !== '' && splitHost(shownDomain).registrable !== parts.registrable) {
		out.push(finding('sender-name-address-mismatch', { ...evidence, brand: '', shown: shownDomain }));
		return out;
	}

	const pieces = foldText(sender.name).split(/[^a-z0-9]+/);
	const freemail = FREEMAIL_DOMAINS.has(parts.registrable);
	for (const candidate of BRANDS) {
		const named = [...candidate.tokens, ...candidate.words].some((token) => pieces.includes(token));
		if (!named) continue;
		if (freemail) {
			out.push(finding('sender-freemail-brand', { ...evidence, brand: candidate.name }));
			break;
		}
		if (ownsDomain(candidate, parts)) continue;
		out.push(finding('sender-name-address-mismatch', { ...evidence, brand: candidate.name, shown: '' }));
		break;
	}

	return out;
}
