export const FALLBACK_ORIGIN = 'https://alexherrera.vercel.app';

export const siteUrl = () =>
	(process.env.PUBLIC_SITE_URL ?? FALLBACK_ORIGIN).replace(/\/+$/, '');
