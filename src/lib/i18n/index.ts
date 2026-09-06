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

/**
 * The two route trees are mirrored: both languages carry their own prefix, and
 * each segment is spelled in its own language. `/` redirects to `/es`, which is
 * the primary audience. This table is the single source of truth for both the
 * language switch and the `hreflang` pairs.
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
	const prefix = `/${lang}`;
	const segment = SEGMENTS[key][lang];
	const tail = [segment, key === 'project' ? slug : undefined].filter(Boolean).join('/');
	return tail ? `${prefix}/${tail}` : prefix;
}

/** Both language variants of a page, for `hreflang` and the sitemap. */
export function alternates(key: RouteKey, slug?: string): Record<Lang, string> {
	return { es: path('es', key, slug), en: path('en', key, slug) };
}
