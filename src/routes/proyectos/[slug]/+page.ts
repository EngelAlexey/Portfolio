import { error } from '@sveltejs/kit';
import { fichaSlugs, getProject } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

/** Tells the prerenderer which project pages exist. */
export const entries: EntryGenerator = () => fichaSlugs().map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	if (!getProject('es', params.slug)) error(404, 'Proyecto no encontrado');
	return { slug: params.slug };
};
