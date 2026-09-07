import type { APIRoute } from 'astro';
import { allArticles, hasArticles } from '../lib/articles';
import { fichaSlugs } from '../lib/content';
import { DEFAULT_LANG, LANGS, alternates, path, type RouteKey } from '../lib/i18n';
import { absolute } from '../lib/site';
import lastmod from '../lib/lastmod.json';

const STATIC_KEYS: RouteKey[] = ['home', 'projects', 'about', 'contact'];

type Entry = { key: RouteKey; slug?: string };

const dates: Record<string, string> = lastmod;

// La clave sale del tipo de entrada, no de si hay slug: un articulo con slug
// buscaria `project:<slug>` y se quedaria sin fecha.
const stampKey = ({ key, slug }: Entry): string => (slug ? `${key}:${slug}` : key);

function urlEntry(entry: Entry, declared: Map<string, string>): string {
	const { key, slug } = entry;
	const pair = alternates(key, slug);
	// La fecha declarada en el front matter gana sobre la del historial de git:
	// es la que el autor afirma, y el historial queda de reserva.
	const date = declared.get(stampKey(entry)) ?? dates[stampKey(entry)];
	const stamp = date ? `
    <lastmod>${date}</lastmod>` : '';
	const links = LANGS.map(
		(lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${absolute(pair[lang])}"/>`
	).join('\n');

	return LANGS.map(
		(lang) => `  <url>
    <loc>${absolute(path(lang, key, slug))}</loc>${stamp}
${links}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(pair[DEFAULT_LANG])}"/>
  </url>`
	).join('\n');
}

export const GET: APIRoute = async () => {
	const slugs = await fichaSlugs();
	const entries: Entry[] = [
		...STATIC_KEYS.map((key) => ({ key })),
		...slugs.map((slug) => ({ key: 'project' as RouteKey, slug }))
	];

	const declared = new Map<string, string>();

	// El blog entra en el sitemap solo cuando hay algo que leer.
	if (await hasArticles(DEFAULT_LANG)) {
		entries.push({ key: 'blog' });

		const articles = await allArticles(DEFAULT_LANG);
		for (const { meta } of articles) {
			entries.push({ key: 'article' as RouteKey, slug: meta.slug });
			declared.set(`article:${meta.slug}`, meta.updated ?? meta.published);
		}

		const newest = articles
			.map(({ meta }) => meta.updated ?? meta.published)
			.sort()
			.at(-1);
		if (newest) declared.set('blog', newest);
	}

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map((entry) => urlEntry(entry, declared)).join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
