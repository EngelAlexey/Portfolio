import type { APIRoute } from 'astro';
import { allArticles } from '../lib/articles';
import { areaLabel } from '../lib/areas';
import { fichas } from '../lib/content';
import { DEFAULT_LANG, other, path as routePath, t } from '../lib/i18n';
import { absolute, PERSON, locationLine } from '../lib/site';

// Convencion llmstxt.org: un indice en Markdown, en la raiz, pensado para que
// un modelo lea la estructura del sitio sin tener que rastrear el HTML. No hay
// garantia de que ningun proveedor lo consuma; cuesta un archivo generado.
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
		`Sitio bilingüe: el árbol en español cuelga de \`/es\` y el inglés de \`/en\`. Cada dirección de esta lista tiene su equivalente cambiando ese prefijo.`,
		''
	];

	if (articles.length) {
		sections.push('## Artículos', '');
		for (const { meta, path: segment } of articles) {
			const areas = meta.areas.map((area) => areaLabel(area, lang)).join(', ');
			sections.push(
				line(
					meta.title,
					absolute(routePath(lang, 'article', segment)),
					`${meta.tagline} Publicado ${meta.updated ?? meta.published}. Área: ${areas}.`
				)
			);
		}
		sections.push('', `Feed: ${absolute(`/${lang}/blog.xml`)}`, '');
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
