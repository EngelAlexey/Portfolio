import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { AreaId } from './areas';
import { AREA_IDS } from './areas';
import type { Lang } from './i18n';
import { LANGS } from './i18n';

export type ProjectEntry = CollectionEntry<'projects'>;
export type ProjectMeta = ProjectEntry['data'];

export type Project = {
	meta: ProjectMeta;
	lang: Lang;
	entry: ProjectEntry;
};

export const MAX_HOME_PROJECTS = 4;

function fail(file: string, message: string): never {
	throw new Error(`[content] ${file}: ${message}`);
}

function parseId(id: string): { folder: string; lang: Lang } | null {
	const match = /^([^/]+)\/(es|en)$/.exec(id);
	if (!match) return null;
	return { folder: match[1], lang: match[2] as Lang };
}

let CONTENT: Map<string, Partial<Record<Lang, Project>>> | null = null;

async function load(): Promise<Map<string, Partial<Record<Lang, Project>>>> {
	if (CONTENT) return CONTENT;

	const bySlug = new Map<string, Partial<Record<Lang, Project>>>();

	for (const entry of await getCollection('projects')) {
		const parsed = parseId(entry.id);
		if (!parsed) fail(entry.id, 'expected `src/content/projects/<slug>/{es,en}.{md,mdx}`');

		const meta = entry.data;
		if (meta.slug !== parsed.folder) {
			fail(entry.id, `front matter slug "${meta.slug}" does not match folder "${parsed.folder}"`);
		}

		if (meta.diagram && !entry.filePath?.endsWith('.mdx')) {
			fail(
				entry.id,
				'declares `diagram` but is not `.mdx`; rename the file and place ' +
					'`<ArchDiagram {...frontmatter.diagram} />` in the body'
			);
		}

		const bucket = bySlug.get(meta.slug) ?? {};
		bucket[parsed.lang] = { meta, lang: parsed.lang, entry };
		bySlug.set(meta.slug, bucket);
	}

	for (const [slug, bucket] of bySlug) {
		for (const lang of LANGS) {
			if (!bucket[lang]) {
				fail(`src/content/projects/${slug}`, `missing \`${lang}.md\` (or \`${lang}.mdx\`)`);
			}
		}

		for (const field of ['tier', 'home'] as const) {
			const es = bucket.es!.meta[field];
			const en = bucket.en!.meta[field];
			if (es !== en) {
				fail(
					`src/content/projects/${slug}`,
					`\`${field}\` differs between languages: es is \`${es}\`, en is \`${en}\``
				);
			}
		}

		if ((bucket.es!.meta.diagram === null) !== (bucket.en!.meta.diagram === null)) {
			fail(
				`src/content/projects/${slug}`,
				'`diagram` is declared on only one of the two languages'
			);
		}
	}

	const featured = [...bySlug.values()].filter((bucket) => bucket.es?.meta.home).length;
	if (featured > MAX_HOME_PROJECTS) {
		fail(
			'src/content/projects',
			`${featured} projects set \`home: true\`; the home page shows at most ${MAX_HOME_PROJECTS}`
		);
	}

	CONTENT = bySlug;
	return bySlug;
}

const monthKey = (value: string) => (value.length === 4 ? `${value}-06` : value);

function compare(a: Project, b: Project): number {
	const orderA = a.meta.order;
	const orderB = b.meta.order;
	if (orderA !== null && orderB !== null) return orderA - orderB;
	if (orderA !== null) return -1;
	if (orderB !== null) return 1;

	const startDiff = monthKey(b.meta.period.start).localeCompare(monthKey(a.meta.period.start));
	if (startDiff !== 0) return startDiff;
	return a.meta.title.localeCompare(b.meta.title);
}

export async function allProjects(lang: Lang): Promise<Project[]> {
	const content = await load();
	return [...content.values()]
		.map((bucket) => bucket[lang])
		.filter((project): project is Project => Boolean(project))
		.sort(compare);
}

export const fichas = async (lang: Lang): Promise<Project[]> =>
	(await allProjects(lang)).filter((p) => p.meta.tier === 'ficha');

export const homeProjects = async (lang: Lang): Promise<Project[]> =>
	(await allProjects(lang)).filter((p) => p.meta.home);

export async function getProject(lang: Lang, slug: string): Promise<Project | undefined> {
	return (await load()).get(slug)?.[lang];
}

export const renderProject = (project: Project) => render(project.entry);

export const fichaSlugs = async (): Promise<string[]> => (await fichas('es')).map((p) => p.meta.slug);

export async function areaCounts(lang: Lang): Promise<Record<AreaId, number>> {
	const counts = Object.fromEntries(AREA_IDS.map((id) => [id, 0])) as Record<AreaId, number>;
	for (const project of await allProjects(lang)) {
		for (const area of project.meta.areas) counts[area] += 1;
	}
	return counts;
}

export function splitOrg(org: string): { name: string; qualifier: string | null } {
	const parts = org.split(' — ');
	const name = (parts.shift() ?? org).trim();
	return { name, qualifier: parts.length ? parts.join(' — ').trim() : null };
}

export type OrgGroup = {
	key: string;
	name: string | null;
	qualifier: string | null;
	projects: Project[];
	period: { start: string; end: string | null };
};

function months(value: string, edge: 'start' | 'end'): number {
	const [year, month] = value.split('-').map(Number);
	if (month) return year * 12 + month;
	return year * 12 + (edge === 'start' ? 1 : 12);
}

const nowMonths = () => {
	const now = new Date();
	return now.getFullYear() * 12 + now.getMonth() + 1;
};

export async function projectsByOrg(lang: Lang): Promise<OrgGroup[]> {
	const ordered = await allProjects(lang);
	const content = await load();
	const groups = new Map<string, OrgGroup>();
	const qualifiers = new Map<string, Set<string | null>>();

	for (const project of ordered) {
		const canonical = content.get(project.meta.slug)?.es?.meta.org ?? null;
		const key = canonical ? splitOrg(canonical).name : '';
		const shown = project.meta.org ? splitOrg(project.meta.org) : null;

		let group = groups.get(key);
		if (!group) {
			group = {
				key,
				name: shown?.name ?? null,
				qualifier: null,
				projects: [],
				period: { start: project.meta.period.start, end: project.meta.period.end }
			};
			groups.set(key, group);
			qualifiers.set(key, new Set());
		}

		qualifiers.get(key)!.add(shown?.qualifier ?? null);
		group.projects.push(project);

		if (project.meta.period.start < group.period.start) {
			group.period.start = project.meta.period.start;
		}
		if (group.period.end !== null) {
			if (project.meta.period.end === null) group.period.end = null;
			else if (project.meta.period.end > group.period.end) {
				group.period.end = project.meta.period.end;
			}
		}
	}

	for (const [key, group] of groups) {
		const seen = qualifiers.get(key)!;
		group.qualifier = seen.size === 1 ? [...seen][0] : null;
	}

	const all = [...groups.values()];
	const today = nowMonths();
	const ends = (group: OrgGroup) =>
		group.period.end === null ? today : months(group.period.end, 'end');

	all.sort((a, b) => ends(b) - ends(a) || months(b.period.start, 'start') - months(a.period.start, 'start'));

	return all;
}

export async function neighbours(
	lang: Lang,
	slug: string
): Promise<{ prev?: Project; next?: Project }> {
	const list = await fichas(lang);
	const index = list.findIndex((p) => p.meta.slug === slug);
	if (index === -1) return {};
	return { prev: list[index - 1], next: list[index + 1] };
}
