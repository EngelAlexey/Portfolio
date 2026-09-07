import { LANGS, alternates, other, path as routePath, type Lang, type RouteKey } from './i18n';
import { absolute } from './site';

export type SeoInput = {
	lang: Lang;
	// null on the 404, which belongs to no route and must describe itself as nothing.
	key: RouteKey | null;
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
	ogLocaleAlternate: string;
};

const OG_LOCALE: Record<Lang, string> = { es: 'es_CR', en: 'en_US' };

const DEFAULT_OG: Record<Lang, string> = {
	es: '/img/og-es.png',
	en: '/img/og-en.png'
};

export function seo({ lang, key, slug, image, noindex = false }: SeoInput): SeoTags {
	const route = key ?? 'home';
	const paths = alternates(route, slug);
	const card = image ?? DEFAULT_OG[lang];

	return {
		canonical: absolute(routePath(lang, route, slug)),
		alternates: [
			...LANGS.map((l) => ({ hreflang: l, href: absolute(paths[l]) })),
			{ hreflang: 'x-default', href: absolute(paths.es) }
		],
		// A page that asks not to be indexed has nothing to advertise.
		ogImage: noindex ? null : absolute(card),
		ogLocale: OG_LOCALE[lang],
		ogLocaleAlternate: OG_LOCALE[other(lang)]
	};
}
