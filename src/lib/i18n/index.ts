import { es } from './es';
import { en } from './en';
import type { Dict } from './es';

export type Lang = 'es' | 'en';
export type { Dict };

export const LANGS: Lang[] = ['es', 'en'];
export const DEFAULT_LANG: Lang = 'es';

const DICTS: Record<Lang, Dict> = { es, en };

export const t = (lang: Lang): Dict => DICTS[lang];

export const other = (lang: Lang): Lang => (lang === 'es' ? 'en' : 'es');

export type RouteKey = 'home' | 'projects' | 'project' | 'blog' | 'article' | 'about' | 'contact' | 'scanner' | 'scannerAbout' | 'scannerReport' | 'tools' | 'schemaflow' | 'analyzer' | 'analyzerAbout' | 'privacy';

const SEGMENTS: Record<RouteKey, Record<Lang, string>> = {
	home: { es: '', en: '' },
	projects: { es: 'proyectos', en: 'projects' },
	project: { es: 'proyectos', en: 'projects' },
	blog: { es: 'blog', en: 'blog' },
	article: { es: 'blog', en: 'blog' },
	about: { es: 'sobre-mi', en: 'about' },
	contact: { es: 'contacto', en: 'contact' },
	scanner: { es: 'herramientas/escaner', en: 'tools/scanner' },
	scannerAbout: { es: 'herramientas/escaner/acerca', en: 'tools/scanner/about' },
	scannerReport: { es: 'herramientas/escaner/reporte', en: 'tools/scanner/report' },
	tools: { es: 'herramientas', en: 'tools' },
	schemaflow: { es: 'herramientas/schemaflow', en: 'tools/schemaflow' },
	analyzer: { es: 'herramientas/phishing', en: 'tools/phishing' },
	analyzerAbout: { es: 'herramientas/phishing/acerca', en: 'tools/phishing/about' },
	privacy: { es: 'privacidad', en: 'privacy' }
};

const NESTED: RouteKey[] = ['project', 'article'];

export function path(lang: Lang, key: RouteKey, slug?: string): string {
	const prefix = `/${lang}`;
	const segment = SEGMENTS[key][lang];
	const tail = [segment, NESTED.includes(key) ? slug : undefined].filter(Boolean).join('/');
	return tail ? `${prefix}/${tail}` : prefix;
}

export function alternates(key: RouteKey, slug?: string): Record<Lang, string> {
	return { es: path('es', key, slug), en: path('en', key, slug) };
}

export const feedPath = (lang: Lang): string => `/${lang}/blog.xml`;
