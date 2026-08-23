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
};

export type SeoTags = {
	canonical: string;
	alternates: { hreflang: string; href: string }[];
	/** Null until a social card exists — better no tag than a broken one. */
	ogImage: string | null;
	ogLocale: string;
};

const OG_LOCALE: Record<Lang, string> = { es: 'es_CR', en: 'en_US' };

/** Set once a shared social card is generated (see the polish phase). */
const DEFAULT_OG: string | null = null;

export function seo({ lang, key, slug, image }: SeoInput): SeoTags {
	const paths = alternates(key, slug);
	const card = image ?? DEFAULT_OG;

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
		jobTitle:
			lang === 'es'
				? 'Desarrollador Full Stack y Ciberseguridad'
				: 'Full Stack Developer & Cybersecurity',
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
