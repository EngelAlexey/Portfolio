import { getCollection, render, type CollectionEntry } from 'astro:content';
import { fichaSlugs } from './content';
import type { Lang } from './i18n';
import { LANGS } from './i18n';

export type ArticleEntry = CollectionEntry<'articles'>;
export type ArticleMeta = ArticleEntry['data'];

export type Article = {
	meta: ArticleMeta;
	lang: Lang;
	entry: ArticleEntry;
};

export const HOME_ARTICLES = 2;

const WORDS_PER_MINUTE = 200;

function fail(file: string, message: string): never {
	throw new Error(`[articles] ${file}: ${message}`);
}

function parseId(id: string): { folder: string; lang: Lang } | null {
	const match = /^([^/]+)\/(es|en)$/.exec(id);
	if (!match) return null;
	return { folder: match[1], lang: match[2] as Lang };
}

let CONTENT: Map<string, Partial<Record<Lang, Article>>> | null = null;

async function load(): Promise<Map<string, Partial<Record<Lang, Article>>>> {
	if (CONTENT) return CONTENT;

	const bySlug = new Map<string, Partial<Record<Lang, Article>>>();

	for (const entry of await getCollection('articles')) {
		const parsed = parseId(entry.id);
		if (!parsed) fail(entry.id, 'expected `src/content/articles/<slug>/{es,en}.mdx`');

		const meta = entry.data;
		if (meta.slug !== parsed.folder) {
			fail(entry.id, `front matter slug "${meta.slug}" does not match folder "${parsed.folder}"`);
		}

		const bucket = bySlug.get(meta.slug) ?? {};
		bucket[parsed.lang] = { meta, lang: parsed.lang, entry };
		bySlug.set(meta.slug, bucket);
	}

	const known = new Set(await fichaSlugs());

	for (const [slug, bucket] of bySlug) {
		for (const lang of LANGS) {
			if (!bucket[lang]) fail(`src/content/articles/${slug}`, `missing \`${lang}.mdx\``);
		}

		for (const field of ['draft', 'published'] as const) {
			const es = bucket.es!.meta[field];
			const en = bucket.en!.meta[field];
			if (es !== en) {
				fail(
					`src/content/articles/${slug}`,
					`\`${field}\` differs between languages: es is \`${es}\`, en is \`${en}\``
				);
			}
		}

		const related = bucket.es!.meta.related;
		if (related.join('|') !== bucket.en!.meta.related.join('|')) {
			fail(`src/content/articles/${slug}`, '`related` differs between languages');
		}

		for (const target of related) {
			if (!known.has(target)) {
				fail(`src/content/articles/${slug}`, `\`related\` names an unknown project: "${target}"`);
			}
		}
	}

	CONTENT = bySlug;
	return bySlug;
}

// Los borradores se ven en `astro dev` y no existen en el sitio publicado.
const visible = (article: Article): boolean => !article.meta.draft || !import.meta.env.PROD;

function compare(a: Article, b: Article): number {
	const dateDiff = b.meta.published.localeCompare(a.meta.published);
	if (dateDiff !== 0) return dateDiff;
	return a.meta.title.localeCompare(b.meta.title);
}

export async function allArticles(lang: Lang): Promise<Article[]> {
	const content = await load();
	return [...content.values()]
		.map((bucket) => bucket[lang])
		.filter((article): article is Article => Boolean(article))
		.filter(visible)
		.sort(compare);
}

export const latestArticles = async (lang: Lang, count = HOME_ARTICLES): Promise<Article[]> =>
	(await allArticles(lang)).slice(0, count);

export async function getArticle(lang: Lang, slug: string): Promise<Article | undefined> {
	const article = (await load()).get(slug)?.[lang];
	return article && visible(article) ? article : undefined;
}

export const renderArticle = (article: Article) => render(article.entry);

export const articleSlugs = async (): Promise<string[]> =>
	(await allArticles('es')).map((a) => a.meta.slug);

// La compuerta de lanzamiento. Mientras no haya nada publicado, el blog no se
// enlaza, no entra en el sitemap y no se indexa: un blog vacio resta.
export const hasArticles = async (lang: Lang): Promise<boolean> =>
	(await allArticles(lang)).length > 0;

export function readingMinutes(article: Article): number {
	const words = article.entry.body?.trim().split(/\s+/).filter(Boolean).length ?? 0;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export async function neighbours(
	lang: Lang,
	slug: string
): Promise<{ prev?: Article; next?: Article }> {
	const list = await allArticles(lang);
	const index = list.findIndex((a) => a.meta.slug === slug);
	if (index === -1) return {};
	return { prev: list[index - 1], next: list[index + 1] };
}
