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
};

export const AREAS: Record<AreaId, AreaMeta> = {
	fullstack: {
		token: 'fullstack',
		label: { es: 'Full Stack', en: 'Full Stack' }
	},
	ia: {
		token: 'ia',
		label: { es: 'IA', en: 'AI' }
	},
	datos: {
		token: 'datos',
		label: { es: 'Datos', en: 'Data' }
	},
	movil: {
		token: 'movil',
		label: { es: 'Móvil', en: 'Mobile' }
	},
	seguridad: {
		token: 'seguridad',
		label: { es: 'Seguridad', en: 'Security' }
	},
	infra: {
		token: 'infra',
		label: { es: 'Infraestructura', en: 'Infrastructure' }
	}
};

export const areaLabel = (id: AreaId, lang: 'es' | 'en') => AREAS[id].label[lang];

/** Inline style bundle so a chip only needs one attribute. */
export function areaStyle(id: AreaId): string {
	const t = AREAS[id].token;
	return `--chip-fg: var(--area-${t}-fg); --chip-bg: var(--area-${t}-bg); --chip-line: var(--area-${t}-line);`;
}
