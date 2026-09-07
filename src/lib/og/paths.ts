import { path as routePath, type Lang, type RouteKey } from '../i18n';

export const OG_CARD = { width: 1200, height: 630, type: 'image/png' } as const;

/**
 * The card URL mirrors the page URL, built from the same `path()` that produces
 * canonicals. A flat `<slug>-<lang>.png` would need its own namespace the day a
 * ficha is called "about".
 *
 * Nothing here may import the renderer: seo.ts pulls this in on every page, and
 * @resvg/resvg-js has no business in the page graph.
 */
export function ogCardPath(lang: Lang, key: RouteKey, slug?: string): string {
	return `/img/og${routePath(lang, key, slug)}.png`;
}
