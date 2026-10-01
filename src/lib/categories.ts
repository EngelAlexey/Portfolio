import type { AreaId } from './areas';

export const CATEGORY_IDS = ['seguridad-web', 'programar-con-ia'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_AREA: Record<CategoryId, AreaId> = {
	'seguridad-web': 'seguridad',
	'programar-con-ia': 'ia'
};
