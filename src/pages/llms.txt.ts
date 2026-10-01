import type { APIRoute } from 'astro';
import { allArticles, articlesByCategory } from '../lib/articles';
import { areaLabel } from '../lib/areas';
import { fichas } from '../lib/content';
import { DEFAULT_LANG, other, path as routePath, t } from '../lib/i18n';
import { absolute, PERSON, locationLine } from '../lib/site';

export const GET: APIRoute = async () => {
	const lang = DEFAULT_LANG;
	const strings = t(lang);

	const articles = await allArticles(lang);
	const projects = await fichas(lang);

	const line = (title: string, url: string, note: string) => `- [${title}](${url}): ${note}`;

	const sections: string[] = [
		`# ${PERSON.name}`,
		'',
		`> ${strings.home.role}. ${locationLine()}. ${strings.home.headline}`,
		'',
		strings.home.pitch,
		'',
		`Sitio bilingüe: las páginas en español están bajo \`/es\` y las inglesas bajo \`/en\`. Cada dirección de esta lista tiene su equivalente en inglés al cambiar ese prefijo.`,
		''
	];

	if (articles.length) {
		sections.push('## Artículos', '');
		for (const { category, lead, rest } of await articlesByCategory(lang)) {
			sections.push(`### ${strings.blog.categories[category].label}`, '');
			for (const { meta, path: segment } of [lead, ...rest].filter((a) => a !== undefined)) {
				const areas = meta.areas.map((area) => areaLabel(area, lang)).join(', ');
				const dates =
					meta.updated && meta.updated !== meta.published
						? `Publicado ${meta.published}, actualizado ${meta.updated}.`
						: `Publicado ${meta.published}.`;
				sections.push(
					line(
						meta.title,
						absolute(routePath(lang, 'article', segment)),
						`${meta.tagline} ${dates} Área: ${areas}.`
					)
				);
			}
			sections.push('');
		}
		sections.push(`Feed: ${absolute(`/${lang}/blog.xml`)}`, '');
	}

	sections.push('## Proyectos', '');
	for (const { meta } of projects) {
		const areas = meta.areas.map((area) => areaLabel(area, lang)).join(', ');
		const org = meta.org ? ` ${meta.org}.` : '';
		sections.push(
			line(
				meta.title,
				absolute(routePath(lang, 'project', meta.slug)),
				`${meta.tagline}${org} Área: ${areas}. Stack: ${meta.stack.join(', ')}.`
			)
		);
	}

	sections.push(
		'',
		'## Páginas',
		'',
		line(strings.projects.title, absolute(routePath(lang, 'projects')), strings.projects.lead),
		line(strings.about.title, absolute(routePath(lang, 'about')), strings.about.lead),
		line(strings.contact.title, absolute(routePath(lang, 'contact')), strings.contact.lead),
		line(strings.scanner.title, absolute(routePath(lang, 'scanner')), strings.scanner.lead),
		'',
		'## Opcional',
		'',
		line(
			'Versión en inglés',
			absolute(routePath(other(lang), 'home')),
			'El mismo contenido con los segmentos de ruta en inglés.'
		),
		line('Mapa del sitio', absolute('/sitemap.xml'), 'Todas las direcciones con su fecha y sus alternativas de idioma.'),
		''
	);

	return new Response(sections.join('\n'), {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
