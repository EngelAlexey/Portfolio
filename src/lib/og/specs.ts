import { areaLabel, type AreaId } from '../areas';
import { fichas } from '../content';
import { formatPeriod } from '../format';
import { LANGS, t, type Lang, type RouteKey } from '../i18n';
import { PERSON } from '../site';
import { ogCardPath } from './paths';

export type CardSpec = {
	/** The `[...route]` param: the card path without its /img/og prefix or extension. */
	route: string;
	lang: Lang;
	eyebrow: string;
	heading: string;
	meta: string | null;
	areas: AreaId[];
	/** 'brand' keeps the security hue the card has always been ruled with. */
	accent: AreaId | 'brand';
	portrait: boolean;
	/** Bottom line. Defaults to the name, except where the heading already is it. */
	footer: string;
};

const PLACE = 'Costa Rica';

const routeOf = (lang: Lang, key: RouteKey, slug?: string): string =>
	ogCardPath(lang, key, slug).replace(/^\/img\/og\//, '').replace(/\.png$/, '');

function fixedCards(lang: Lang): CardSpec[] {
	const strings = t(lang);
	const eyebrow = PLACE.toUpperCase();

	return [
		{
			route: routeOf(lang, 'home'),
			lang,
			eyebrow,
			heading: PERSON.name,
			meta: strings.home.role,
			areas: [],
			accent: 'brand',
			portrait: true,
			// The heading is already the name; repeating it in the footer reads as a bug.
			footer: strings.home.headline
		},
		{
			route: routeOf(lang, 'about'),
			lang,
			eyebrow,
			heading: strings.about.title,
			meta: strings.about.lead,
			areas: [],
			accent: 'brand',
			portrait: true,
			footer: PERSON.name
		},
		{
			route: routeOf(lang, 'projects'),
			lang,
			eyebrow,
			heading: strings.projects.title,
			meta: strings.projects.lead,
			areas: [],
			accent: 'brand',
			portrait: false,
			footer: PERSON.name
		},
		{
			route: routeOf(lang, 'contact'),
			lang,
			eyebrow,
			heading: strings.contact.title,
			meta: strings.contact.lead,
			areas: [],
			accent: 'brand',
			portrait: false,
			footer: PERSON.name
		}
	];
}

async function fichaCards(lang: Lang): Promise<CardSpec[]> {
	const strings = t(lang);

	return (await fichas(lang)).map(({ meta }) => {
		const period = formatPeriod(meta.period, strings.project.present, 'year');
		const org = meta.org ? meta.org.split(' — ')[0].trim() : null;

		return {
			route: routeOf(lang, 'project', meta.slug),
			lang,
			eyebrow: strings.kind[meta.kind].toUpperCase(),
			heading: meta.title,
			meta: [org, period].filter(Boolean).join(' · '),
			areas: meta.areas,
			// The first declared area is the one the page's lead chip shows.
			accent: meta.areas[0],
			portrait: false,
			footer: PERSON.name
		} satisfies CardSpec;
	});
}

/** Every card the site needs, which is also every route the endpoint serves. */
export async function cardSpecs(): Promise<CardSpec[]> {
	const perLang = await Promise.all(
		LANGS.map(async (lang) => [...fixedCards(lang), ...(await fichaCards(lang))])
	);
	return perLang.flat();
}

export const areaChips = (spec: CardSpec): { id: AreaId; label: string }[] =>
	spec.areas.map((id) => ({ id, label: areaLabel(id, spec.lang) }));
