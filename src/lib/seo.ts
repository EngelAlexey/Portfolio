import { LANGS, alternates, path as routePath, type Lang, type RouteKey } from './i18n';
import { PERSON, absolute } from './site';

export type SeoInput = {
	lang: Lang;
	key: RouteKey;
	slug?: string;
	title: string;
	description: string;
	image?: string | null;
	noindex?: boolean;
};

export type SeoTags = {
	canonical: string;
	alternates: { hreflang: string; href: string }[];
	ogImage: string | null;
	ogLocale: string;
};

const OG_LOCALE: Record<Lang, string> = { es: 'es_CR', en: 'en_US' };

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

export function personJsonLd(lang: Lang): string {
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: PERSON.name,
		url: absolute(routePath(lang, 'home')),
		email: `mailto:${PERSON.email}`,
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
