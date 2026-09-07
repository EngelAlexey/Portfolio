import { LANGS, alternates, other, path as routePath, type Lang, type RouteKey } from './i18n';
import { SITE_URL, absolute } from './site';
import { ogCardPath } from './og/paths';

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

export function seo({ lang, key, slug, image, noindex = false }: SeoInput): SeoTags {
	const route = key ?? 'home';
	const paths = alternates(route, slug);
	const card = image ?? ogCardPath(lang, route, slug);

	return {
		canonical: absolute(routePath(lang, route, slug)),
		alternates: [
			...LANGS.map((l) => ({ hreflang: l, href: absolute(paths[l]) })),
			// The root negotiates language, which is exactly what x-default is for.
			// Pointing it at /es would say Spanish is the fallback for everyone.
			{ hreflang: 'x-default', href: `${SITE_URL}/` }
		],
		// A page that asks not to be indexed has nothing to advertise.
		ogImage: noindex ? null : absolute(card),
		ogLocale: OG_LOCALE[lang],
		ogLocaleAlternate: OG_LOCALE[other(lang)]
	};
}
