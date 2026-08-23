import { es } from './es';
import { en } from './en';
import type { Dict } from './es';

export type Lang = 'es' | 'en';
export type { Dict };

export const LANGS: Lang[] = ['es', 'en'];
export const DEFAULT_LANG: Lang = 'es';

const DICTS: Record<Lang, Dict> = { es, en };

/** Strings for a language. Components take `lang` and call this once. */
export const t = (lang: Lang): Dict => DICTS[lang];

export const other = (lang: Lang): Lang => (lang === 'es' ? 'en' : 'es');

export const langFromPathname = (pathname: string): Lang =>
	pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es';

/**
 * The two route trees are mirrored but not string-equal: Spanish lives at the
 * root because it is the primary audience, and each segment is spelled in its
 * own language. This table is the single source of truth for both the language
 * switch and the `hreflang` pairs.
 */
export type RouteKey = 'home' | 'projects' | 'project' | 'about' | 'contact';

const SEGMENTS: Record<RouteKey, Record<Lang, string>> = {
	home: { es: '', en: '' },
	projects: { es: 'proyectos', en: 'projects' },
	project: { es: 'proyectos', en: 'projects' },
	about: { es: 'sobre-mi', en: 'about' },
	contact: { es: 'contacto', en: 'contact' }
};

/** Build an absolute in-site path, e.g. `path('en', 'project', 'kaizen-ai')`. */
export function path(lang: Lang, key: RouteKey, slug?: string): string {
	const prefix = lang === 'en' ? '/en' : '';
	const segment = SEGMENTS[key][lang];
	const tail = [segment, key === 'project' ? slug : undefined].filter(Boolean).join('/');
	if (!tail) return prefix || '/';
	return `${prefix}/${tail}`;
}

/** Which page is this? Used for nav highlighting and for the language switch. */
export function routeFromPathname(pathname: string): { key: RouteKey; slug?: string } {
	const lang = langFromPathname(pathname);
	const rest = (lang === 'en' ? pathname.replace(/^\/en/, '') : pathname).replace(/^\/|\/$/g, '');
	if (!rest) return { key: 'home' };

	const [head, ...tail] = rest.split('/');
	if (head === SEGMENTS.projects[lang]) {
		return tail.length ? { key: 'project', slug: tail[0] } : { key: 'projects' };
	}
	if (head === SEGMENTS.about[lang]) return { key: 'about' };
	if (head === SEGMENTS.contact[lang]) return { key: 'contact' };
	return { key: 'home' };
}

/** The same page in the other language — what the language switch links to. */
export function alternatePath(pathname: string): string {
	const target = other(langFromPathname(pathname));
	const { key, slug } = routeFromPathname(pathname);
	return path(target, key, slug);
}

/** Both language variants of a page, for `hreflang` and the sitemap. */
export function alternates(key: RouteKey, slug?: string): Record<Lang, string> {
	return { es: path('es', key, slug), en: path('en', key, slug) };
}
