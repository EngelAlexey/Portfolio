import {
	DEFAULT_LANG,
	LANGS,
	alternates,
	other,
	path as routePath,
	type Lang,
	type RouteKey
} from './i18n';
import { absolute } from './site';
import { ogCardPath } from './og/paths';

export type SeoInput = {
	lang: Lang;
	key: RouteKey | null;
	slug?: string;
	title: string;
	description: string;
	image?: string | null;
	noindex?: boolean;
	published?: string | null;
	updated?: string | null;
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
			// El destino de reserva es esta misma pagina en el idioma por defecto, no
			// la portada: /es/proyectos/x no se sustituye por /. Y no es la raiz porque
			// la raiz redirige, y hreflang debe apuntar a la URL final e indexable.
			{ hreflang: 'x-default', href: absolute(paths[DEFAULT_LANG]) }
		],
		ogImage: noindex ? null : absolute(card),
		ogLocale: OG_LOCALE[lang],
		ogLocaleAlternate: OG_LOCALE[other(lang)]
	};
}
