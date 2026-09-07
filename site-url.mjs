export const FALLBACK_ORIGIN = 'https://www.alexherrera.dev';

export const siteUrl = () =>
	(process.env.PUBLIC_SITE_URL ?? FALLBACK_ORIGIN).replace(/\/+$/, '');
