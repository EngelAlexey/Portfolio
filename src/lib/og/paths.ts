import { path as routePath, type Lang, type RouteKey } from '../i18n';

export const OG_CARD = { width: 1200, height: 630, type: 'image/png' } as const;

export function ogCardPath(lang: Lang, key: RouteKey, slug?: string): string {
	return `/img/og${routePath(lang, key, slug)}.png`;
}
