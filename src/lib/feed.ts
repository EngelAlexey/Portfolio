import { allArticles } from './articles';
import { feedPath, path as routePath, t, type Lang } from './i18n';
import { absolute, PERSON } from './site';

const escape = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

const rfc822 = (iso: string): string => new Date(`${iso}T00:00:00Z`).toUTCString();

export async function feed(lang: Lang): Promise<string> {
	const strings = t(lang);
	const articles = await allArticles(lang);
	const self = absolute(feedPath(lang));
	const home = absolute(routePath(lang, 'blog'));

	const items = articles
		.map((article) => {
			const link = absolute(routePath(lang, 'article', article.meta.slug));
			// RSS 2.0 no tiene fecha de edicion, asi que la ultima edicion va en
			// `atom:updated`, que los lectores entienden junto a `pubDate`.
			const edited = article.meta.updated
				? `
      <atom:updated>${article.meta.updated}T00:00:00Z</atom:updated>`
				: '';

			return `    <item>
      <title>${escape(article.meta.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(article.meta.published)}</pubDate>${edited}
      <description>${escape(article.meta.tagline)}</description>
    </item>`;
		})
		.join('\n');

	const newest = articles
		.map(({ meta }) => meta.updated ?? meta.published)
		.sort()
		.at(-1);
	const built = newest
		? `
    <lastBuildDate>${rfc822(newest)}</lastBuildDate>`
		: '';

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(`${PERSON.name} — ${strings.blog.title}`)}</title>
    <link>${home}</link>
    <description>${escape(strings.blog.lead)}</description>
    <language>${lang}</language>${built}
    <atom:link href="${self}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
