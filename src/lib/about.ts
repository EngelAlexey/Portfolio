import type { Lang } from './i18n';

/**
 * Stable biographical facts, mirrored from `D:/GitHub/Personal/CV/cv.md` — the
 * superset fact base the CV variants are cut from. Keep this file in step with
 * it; the rendered `cv-*.html` files are per-audience subsets, so they are the
 * wrong thing to copy from.
 *
 * Two standing rules from the CV apply here as well: no exclusivity claims
 * ("en solitario", "único responsable") and no speed claims ("en dos meses"),
 * and no business metrics — client counts, revenue, real user numbers. Only
 * technical figures from his own engineering.
 */

type Bilingual = Record<Lang, string>;

/**
 * Most of these strings are proper nouns that read the same in both languages,
 * so a plain string means "identical in ES and EN" and only the ones that
 * actually differ carry a pair. Spelling every one of them out bilingually
 * would bury the handful that matter under duplicated product names.
 */
export type Text = string | Bilingual;

export const text = (value: Text, lang: Lang): string =>
	typeof value === 'string' ? value : value[lang];

export type Role = {
	period: Bilingual;
	title: Bilingual;
	org: Text;
	detail: Bilingual;
	/** Which employer mark to draw, when there is one. */
	mark?: 'intercargo' | 'kaizen' | 'starcargo' | 'utn';
	/** Short form for the home page strip, where the full title is too long. */
	shortOrg?: string;
};

/**
 * Marks that spell the organisation out. Where one of these is shown the name
 * does not need repeating underneath — the logo already says it. Anything not
 * listed here is a bare symbol, and its name still has to be written.
 */
export const WORDMARKS = new Set(['intercargo', 'kaizen', 'starcargo', 'utn']);

export const EXPERIENCE: Role[] = [
	{
		period: { es: 'Jul 2026 — Actualidad · por proyectos', en: 'Jul 2026 — Present · project-based' },
		title: { es: 'Desarrollador de Software', en: 'Software Developer' },
		org: { es: 'Intercargo Panamá — vía Kaizen Apps CR', en: 'Intercargo Panamá — via Kaizen Apps CR' },
		shortOrg: 'Intercargo Panamá',
		mark: 'intercargo',
		detail: {
			es: 'Trabajo en la plataforma corporativa: sitio público, portal interno, debida diligencia y cuentas por cobrar. Diseñé su modelo de seguridad, con dos instancias separadas por criticidad de secretos, identidad por invitación, sesiones revocables y defensa contra inyección de prompt.',
			en: 'I work on the corporate platform: public site, internal portal, due diligence and accounts receivable. I designed its security model, with two instances split by how critical their secrets are, invite-based identity, revocable sessions and prompt-injection defence.'
		}
	},
	{
		period: { es: 'Ene 2024 — Actualidad · tiempo completo', en: 'Jan 2024 — Present · full-time' },
		title: {
			es: 'Desarrollador de Software y Soporte Técnico N2',
			en: 'Software Developer & N2 Technical Support'
		},
		org: 'Kaizen Apps CR',
		mark: 'kaizen',
		detail: {
			es: 'Desarrollo de la plataforma web y de los sistemas internos de la empresa, de la propuesta a producción, y aportes al ERP de recursos humanos que licencia. En soporte N2 rastreo la falla hasta el código y la corrijo.',
			en: 'Development of the company web platform and its internal systems, from proposal to production, plus contributions to the HR ERP it licenses. In N2 support I trace the fault down to the code and fix it.'
		}
	},
	{
		period: { es: 'Ene 2026 — Actualidad · por proyectos', en: 'Jan 2026 — Present · project-based' },
		title: { es: 'Desarrollador Web', en: 'Web Developer' },
		org: 'Star Cargo Service',
		mark: 'starcargo',
		detail: {
			es: 'Desarrollo a la medida para la operación: CRM comercial, API de bodega para la app Android, app de rastreo de viajes y rediseño del sitio corporativo. Vigilo los avisos de seguridad de Supabase y delimito los permisos por rol sobre las tablas.',
			en: 'Bespoke development for the operation: a sales CRM, the warehouse API behind the Android app, a trip-tracking app, and the corporate site redesign. I watch Supabase security advisories and scope per-role permissions over the tables.'
		}
	},
	{
		period: { es: 'Ene 2025 — Ene 2026', en: 'Jan 2025 — Jan 2026' },
		title: { es: 'Soporte Técnico N1', en: 'N1 Technical Support' },
		org: 'Star Cargo Service',
		detail: {
			es: 'Incidencias de conectividad y configuración de equipos, con atención remota a los usuarios de la organización.',
			en: 'Connectivity and workstation-configuration incidents, with remote support for the people in the organisation.'
		}
	}
];

/**
 * What he was at a place, looked up by the same key the project timeline groups
 * on — the part of `org` before the em dash. Experience is searched before
 * education, and in its own order, so an employer answers with the most senior
 * post held there rather than the first one found.
 */
export function postAt(key: string, lang: Lang): { title: string; mark?: Role['mark'] } | null {
	const named = (role: Role) =>
		text(role.org, lang).split(' — ')[0].trim() === key ||
		(typeof role.org === 'string' ? role.org : role.org.es).split(' — ')[0].trim() === key;

	const match = EXPERIENCE.find(named) ?? EDUCATION.find(named);
	return match ? { title: match.title[lang], mark: match.mark } : null;
}

export const EDUCATION: Role[] = [
	{
		period: { es: 'Ene 2024 — Actualidad', en: 'Jan 2024 — Present' },
		title: {
			es: 'Bachillerato en Ingeniería en Tecnologías de la Información',
			en: 'BSc in Information Technology Engineering'
		},
		org: 'Universidad Técnica Nacional — Sede Pacífico, El Roble',
		mark: 'utn',
		detail: { es: '', en: '' }
	}
];

/**
 * `status` is separate from `issuer` because it is the only translatable part:
 * an issuer is a proper noun, "en curso" is not. Folding it into the issuer
 * string printed Spanish on the English page.
 */
export const CERTIFICATIONS: { name: string; issuer: string; status?: Bilingual }[] = [
	{ name: 'Introduction to Cybersecurity', issuer: 'Cisco Networking Academy' },
	{
		name: 'Google Cloud Computing Foundations',
		issuer: 'Google Cloud',
		status: { es: 'en curso', en: 'in progress' }
	}
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

/**
 * Mirrors the CV's trimmed skill list. Anything used only once is deliberately
 * absent: Angular, Express, Prisma, Turborepo, threat modelling, malware
 * analysis. C# and Flutter were listed here but appear nowhere in the CV or in
 * his own audit of what he has actually used, so they are gone too.
 */
export const SKILL_GROUPS: { label: Bilingual; items: Text[] }[] = [
	{
		label: { es: 'Lenguajes', en: 'Languages' },
		items: ['TypeScript', 'Python', 'SQL', 'Java', 'Kotlin']
	},
	{
		label: { es: 'Frontend', en: 'Frontend' },
		items: ['Next.js', 'Astro', 'Tailwind CSS', 'Vite']
	},
	{
		label: { es: 'Backend', en: 'Backend' },
		items: ['Node.js', 'NestJS', 'REST', 'WebSockets']
	},
	{
		label: { es: 'Móvil', en: 'Mobile' },
		items: ['React Native (Expo)', 'Android Studio', 'SQLite']
	},
	{
		label: { es: 'Bases de datos', en: 'Databases' },
		items: ['PostgreSQL', 'MySQL', 'SQL Server', 'MongoDB', 'Supabase', 'Firebase', 'Redis']
	},
	{
		label: { es: 'Nube y DevOps', en: 'Cloud & DevOps' },
		items: ['Google Cloud', 'AWS', 'Azure', 'Vercel', 'Render', 'Docker', 'GitHub Actions']
	},
	{
		label: { es: 'Redes y sistemas', en: 'Networking & systems' },
		items: ['Linux', 'VLAN', 'DNS', 'VPN', 'ACLs', 'Cisco Packet Tracer']
	},
	{
		label: { es: 'Seguridad', en: 'Security' },
		items: [
			'RBAC',
			'CSP',
			'Rate limiting',
			{ es: 'Gestión de secretos', en: 'Secrets management' },
			{ es: 'Validación de entradas', en: 'Input validation' },
			{ es: 'Auditoría', en: 'Auditing' },
			{ es: 'Evaluación de vulnerabilidades', en: 'Vulnerability assessment' },
			{ es: 'Pruebas de ataque', en: 'Attack testing' }
		]
	},
	{
		label: { es: 'Pruebas', en: 'Testing' },
		items: ['Vitest', 'Playwright', 'Jest']
	},
	{
		label: { es: 'IA Generativa', en: 'Generative AI' },
		items: [
			'RAG',
			{ es: 'APIs de LLM', en: 'LLM APIs' },
			'MCP',
			{ es: 'Bases vectoriales', en: 'Vector databases' }
		]
	}
];
