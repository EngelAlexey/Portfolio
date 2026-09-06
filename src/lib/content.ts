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
	/** The collection entry, so a page can call `render()` for the body. */
	entry: ProjectEntry;
};

/** No more than this many projects may set `home: true`. */
export const MAX_HOME_PROJECTS = 4;

function fail(file: string, message: string): never {
	// Thrown during `astro build`, so a bad write-up never reaches production.
	throw new Error(`[content] ${file}: ${message}`);
}

/** `kaizen-ai/es` → `{ folder: 'kaizen-ai', lang: 'es' }` */
function parseId(id: string): { folder: string; lang: Lang } | null {
	const match = /^([^/]+)\/(es|en)$/.exec(id);
	if (!match) return null;
	return { folder: match[1], lang: match[2] as Lang };
}

let CONTENT: Map<string, Partial<Record<Lang, Project>>> | null = null;

/**
 * Astro validates each entry against the schema on its own, but the rules that
 * span entries — folder/slug agreement, both languages present, the featured
 * cap — have no schema to live in, so they are enforced here and fail the
 * build rather than reaching production.
 */
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

		// A diagram is drawn by the body, which only `.mdx` can do. Declaring one
		// in a plain `.md` file would validate fine and then render nothing, so
		// catch it here rather than letting it disappear quietly.
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

	// Every project must exist in both languages, or the language switch and the
	// hreflang pairs would point at a 404.
	for (const [slug, bucket] of bySlug) {
		for (const lang of LANGS) {
			if (!bucket[lang]) {
				fail(`src/content/projects/${slug}`, `missing \`${lang}.md\` (or \`${lang}.mdx\`)`);
			}
		}

		// `tier` and `home` decide which pages exist and what the front page
		// shows, and both are read from the Spanish entry alone. If the two
		// languages disagreed, one of them would quietly serve a different site
		// — a project with its own page in Spanish and none in English, or a
		// different set of four on the two front pages. Catch it here instead.
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

		// A diagram declared on one side only is invisible until somebody
		// switches language: the figure that carries the architecture section
		// would simply be missing on the other page. Only presence is compared —
		// the node and layer text is meant to be translated.
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

/** `YYYY` carries no month, so place it mid-year rather than behind `YYYY-01`. */
const monthKey = (value: string) => (value.length === 4 ? `${value}-06` : value);

/** Newest first, unless a project pins itself with `order`. */
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

export const tarjetas = async (lang: Lang): Promise<Project[]> =>
	(await allProjects(lang)).filter((p) => p.meta.tier === 'tarjeta');

export const homeProjects = async (lang: Lang): Promise<Project[]> =>
	(await allProjects(lang)).filter((p) => p.meta.home);

export async function getProject(lang: Lang, slug: string): Promise<Project | undefined> {
	return (await load()).get(slug)?.[lang];
}

/** Renders a project body to a component, for the project page. */
export const renderProject = (project: Project) => render(project.entry);

/** Slugs that get their own page — feeds `getStaticPaths()`. */
export const fichaSlugs = async (): Promise<string[]> => (await fichas('es')).map((p) => p.meta.slug);

/** How many projects touch each area, in taxonomy order. */
export async function areaCounts(lang: Lang): Promise<Record<AreaId, number>> {
	const counts = Object.fromEntries(AREA_IDS.map((id) => [id, 0])) as Record<AreaId, number>;
	for (const project of await allProjects(lang)) {
		for (const area of project.meta.areas) counts[area] += 1;
	}
	return counts;
}

/** `Intercargo Panamá — vía Kaizen Apps CR` → name and qualifier. */
function splitOrg(org: string): { name: string; qualifier: string | null } {
	const parts = org.split(' — ');
	const name = (parts.shift() ?? org).trim();
	return { name, qualifier: parts.length ? parts.join(' — ').trim() : null };
}

export type OrgGroup = {
	/** Language-independent key, so both trees group identically. */
	key: string;
	/** Null only for a project that declares no org. */
	name: string | null;
	/** Shown only when every project in the group agrees on it. */
	qualifier: string | null;
	projects: Project[];
	/** Earliest start and latest end across the group; null end means ongoing. */
	period: { start: string; end: string | null };
};

/** `2026-07` → a month index; `2026` counts from that year's first month. */
function months(value: string, edge: 'start' | 'end'): number {
	const [year, month] = value.split('-').map(Number);
	if (month) return year * 12 + month;
	return year * 12 + (edge === 'start' ? 1 : 12);
}

const nowMonths = () => {
	const now = new Date();
	return now.getFullYear() * 12 + now.getMonth() + 1;
};

/**
 * The same projects, gathered by the organisation behind them.
 *
 * Two rules worth knowing. Grouping reads the **Spanish** entry's `org`, so a
 * translated string can never split one employer into two groups. And it keys
 * on the part before the em dash, which is what puts
 * `Universidad Técnica Nacional — TCU` with the rest of the university instead
 * of alone: the qualifier says which programme, not which institution.
 *
 * Groups come back in time order, most recent first. They used to inherit the
 * order of `allProjects()`, which pins the featured projects to the front — so
 * a thing called a timeline ran 2026 → 2025 → 2026 and stopped meaning
 * anything. `order` still decides the projects inside a group and the home
 * page; it just no longer decides where an employer sits in a chronology.
 */
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
		// One ongoing project makes the whole engagement ongoing.
		if (group.period.end !== null) {
			if (project.meta.period.end === null) group.period.end = null;
			else if (project.meta.period.end > group.period.end) {
				group.period.end = project.meta.period.end;
			}
		}
	}

	for (const [key, group] of groups) {
		const seen = qualifiers.get(key)!;
		// `Universidad Técnica Nacional` covers coursework and the TCU alike, so
		// labelling the whole group `TCU` because one project carries it would be
		// wrong. Only a qualifier the whole group shares survives.
		group.qualifier = seen.size === 1 ? [...seen][0] : null;
	}

	const all = [...groups.values()];
	const today = nowMonths();
	const ends = (group: OrgGroup) =>
		group.period.end === null ? today : months(group.period.end, 'end');

	// Most recent first: by when the engagement ended — ongoing counts as today —
	// and then by when it began, so two current engagements read newest-started
	// first rather than in whatever order the projects happened to load.
	all.sort((a, b) => ends(b) - ends(a) || months(b.period.start, 'start') - months(a.period.start, 'start'));

	return all;
}

/** Previous/next within the ficha list, for the footer of a project page. */
export async function neighbours(
	lang: Lang,
	slug: string
): Promise<{ prev?: Project; next?: Project }> {
	const list = await fichas(lang);
	const index = list.findIndex((p) => p.meta.slug === slug);
	if (index === -1) return {};
	return { prev: list[index - 1], next: list[index + 1] };
}
