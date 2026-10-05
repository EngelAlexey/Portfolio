import { BRANDS, type Brand } from '../data/brands';
import { GENERIC_CCTLDS, RISKY_TLDS } from '../data/tlds';
import type { HostParts } from './registrable';

export type BrandMatch = {
	readonly brand: string;
	readonly kind: 'lookalike' | 'in-subdomain' | 'in-domain';
	readonly how: 'domain' | 'characters' | 'typo' | 'subdomain' | 'word' | 'contains';
};

const LETTERS: Readonly<Record<string, string>> = {
	а: 'a',
	е: 'e',
	о: 'o',
	р: 'p',
	с: 'c',
	х: 'x',
	у: 'y',
	і: 'i',
	ј: 'j',
	ѕ: 's',
	ԁ: 'd',
	һ: 'h',
	ԛ: 'q',
	ѡ: 'w',
	ɡ: 'g',
	ο: 'o',
	α: 'a',
	ν: 'v',
	ρ: 'p',
	ι: 'i',
	κ: 'k',
	ı: 'i',
	ӏ: 'l',
	ⅼ: 'l',
	ℓ: 'l'
};

const DIGITS: Readonly<Record<string, string>> = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', $: 's' };

const LEGIT_DOMAINS: ReadonlySet<string> = new Set(BRANDS.flatMap((brand) => brand.domains));

export function editDistance(a: string, b: string, max: number): number {
	if (Math.abs(a.length - b.length) > max) return max + 1;
	let beforePrevious: number[] = [];
	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		let best = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
			let value = Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, (previous[j - 1] ?? 0) + cost);
			if (i > 1 && j > 1 && a.charCodeAt(i - 1) === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) {
				value = Math.min(value, (beforePrevious[j - 2] ?? 0) + 1);
			}
			current.push(value);
			if (value < best) best = value;
		}
		if (best > max) return max + 1;
		beforePrevious = previous;
		previous = current;
	}
	return previous[b.length] ?? max + 1;
}

function fold(label: string): string {
	const plain = label.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
	return [...plain].map((character) => LETTERS[character] ?? character).join('');
}

export function labelVariants(label: string): string[] {
	const base = fold(label);
	const digits = base.replace(/[01345$]/g, (character) => DIGITS[character] ?? character);
	const withI = base.replace(/1/g, 'i').replace(/[0345$]/g, (character) => DIGITS[character] ?? character);
	const out = new Set<string>();
	for (const form of [base, digits, withI]) {
		out.add(form);
		out.add(form.replace(/rn/g, 'm'));
		out.add(form.replace(/vv/g, 'w'));
	}
	return [...out];
}

function isCountryVariant(suffix: string): boolean {
	const last = suffix.split('.').at(-1) ?? '';
	return /^[a-z]{2}$/.test(last) && !GENERIC_CCTLDS.has(last) && !RISKY_TLDS.has(last);
}

export function ownsDomain(brand: Brand, parts: HostParts): boolean {
	if (brand.domains.includes(parts.registrable)) return true;
	return [...brand.tokens, ...brand.words].includes(parts.label) && isCountryVariant(parts.suffix);
}

export function matchBrand(parts: HostParts): BrandMatch | null {
	const { registrable, label, suffix, subdomains } = parts;
	if (label === '' || LEGIT_DOMAINS.has(registrable)) return null;

	const country = isCountryVariant(suffix);
	const variants = labelVariants(label);
	const compact = variants.map((variant) => variant.replace(/-/g, ''));
	const pieces = variants.flatMap((variant) => variant.split('-'));
	const plainPieces = label.split('-');

	let subdomain: BrandMatch | null = null;
	let inDomain: BrandMatch | null = null;

	for (const brand of BRANDS) {
		const names = [
			...brand.tokens.map((token) => ({ token, word: false })),
			...brand.words.map((token) => ({ token, word: true }))
		];
		for (const { token, word } of names) {
			if (label === token) {
				if (country) continue;
				return { brand: brand.name, kind: 'lookalike', how: 'domain' };
			}
			if (compact.some((variant) => variant === token)) {
				return { brand: brand.name, kind: 'lookalike', how: 'characters' };
			}
			if (!word && token.length >= 5) {
				const max = token.length >= 8 ? 2 : 1;
				if (compact.some((variant) => editDistance(variant, token, max) <= max)) {
					return { brand: brand.name, kind: 'lookalike', how: 'typo' };
				}
			}
			if (subdomain === null) {
				for (const sub of subdomains) {
					const parts2 = fold(sub).split('-');
					if (parts2.some((piece) => piece === token) || (!word && token.length >= 5 && fold(sub).includes(token))) {
						subdomain = { brand: brand.name, kind: 'in-subdomain', how: 'subdomain' };
						break;
					}
				}
			}
			const exact = pieces.some((piece) => piece === token);
			const inside = !word && token.length >= 5 && pieces.some((piece) => piece.includes(token));
			if (exact || inside) {
				const plainExact = plainPieces.some((piece) => piece === token);
				const plainInside = !word && token.length >= 5 && plainPieces.some((piece) => piece.includes(token));
				if (!plainExact && !plainInside) return { brand: brand.name, kind: 'lookalike', how: 'characters' };
				if (inDomain === null) inDomain = { brand: brand.name, kind: 'in-domain', how: exact ? 'word' : 'contains' };
			}
		}
	}

	return subdomain ?? inDomain;
}
