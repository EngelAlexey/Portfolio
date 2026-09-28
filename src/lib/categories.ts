import type { AreaId } from './areas';

// Secciones del blog. Cada una toma el color de un area, asi que no introduce
// ningun token nuevo; el orden de la lista es el orden en la pagina.
export const CATEGORY_IDS = ['seguridad-web', 'programar-con-ia'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_AREA: Record<CategoryId, AreaId> = {
	'seguridad-web': 'seguridad',
	'programar-con-ia': 'ia'
};
