import { LANGS, alternates, path as routePath, type Lang, type RouteKey } from './i18n';
import { PERSON, absolute } from './site';

export type SeoInput = {
	lang: Lang;
	key: RouteKey;
	slug?: string;
	title: string;
	description: string;
	/** Site-relative image path; falls back to the shared social card. */
	image?: string | null;
	/**
	 * Keeps a page out of the index and suppresses its canonical and hreflang.
	 * Only the 404 needs it: the URL that produced it is unknown at build time,
	 * so any canonical it emitted would point somewhere it is not.
	 */
	noindex?: boolean;
};

export type SeoTags = {
	canonical: string;
	alternates: { hreflang: string; href: string }[];
	/** Null until a social card exists — better no tag than a broken one. */
	ogImage: string | null;
	ogLocale: string;
};

const OG_LOCALE: Record<Lang, string> = { es: 'es_CR', en: 'en_US' };

/**
 * The shared social card, one per language, drawn by `scripts/og.mjs`. A page
 * with its own `cover` overrides it.
 */
const DEFAULT_OG: Record<Lang, string> = {
	es: '/img/og-es.png',
	en: '/img/og-en.png'
};

export function seo({ lang, key, slug, image }: SeoInput): SeoTags {
	const paths = alternates(key, slug);
	const card = image ?? DEFAULT_OG[lang];

	return {
		canonical: absolute(routePath(lang, key, slug)),
		alternates: [
			...LANGS.map((l) => ({ hreflang: l, href: absolute(paths[l]) })),
			{ hreflang: 'x-default', href: absolute(paths.es) }
		],
		ogImage: card === null ? null : absolute(card),
		ogLocale: OG_LOCALE[lang]
	};
}

/**
 * Person markup is what makes the name resolve to this site rather than to a
 * bare GitHub profile when someone searches for it.
 */
export function personJsonLd(lang: Lang): string {
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: PERSON.name,
		url: absolute(routePath(lang, 'home')),
		email: `mailto:${PERSON.email}`,
		// Same words as the role under the name on the home page, so the markup
		// and the visible page agree.
		jobTitle:
			lang === 'es'
				? 'Desarrollador de Software · Enfoque en Ciberseguridad'
				: 'Software Developer · Cybersecurity focus',
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Puntarenas',
			addressCountry: 'CR'
		},
		alumniOf: {
			'@type': 'CollegeOrUniversity',
			name: 'Universidad Técnica Nacional'
		},
		sameAs: [PERSON.linkedin, PERSON.github]
	});
}
