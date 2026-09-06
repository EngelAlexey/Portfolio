export const FALLBACK_ORIGIN = 'https://alexherrera.vercel.app';

/** Trailing slashes here would double up in every canonical and sitemap URL. */
export const siteUrl = () =>
	(process.env.PUBLIC_SITE_URL ?? FALLBACK_ORIGIN).replace(/\/+$/, '');
