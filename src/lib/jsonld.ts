import {
	CERTIFICATIONS,
	EDUCATION,
	EXPERIENCE,
	LANGUAGES,
	ORG_LINKS,
	SKILL_GROUPS,
	text,
	type OrgMark,
	type Role
} from './about';
import { allArticles, getArticle, type Article } from './articles';
import { areaLabel } from './areas';
import { fichas, getProject, type ProjectMeta } from './content';
import { LANGS, path as routePath, t, type Lang, type RouteKey } from './i18n';
import { orgMark, splitOrg } from './org';
import { PERSON, SITE_URL, absolute } from './site';

type Node = Record<string, unknown>;

export type GraphInput = {
	lang: Lang;
	key: RouteKey | null;
	slug?: string;
	title: string;
	description: string;
	canonical: string;
	ogImage: string | null;
	noindex?: boolean;
};

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const PORTRAIT_ID = `${SITE_URL}/#portrait`;

const ref = (id: string) => ({ '@id': id });
const orgId = (mark: OrgMark) => `${SITE_URL}/#org-${mark}`;

const ROLES: Role[] = [...EXPERIENCE, ...EDUCATION];

function orgName(mark: OrgMark, lang: Lang): string {
	const match = ROLES.find((role) => role.mark === mark);
	if (!match) return mark;
	return match.shortOrg ?? splitOrg(text(match.org, lang)).name;
}

function organisationNode(mark: OrgMark, lang: Lang): Node {
	const link = ORG_LINKS[mark];
	return {
		'@type': mark === 'utn' ? 'CollegeOrUniversity' : 'Organization',
		'@id': orgId(mark),
		name: orgName(mark, lang),
		...(link ? { sameAs: link } : {})
	};
}

function portraitNode(): Node {
	return {
		'@type': 'ImageObject',
		'@id': PORTRAIT_ID,
		url: absolute('/img/alex.jpg'),
		contentUrl: absolute('/img/alex.jpg'),
		width: 448,
		height: 448
	};
}

function personNode(lang: Lang, detail: 'full' | 'stub'): Node {
	const strings = t(lang);
	const base: Node = {
		'@type': 'Person',
		'@id': PERSON_ID,
		name: PERSON.name,
		// La forma corta es la que la gente teclea y la que comparten miles de
		// homonimos. Declararla aqui la ata a esta entidad sin cederle el <title>.
		alternateName: PERSON.shortName,
		url: SITE_URL,
		jobTitle: strings.home.role,
		sameAs: [PERSON.linkedin, PERSON.github, PERSON.instagram],
		mainEntityOfPage: absolute(routePath(lang, 'about'))
	};

	if (detail === 'stub') return base;

	const currentOrgs = EXPERIENCE.filter((role) => role.current && role.mark);

	return {
		...base,
		givenName: PERSON.givenName,
		familyName: PERSON.familyName,
		description: strings.home.headline,
		email: `mailto:${PERSON.email}`,
		image: ref(PORTRAIT_ID),
		address: {
			'@type': 'PostalAddress',
			addressLocality: PERSON.address.locality,
			addressRegion: PERSON.address.region,
			addressCountry: PERSON.address.countryCode
		},
		homeLocation: {
			'@type': 'Place',
			name: `${PERSON.address.locality}, ${PERSON.address.region}`,
			address: {
				'@type': 'PostalAddress',
				addressLocality: PERSON.address.locality,
				addressRegion: PERSON.address.region,
				addressCountry: PERSON.address.countryCode
			}
		},
		knowsAbout: SKILL_GROUPS.flatMap((group) => group.items.map((item) => text(item, lang))),
		knowsLanguage: LANGUAGES.map((language) => ({
			'@type': 'Language',
			name: language.label[lang],
			alternateName: language.code
		})),
		hasCredential: CERTIFICATIONS.filter((cert) => !cert.status).map((cert) => ({
			'@type': 'EducationalOccupationalCredential',
			name: cert.name,
			credentialCategory: 'certificate',
			recognizedBy: { '@type': 'Organization', name: cert.issuer }
		})),
		alumniOf: EDUCATION.filter((role) => role.mark).map((role) => ref(orgId(role.mark!))),
		worksFor: [...new Set(currentOrgs.map((role) => role.mark!))].map((mark) => ref(orgId(mark)))
	};
}

function websiteNode(lang: Lang): Node {
	return {
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		url: SITE_URL,
		name: t(lang).meta.siteName,
		inLanguage: LANGS,
		author: ref(PERSON_ID),
		publisher: ref(PERSON_ID),
		copyrightHolder: ref(PERSON_ID)
	};
}

function breadcrumbNode(input: GraphInput, key: RouteKey): Node | null {
	const strings = t(input.lang);
	const home = {
		'@type': 'ListItem',
		position: 1,
		name: strings.nav.home,
		item: absolute(routePath(input.lang, 'home'))
	};

	if (key === 'home') return null;

	const trail: Node[] = [home];

	if (key === 'project' || key === 'article') {
		const parent = key === 'project' ? 'projects' : 'blog';
		trail.push({
			'@type': 'ListItem',
			position: 2,
			name: strings.nav[parent],
			item: absolute(routePath(input.lang, parent))
		});
		trail.push({ '@type': 'ListItem', position: 3, name: input.title });
	} else {
		trail.push({ '@type': 'ListItem', position: 2, name: strings.nav[key] });
	}

	return {
		'@type': 'BreadcrumbList',
		'@id': `${input.canonical}#breadcrumb`,
		itemListElement: trail
	};
}

function cardNode(input: GraphInput): Node | null {
	if (!input.ogImage) return null;
	return {
		'@type': 'ImageObject',
		'@id': `${input.canonical}#card`,
		url: input.ogImage,
		contentUrl: input.ogImage,
		width: 1200,
		height: 630
	};
}

function projectNode(
	input: GraphInput,
	meta: ProjectMeta
): { node: Node; marks: OrgMark[] } {
	const strings = t(input.lang);
	const parts = meta.org ? splitOrg(meta.org) : null;
	const source = orgMark(meta.org);
	const via = parts?.qualifier ? orgMark(parts.qualifier.replace(/^(vía|via)\s+/i, '')) : null;
	const links = [meta.repo, meta.site].filter((link): link is string => Boolean(link));

	const node: Node = {
		'@type': 'CreativeWork',
		'@id': `${input.canonical}#work`,
		name: meta.title,
		description: meta.tagline,
		url: input.canonical,
		mainEntityOfPage: ref(`${input.canonical}#webpage`),
		inLanguage: input.lang,
		genre: strings.kind[meta.kind],
		author: ref(PERSON_ID),
		creator: ref(PERSON_ID),
		temporalCoverage: `${meta.period.start}/${meta.period.end ?? '..'}`,
		about: meta.areas.map((area) => ({ '@type': 'Thing', name: areaLabel(area, input.lang) })),
		keywords: meta.stack,
		...(links.length ? { sameAs: links } : {}),
		...(source ? { sourceOrganization: ref(orgId(source)) } : {}),
		...(via ? { provider: ref(orgId(via)) } : {}),
		copyrightHolder:
			meta.kind === 'profesional' && source ? ref(orgId(source)) : ref(PERSON_ID)
	};

	const marks = [source, via].filter((mark): mark is OrgMark => Boolean(mark));
	return { node, marks };
}

async function itemListNode(input: GraphInput): Promise<Node> {
	const list = await fichas(input.lang);
	return {
		'@type': 'ItemList',
		'@id': `${input.canonical}#projects`,
		numberOfItems: list.length,
		itemListElement: list.map((project, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: project.meta.title,
			url: absolute(routePath(input.lang, 'project', project.meta.slug))
		}))
	};
}

async function articleListNode(input: GraphInput): Promise<Node> {
	const list = await allArticles(input.lang);
	return {
		'@type': 'ItemList',
		'@id': `${input.canonical}#articles`,
		numberOfItems: list.length,
		itemListElement: list.map((article, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: article.meta.title,
			url: absolute(routePath(input.lang, 'article', article.meta.slug))
		}))
	};
}

function articleNode(input: GraphInput, article: Article): Node {
	const meta = article.meta;

	return {
		'@type': 'TechArticle',
		'@id': `${input.canonical}#article`,
		headline: meta.title,
		description: meta.tagline,
		url: input.canonical,
		mainEntityOfPage: ref(`${input.canonical}#webpage`),
		inLanguage: input.lang,
		datePublished: meta.published,
		dateModified: meta.updated ?? meta.published,
		author: ref(PERSON_ID),
		publisher: ref(PERSON_ID),
		copyrightHolder: ref(PERSON_ID),
		about: meta.areas.map((area) => ({ '@type': 'Thing', name: areaLabel(area, input.lang) })),
		articleSection: areaLabel(meta.areas[0], input.lang),
		wordCount: article.entry.body?.trim().split(/\s+/).filter(Boolean).length ?? 0,
		...(meta.repo ? { codeRepository: meta.repo } : {}),
		...(input.ogImage ? { image: ref(`${input.canonical}#card`) } : {})
	};
}

const PAGE_TYPE: Record<RouteKey, string> = {
	home: 'WebPage',
	projects: 'CollectionPage',
	project: 'WebPage',
	blog: 'CollectionPage',
	article: 'WebPage',
	about: 'ProfilePage',
	contact: 'ContactPage'
};

export async function buildGraph(input: GraphInput): Promise<string | null> {
	if (input.key === null || input.noindex) return null;

	const key = input.key;
	const profile = key === 'home' || key === 'about';
	const marks = new Set<OrgMark>();

	const page: Node = {
		'@type': PAGE_TYPE[key],
		'@id': `${input.canonical}#webpage`,
		url: input.canonical,
		name: input.title,
		description: input.description,
		inLanguage: input.lang,
		isPartOf: ref(WEBSITE_ID)
	};

	const nodes: Node[] = [personNode(input.lang, profile ? 'full' : 'stub'), websiteNode(input.lang)];

	if (profile) {
		nodes.push(portraitNode());
		for (const role of ROLES) {
			if (role.mark && (role.current || EDUCATION.includes(role))) marks.add(role.mark);
		}
	}

	if (key === 'home' || key === 'about' || key === 'contact') {
		page[key === 'home' ? 'about' : 'mainEntity'] = ref(PERSON_ID);
	}

	if (key === 'projects') {
		const list = await itemListNode(input);
		page.mainEntity = ref(list['@id'] as string);
		nodes.push(list);
	}

	if (key === 'project' && input.slug) {
		const project = await getProject(input.lang, input.slug);
		if (project) {
			const { node, marks: used } = projectNode(input, project.meta);
			page.mainEntity = ref(node['@id'] as string);
			nodes.push(node);
			used.forEach((mark) => marks.add(mark));
		}
	}

	if (key === 'blog') {
		const list = await articleListNode(input);
		page.mainEntity = ref(list['@id'] as string);
		nodes.push(list);
	}

	if (key === 'article' && input.slug) {
		const article = await getArticle(input.lang, input.slug);
		if (article) {
			const node = articleNode(input, article);
			page.mainEntity = ref(node['@id'] as string);
			nodes.push(node);
		}
	}

	const breadcrumb = breadcrumbNode(input, key);
	if (breadcrumb) page.breadcrumb = ref(breadcrumb['@id'] as string);

	const card = cardNode(input);
	if (card) page.primaryImageOfPage = ref(card['@id'] as string);

	for (const mark of marks) nodes.push(organisationNode(mark, input.lang));
	nodes.push(page);
	if (breadcrumb) nodes.push(breadcrumb);
	if (card) nodes.push(card);

	return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}
