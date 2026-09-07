import type { Lang } from './i18n';

type Bilingual = Record<Lang, string>;
type BilingualList = Record<Lang, string[]>;

export type Text = string | Bilingual;

export const text = (value: Text, lang: Lang): string =>
	typeof value === 'string' ? value : value[lang];

export type Role = {
	period: Bilingual;
	/** How the working relationship is set up. Shown under the organisation. */
	engagement?: Bilingual;
	/** Machine dates behind `period`. */
	range: { start: string; end: string | null };
	title: Bilingual;
	org: Text;
	detail: BilingualList;
	mark?: 'intercargo' | 'kaizen' | 'starcargo' | 'utn';
	post?: Bilingual;
	shortOrg?: string;
	current?: boolean;
};

export type OrgMark = NonNullable<Role['mark']>;

export const WORDMARKS = new Set(['intercargo', 'kaizen', 'starcargo', 'utn']);

export const ORG_LINKS: Partial<Record<OrgMark, string>> = {
	intercargo: 'https://intercargopanama.com',
	kaizen: 'https://www.kaizenapps.net',
	starcargo: 'https://www.starcargoservice.com',
	utn: 'https://www.utn.ac.cr'
};

export const EXPERIENCE: Role[] = [
	{
		period: { es: 'Jul 2026 — Actualidad', en: 'Jul 2026 — Present' },
		engagement: { es: 'Cliente de Kaizen Apps CR', en: 'Client of Kaizen Apps CR' },
		range: { start: '2026-07', end: null },
		title: { es: 'Desarrollador de Software', en: 'Software Developer' },
		org: { es: 'Intercargo Panamá — vía Kaizen Apps CR', en: 'Intercargo Panamá — via Kaizen Apps CR' },
		shortOrg: 'Intercargo Panamá',
		mark: 'intercargo',
		current: true,
		detail: {
			es: [
				'Construyo la plataforma corporativa: sitio público, portal del personal, debida diligencia y cuentas por cobrar.',
				'Definí el modelo de seguridad: dos instancias separadas por criticidad de secretos, identidad por invitación y sesiones revocables.',
				'Automaticé la debida diligencia, con extracción por modelo y validación contra esquema en el código.',
				'Cubrí el sistema con 2 243 pruebas unitarias y 27 suites end to end.',
				'Desplegué la infraestructura en contenedores sobre Google Cloud Run.'
			],
			en: [
				'Build the corporate platform: public site, staff portal, client due diligence and accounts receivable.',
				'Defined the security model: two instances split by how critical their secrets are, invite-based identity and revocable sessions.',
				'Automated due diligence, with model-driven extraction and schema validation enforced in code.',
				'Covered the system with 2,243 unit tests and 27 end-to-end suites.',
				'Deployed the infrastructure in containers on Google Cloud Run.'
			]
		}
	},
	{
		period: { es: 'Ene 2024 — Actualidad', en: 'Jan 2024 — Present' },
		engagement: { es: 'Empleado, tiempo completo', en: 'Employee, full-time' },
		range: { start: '2024-01', end: null },
		title: {
			es: 'Desarrollador de Software y Soporte Técnico N2',
			en: 'Software Developer & N2 Technical Support'
		},
		org: 'Kaizen Apps CR',
		mark: 'kaizen',
		current: true,
		detail: {
			es: [
				'Diseño y construyo los sistemas nuevos del equipo, del levantamiento de requerimientos a producción y mantenimiento.',
				'Entregué cuatro sistemas a la medida, entre ellos Kaizen AI y Seiri.',
				'Rehice el sitio de la empresa, kaizenapps.net, con español e inglés desde una sola fuente y el SEO que antes no existía.',
				'Corrijo y actualizo el ERP que la empresa licencia cuando la tarea me toca; su desarrollo y su soporte diario los lleva el resto del equipo.',
				'Doy soporte de nivel 2, rastreando la falla hasta el código que la produce.',
				'Ningún sistema se libera sin pruebas del equipo y del cliente ni sin aprobación de gerencia.'
			],
			en: [
				'Design and build the new systems the team delivers, from requirements through to production and maintenance.',
				'Delivered four bespoke systems, among them Kaizen AI and Seiri.',
				'Rebuilt the company site, kaizenapps.net, with Spanish and English from a single source and the SEO it previously lacked.',
				'Fix and update the ERP the company licenses when the task falls to me; its development and its day-to-day support sit with the rest of the team.',
				'Provide level 2 support, tracing a fault down to the code behind it.',
				'No system ships without testing by the team and the client, and without management approval.'
			]
		}
	},
	{
		period: { es: 'Ene 2026 — Actualidad', en: 'Jan 2026 — Present' },
		engagement: { es: 'Contratado por proyecto', en: 'Contracted per project' },
		range: { start: '2026-01', end: null },
		title: { es: 'Desarrollador Web', en: 'Web Developer' },
		org: 'Star Cargo Service',
		mark: 'starcargo',
		current: true,
		detail: {
			es: [
				'Construí el CRM comercial que sustituyó la gestión en hojas de cálculo.',
				'Amplié el sitio y sus trámites en línea a lo largo del año, hasta rediseñarlo por completo como un proyecto aparte dentro del mismo repositorio, con build y dependencias propias.',
				'Levanté el portal con sesión donde el cliente sigue sus solicitudes, con los permisos resueltos contra el ERP en cada petición.',
				'Di mantenimiento, corregí defectos y escribí pruebas sobre el API de bodega y la app de rastreo de viajes.'
			],
			en: [
				'Built the sales CRM that replaced the spreadsheet workflow.',
				'Extended the site and its online forms through the year, then rebuilt it entirely as a separate project inside the same repository, with its own build and dependencies.',
				'Stood up the portal where clients follow their requests behind a session, with permissions resolved against the ERP on every request.',
				'Maintained, debugged and wrote tests for the warehouse API and the trip-tracking app.'
			]
		}
	},
	{
		period: { es: 'Ene 2025 — Ene 2026', en: 'Jan 2025 — Jan 2026' },
		range: { start: '2025-01', end: '2026-01' },
		title: { es: 'Soporte Técnico N1', en: 'N1 Technical Support' },
		org: 'Star Cargo Service',
		detail: {
			es: [
				'Resolví incidencias de conectividad y configuración de equipos para los usuarios de la organización, de forma remota y presencial.'
			],
			en: [
				'Resolved connectivity and workstation-configuration incidents for the people in the organisation, remotely and on site.'
			]
		}
	}
];

export function postAt(key: string, lang: Lang): { title: string; mark?: Role['mark'] } | null {
	const named = (role: Role) =>
		text(role.org, lang).split(' — ')[0].trim() === key ||
		(typeof role.org === 'string' ? role.org : role.org.es).split(' — ')[0].trim() === key;

	const match = EXPERIENCE.find(named) ?? EDUCATION.find(named);
	return match ? { title: (match.post ?? match.title)[lang], mark: match.mark } : null;
}

export const EDUCATION: Role[] = [
	{
		period: { es: 'Ene 2024 — Actualidad', en: 'Jan 2024 — Present' },
		engagement: { es: 'Sede Pacífico, El Roble', en: 'Pacífico campus, El Roble' },
		range: { start: '2024-01', end: null },
		title: {
			es: 'Bachillerato en Ingeniería en Tecnologías de la Información',
			en: 'BSc in Information Technology Engineering'
		},
		org: 'Universidad Técnica Nacional — Sede Pacífico, El Roble',
		mark: 'utn',
		current: true,
		post: { es: 'Ingeniería en Tecnologías de la Información', en: 'Information Technology Engineering' },
		detail: {
			es: [
				'Diseñé la red lógica y el apartado de cumplimiento de una cadena hotelera de cuatro sedes, en Proyecto Integrador II.',
				'Aporté la mayor parte del API de seguimiento de flota en tiempo real de Proyecto Integrador III, en equipo de seis.',
				'Construí en Seguridad de TI I un detector que contiene un cifrado masivo sin firmas, a partir de tres señales del sistema.',
				'Levanté la base analítica, el ETL y el informe de un almacén de 8,6 millones de filas, y llevé su migración a la nube.',
				'Ejecuté el trabajo comunal universitario para el Grupo 35 de Guías y Scouts: sitio en dos idiomas e inscripciones en línea.'
			],
			en: [
				'Designed the logical network and the compliance section for a four-site hotel chain, in Integrative Project II.',
				'Contributed most of the API behind the real-time fleet tracking of Integrative Project III, in a team of six.',
				'Built, in IT Security I, a detector that contains mass encryption without signatures, from three system signals.',
				'Built the analytical database, the ETL and the report for an 8.6 million row warehouse, and led its move to the cloud.',
				'Delivered the community-service requirement for Group 35 of the Guides and Scouts: a two-language site and online enrolment.'
			]
		}
	}
];

export const CERTIFICATIONS: { name: string; issuer: string; status?: Bilingual }[] = [
	{ name: 'Introduction to Cybersecurity', issuer: 'Cisco Networking Academy' },
	{
		name: 'Google Cloud Computing Foundations',
		issuer: 'Google Cloud',
		status: { es: 'en curso', en: 'in progress' }
	}
];

export const LANGUAGES: { code: Lang; label: Bilingual; level: Bilingual }[] = [
	{
		code: 'es',
		label: { es: 'Español', en: 'Spanish' },
		level: { es: 'Nativo', en: 'Native' }
	},
	{
		code: 'en',
		label: { es: 'Inglés', en: 'English' },
		level: {
			es: 'Avanzado — certificado PIT-UTN',
			en: 'Advanced — PIT-UTN certified'
		}
	}
];

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
