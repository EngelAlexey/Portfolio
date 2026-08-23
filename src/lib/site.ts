import { env } from '$env/dynamic/public';

/**
 * Every canonical, hreflang, Open Graph and sitemap URL is built from this.
 * Set `PUBLIC_SITE_URL` in Vercel when the custom domain lands — no code change.
 */
const FALLBACK_ORIGIN = 'https://alexherrera.vercel.app';

export const SITE_URL = (env.PUBLIC_SITE_URL ?? FALLBACK_ORIGIN).replace(/\/+$/, '');

export const absolute = (path: string): string =>
	`${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const PERSON = {
	name: 'Alex Herrera Manzanares',
	email: 'alexhmanzanares@gmail.com',
	location: {
		es: 'El Roble, Puntarenas, Costa Rica',
		en: 'El Roble, Puntarenas, Costa Rica'
	},
	availability: {
		es: 'Práctica profesional de enero a abril de 2027, a tiempo completo. Remoto, híbrido o presencial en Puntarenas y alrededores.',
		en: 'Full-time professional internship, January to April 2027. Remote, hybrid or on-site around Puntarenas.'
	},
	linkedin: 'https://www.linkedin.com/in/alex-herrera-manzanares-b000ba379',
	github: 'https://github.com/EngelAlexey',
	/** Repository of this site — the only source link in the footer. */
	source: 'https://github.com/EngelAlexey/portfolio'
} as const;

/**
 * Written by `scripts/sync-cv.mjs`, which copies from D:/GitHub/Personal/CV.
 * `en` stays null until the English CV exists; the UI says so instead of
 * shipping a dead link.
 */
export const CV = {
	es: '/cv/CV-Alex-Herrera-Manzanares-es.pdf',
	en: null as string | null
} as const;
