import type { Handle } from '@sveltejs/kit';
import { langFromPathname } from '$lib/i18n';

/**
 * `<html lang>` has to be correct per language, and app.html is shared by both
 * route trees — so the placeholder is filled in at prerender time.
 */
export const handle: Handle = async ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', langFromPathname(event.url.pathname))
	});
