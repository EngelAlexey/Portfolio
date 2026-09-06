import type { APIRoute } from 'astro';
import { fichaSlugs } from '../lib/content';
import { LANGS, alternates, path, type RouteKey } from '../lib/i18n';
import { absolute } from '../lib/site';

const STATIC_KEYS: RouteKey[] = ['home', 'projects', 'about', 'contact'];

type Entry = { key: RouteKey; slug?: string };

function urlEntry({ key, slug }: Entry): string {
	const pair = alternates(key, slug);
	const links = LANGS.map(
		(lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${absolute(pair[lang])}"/>`
	).join('\n');

	return LANGS.map(
		(lang) => `  <url>
    <loc>${absolute(path(lang, key, slug))}</loc>
${links}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(pair.es)}"/>
  </url>`
	).join('\n');
}

export const GET: APIRoute = async () => {
	const slugs = await fichaSlugs();
	const entries: Entry[] = [
		...STATIC_KEYS.map((key) => ({ key })),
		...slugs.map((slug) => ({ key: 'project' as RouteKey, slug }))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(urlEntry).join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};
