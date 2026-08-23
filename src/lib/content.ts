import type { Component } from 'svelte';
import type { AreaId } from './areas';
import { AREA_IDS } from './areas';
import { MAX_HOME_PROJECTS, projectSchema, type ProjectMeta } from './schema';
import type { Lang } from './i18n';
import { LANGS } from './i18n';

type MdsvexModule = {
	default: Component;
	metadata: unknown;
};

export type Project = {
	meta: ProjectMeta;
	lang: Lang;
	/** The Markdown body, compiled to a Svelte component by mdsvex. */
	Body: Component;
};

const modules = import.meta.glob<MdsvexModule>('../content/projects/*/*.md', { eager: true });

/** `../content/projects/kaizen-ai/es.md` → `{ folder: 'kaizen-ai', lang: 'es' }` */
function parsePath(file: string): { folder: string; lang: Lang } | null {
	const match = /\/projects\/([^/]+)\/(es|en)\.md$/.exec(file);
	if (!match) return null;
	return { folder: match[1], lang: match[2] as Lang };
}

function fail(file: string, message: string): never {
	// Thrown during `vite build`, so a bad write-up never reaches production.
	throw new Error(`[content] ${file}: ${message}`);
}

function load(): Map<string, Partial<Record<Lang, Project>>> {
	const bySlug = new Map<string, Partial<Record<Lang, Project>>>();

	for (const [file, mod] of Object.entries(modules)) {
		const parsed = parsePath(file);
		if (!parsed) fail(file, 'expected `src/content/projects/<slug>/{es,en}.md`');

		const result = projectSchema.safeParse(mod.metadata);
		if (!result.success) {
			const detail = result.error.issues
				.map((issue) => `  · ${issue.path.join('.') || '(root)'}: ${issue.message}`)
				.join('\n');
			fail(file, `invalid front matter\n${detail}`);
		}

		const meta = result.data;
		if (meta.slug !== parsed.folder) {
			fail(file, `front matter slug "${meta.slug}" does not match folder "${parsed.folder}"`);
		}

		const entry = bySlug.get(meta.slug) ?? {};
		entry[parsed.lang] = { meta, lang: parsed.lang, Body: mod.default };
		bySlug.set(meta.slug, entry);
	}

	// Every project must exist in both languages, or the language switch and the
	// hreflang pairs would point at a 404.
	for (const [slug, entry] of bySlug) {
		for (const lang of LANGS) {
			if (!entry[lang]) {
				fail(`src/content/projects/${slug}`, `missing \`${lang}.md\``);
			}
		}
	}

	const featured = [...bySlug.values()].filter((entry) => entry.es?.meta.home).length;
	if (featured > MAX_HOME_PROJECTS) {
		fail(
			'src/content/projects',
			`${featured} projects set \`home: true\`; the home page shows at most ${MAX_HOME_PROJECTS}`
		);
	}

	return bySlug;
}

const CONTENT = load();

/** Newest first, unless a project pins itself with `order`. */
function compare(a: Project, b: Project): number {
	const orderA = a.meta.order;
	const orderB = b.meta.order;
	if (orderA !== null && orderB !== null) return orderA - orderB;
	if (orderA !== null) return -1;
	if (orderB !== null) return 1;

	const startDiff = b.meta.period.start.localeCompare(a.meta.period.start);
	if (startDiff !== 0) return startDiff;
	return a.meta.title.localeCompare(b.meta.title);
}

export function allProjects(lang: Lang): Project[] {
	return [...CONTENT.values()]
		.map((entry) => entry[lang])
		.filter((project): project is Project => Boolean(project))
		.sort(compare);
}

export const fichas = (lang: Lang): Project[] =>
	allProjects(lang).filter((p) => p.meta.tier === 'ficha');

export const tarjetas = (lang: Lang): Project[] =>
	allProjects(lang).filter((p) => p.meta.tier === 'tarjeta');

export const homeProjects = (lang: Lang): Project[] =>
	allProjects(lang).filter((p) => p.meta.home);

export function getProject(lang: Lang, slug: string): Project | undefined {
	return CONTENT.get(slug)?.[lang];
}

/** Slugs that get their own page — feeds `entries()` for prerendering. */
export const fichaSlugs = (): string[] => fichas('es').map((p) => p.meta.slug);

/** How many projects touch each area, in taxonomy order. */
export function areaCounts(lang: Lang): Record<AreaId, number> {
	const counts = Object.fromEntries(AREA_IDS.map((id) => [id, 0])) as Record<AreaId, number>;
	for (const project of allProjects(lang)) {
		for (const area of project.meta.areas) counts[area] += 1;
	}
	return counts;
}

/** Previous/next within the ficha list, for the footer of a project page. */
export function neighbours(lang: Lang, slug: string): { prev?: Project; next?: Project } {
	const list = fichas(lang);
	const index = list.findIndex((p) => p.meta.slug === slug);
	if (index === -1) return {};
	return { prev: list[index - 1], next: list[index + 1] };
}
