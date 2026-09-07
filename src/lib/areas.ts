export const AREA_IDS = ['fullstack', 'ia', 'datos', 'movil', 'seguridad', 'infra'] as const;

export type AreaId = (typeof AREA_IDS)[number];

type AreaMeta = {
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

export function areaStyle(id: AreaId): string {
	const t = AREAS[id].token;
	return `--chip-fg: var(--area-${t}-fg); --chip-bg: var(--area-${t}-bg); --chip-line: var(--area-${t}-line);`;
}

export function accentStyle(id: AreaId): string {
	const t = AREAS[id].token;
	return `--accent: var(--area-${t}-fg); --accent-bg: var(--area-${t}-bg); --accent-line: var(--area-${t}-line);`;
}
