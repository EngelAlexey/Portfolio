import { error } from '@sveltejs/kit';
import { fichaSlugs, getProject } from '$lib/content';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => fichaSlugs().map((slug) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	if (!getProject('en', params.slug)) error(404, 'Project not found');
	return { slug: params.slug };
};
