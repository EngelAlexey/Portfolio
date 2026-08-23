import type { Lang } from './i18n';

/**
 * Stable biographical facts, mirrored from `D:/GitHub/Personal/CV/cv-es.html`
 * (the live rendered CV — `cv.json` is stale). Prose for the About page arrives
 * with the content pass; this file holds only what does not change often.
 */

type Bilingual = Record<Lang, string>;

export type Role = {
	period: Bilingual;
	title: Bilingual;
	org: string;
	detail: Bilingual;
	/** Which employer mark to draw, when there is one. */
	mark?: 'intercargo' | 'kaizen' | 'starcargo';
	/** Short form for the home page strip, where the full title is too long. */
	shortOrg?: string;
};

export const EXPERIENCE: Role[] = [
	{
		period: { es: 'Ago 2026 — Actualidad', en: 'Aug 2026 — Present' },
		title: { es: 'Desarrollador de Software', en: 'Software Developer' },
		org: 'Intercargo Panamá — vía Kaizen Apps CR',
		shortOrg: 'Intercargo Panamá',
		mark: 'intercargo',
		detail: {
			es: 'Construyo en solitario la plataforma corporativa completa —sitio público, portal interno, debida diligencia y cuentas por cobrar— y diseñé su modelo de seguridad: dos instancias separadas por criticidad de secretos, identidad por invitación, sesiones revocables y defensa contra inyección de prompt.',
			en: 'I build the whole corporate platform single-handed — public site, internal portal, due diligence and accounts receivable — and designed its security model: two instances split by how critical their secrets are, invite-based identity, revocable sessions and prompt-injection defence.'
		}
	},
	{
		period: { es: '2024 — Actualidad', en: '2024 — Present' },
		title: {
			es: 'Desarrollador de Software y Soporte Técnico N2',
			en: 'Software Developer & N2 Technical Support'
		},
		org: 'Kaizen Apps CR',
		mark: 'kaizen',
		detail: {
			es: 'Plataforma web oficial y un catálogo de cuatro sistemas internos, de la propuesta a producción; aporto al ERP de RRHH que la empresa licencia, y rediseñé el sitio corporativo bilingüe. Soporte N2: rastreo la falla hasta el código y la corrijo.',
			en: 'Official web platform and a catalogue of four internal systems, from proposal to production; I contribute to the HR ERP the company licenses, and rebuilt the bilingual corporate site. N2 support: I trace the fault to the code and fix it.'
		}
	},
	{
		period: { es: '2025 — Actualidad', en: '2025 — Present' },
		title: {
			es: 'Desarrollador Web y Soporte Técnico N1',
			en: 'Web Developer & N1 Technical Support'
		},
		org: 'Star Cargo Service',
		mark: 'starcargo',
		detail: {
			es: 'CRM logístico a la medida construido en dos meses: 15 pantallas sobre 18 módulos de backend, con automatización de flujos de venta y sincronización en tiempo real. Soporte N1. Colaboración por proyectos.',
			en: 'Bespoke logistics CRM built in two months: 15 screens over 18 backend modules, with sales-flow automation and real-time sync. N1 support. Project-based collaboration.'
		}
	}
];

export const EDUCATION: Role[] = [
	{
		period: { es: '2024 — Actualidad', en: '2024 — Present' },
		title: {
			es: 'Ingeniería en Tecnologías de la Información',
			en: 'Information Technology Engineering'
		},
		org: 'Universidad Técnica Nacional — Sede Pacífico, El Roble',
		detail: { es: '', en: '' }
	}
];

export const CERTIFICATIONS: { name: string; issuer: string }[] = [
	{ name: 'Introduction to Cybersecurity', issuer: 'Cisco' }
];

export const LANGUAGES: { label: Bilingual; level: Bilingual }[] = [
	{
		label: { es: 'Español', en: 'Spanish' },
		level: { es: 'Nativo', en: 'Native' }
	},
	{
		label: { es: 'Inglés', en: 'English' },
		level: {
			es: 'Avanzado — certificado PIT-UTN',
			en: 'Advanced — PIT-UTN certified'
		}
	}
];

export const SKILL_GROUPS: { label: Bilingual; items: string[] }[] = [
	{
		label: { es: 'Lenguajes', en: 'Languages' },
		items: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'Java', 'Kotlin', 'C#']
	},
	{
		label: { es: 'Frontend', en: 'Frontend' },
		items: ['React', 'Next.js', 'Astro', 'SvelteKit', 'Angular', 'Tailwind CSS', 'Vite']
	},
	{
		label: { es: 'Backend', en: 'Backend' },
		items: ['Node.js', 'NestJS', 'Express', 'REST', 'WebSockets']
	},
	{
		label: { es: 'Móvil', en: 'Mobile' },
		items: ['React Native (Expo)', 'Android Studio', 'Flutter']
	},
	{
		label: { es: 'Bases de datos', en: 'Databases' },
		items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Supabase', 'MongoDB', 'Firebase']
	},
	{
		label: { es: 'Nube y DevOps', en: 'Cloud & DevOps' },
		items: ['Google Cloud', 'AWS', 'Azure', 'Vercel', 'Render', 'Docker', 'GitHub Actions']
	},
	{
		label: { es: 'Redes y sistemas', en: 'Networking & systems' },
		items: ['Linux', 'VLAN', 'DNS', 'VPN', 'Administración de servidores']
	},
	{
		label: { es: 'Seguridad', en: 'Security' },
		items: [
			'RBAC',
			'CSP',
			'Rate limiting',
			'Validación de entradas',
			'Auditoría',
			'Análisis de malware'
		]
	},
	{
		label: { es: 'Pruebas', en: 'Testing' },
		items: ['Vitest', 'Playwright', 'Jest']
	},
	{
		label: { es: 'IA Generativa', en: 'Generative AI' },
		items: ['RAG', 'APIs de IA', 'MCP', 'CLIs de IA', 'Automatizaciones']
	}
];
