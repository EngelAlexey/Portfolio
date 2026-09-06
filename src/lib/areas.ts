/**
 * The six areas of the profile. They are the only place colour carries meaning
 * on this site — every chip pairs its hue with its label so the encoding never
 * depends on colour alone.
 *
 * Order is deliberate: it is the order the areas are introduced on the home
 * page, from the broadest to the most specialised.
 */
export const AREA_IDS = ['fullstack', 'ia', 'datos', 'movil', 'seguridad', 'infra'] as const;

export type AreaId = (typeof AREA_IDS)[number];

type AreaMeta = {
	/** CSS custom-property prefix declared in app.css (`--area-<token>-fg`, …) */
	token: string;
	label: { es: string; en: string };
	/** One line, used on the home page area strip */
	blurb: { es: string; en: string };
};

export const AREAS: Record<AreaId, AreaMeta> = {
	fullstack: {
		token: 'fullstack',
		label: { es: 'Full Stack', en: 'Full Stack' },
		blurb: {
			es: 'Aplicaciones web de punta a punta: interfaz, API, base de datos y despliegue.',
			en: 'End-to-end web apps: interface, API, database and deployment.'
		}
	},
	ia: {
		token: 'ia',
		label: { es: 'IA', en: 'AI' },
		blurb: {
			es: 'Modelos integrados en producto, con las decisiones y los permisos fuera del prompt.',
			en: 'Models embedded in products, with decisions and permissions kept out of the prompt.'
		}
	},
	datos: {
		token: 'datos',
		label: { es: 'Datos', en: 'Data' },
		blurb: {
			es: 'Integración, modelado dimensional, ETL y explotación en tableros.',
			en: 'Integration, dimensional modelling, ETL and dashboard delivery.'
		}
	},
	movil: {
		token: 'movil',
		label: { es: 'Móvil', en: 'Mobile' },
		blurb: {
			es: 'Aplicaciones nativas y multiplataforma, incluido el caso sin conectividad.',
			en: 'Native and cross-platform apps, including the offline case.'
		}
	},
	seguridad: {
		token: 'seguridad',
		label: { es: 'Seguridad', en: 'Security' },
		blurb: {
			es: 'Control de acceso, validación, trazabilidad y análisis de malware.',
			en: 'Access control, validation, auditability and malware analysis.'
		}
	},
	infra: {
		token: 'infra',
		label: { es: 'Infraestructura', en: 'Infrastructure' },
		blurb: {
			es: 'Redes, nube y soporte: segmentación, disponibilidad y operación.',
			en: 'Networking, cloud and support: segmentation, availability and operations.'
		}
	}
};

export const areaLabel = (id: AreaId, lang: 'es' | 'en') => AREAS[id].label[lang];

/** Inline style bundle so a chip only needs one attribute. */
export function areaStyle(id: AreaId): string {
	const t = AREAS[id].token;
	return `--chip-fg: var(--area-${t}-fg); --chip-bg: var(--area-${t}-bg); --chip-line: var(--area-${t}-line);`;
}
