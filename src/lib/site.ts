export const SITE_URL = import.meta.env.SITE.replace(/\/+$/, '');

export const absolute = (path: string): string =>
	`${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const PERSON = {
	name: 'Alex Herrera Manzanares',
	givenName: 'Alex',
	familyName: 'Herrera Manzanares',
	email: 'alexhmanzanares@gmail.com',
	address: {
		locality: 'El Roble',
		region: 'Puntarenas',
		country: 'Costa Rica',
		countryCode: 'CR'
	},
	availability: {
		es: 'Práctica profesional universitaria de enero a abril de 2027. Remoto, híbrido o presencial en Puntarenas y alrededores.',
		en: 'University internship from January to April 2027. Remote, hybrid or on-site around Puntarenas.'
	},
	linkedin: 'https://www.linkedin.com/in/alex-herrera-manzanares-b000ba379',
	github: 'https://github.com/EngelAlexey'
} as const;

export const locationLine = (): string =>
	`${PERSON.address.locality}, ${PERSON.address.region}, ${PERSON.address.country}`;

export const CV_VARIANTS = ['ciberseguridad', 'desarrollo', 'general'] as const;
export type CvVariant = (typeof CV_VARIANTS)[number];

export const CV_DEFAULT: CvVariant = 'ciberseguridad';

export const CV: Record<CvVariant, { es: string; en: string }> = {
	ciberseguridad: {
		es: '/cv/CV-Alex-Herrera-Manzanares-ciberseguridad-es.pdf',
		en: '/cv/CV-Alex-Herrera-Manzanares-ciberseguridad-en.pdf'
	},
	desarrollo: {
		es: '/cv/CV-Alex-Herrera-Manzanares-desarrollo-es.pdf',
		en: '/cv/CV-Alex-Herrera-Manzanares-desarrollo-en.pdf'
	},
	general: {
		es: '/cv/CV-Alex-Herrera-Manzanares-general-es.pdf',
		en: '/cv/CV-Alex-Herrera-Manzanares-general-en.pdf'
	}
};

export const ANALYTICS = {
	ga4: 'G-TB0F0YLTWX'
} as const;
