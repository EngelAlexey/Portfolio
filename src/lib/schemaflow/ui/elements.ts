import type { RelationKind } from '../model/relate';
import { fold } from './strings';
import type { CommonTypeId } from './types';

export const COLUMN_PRESETS = ['text', 'longText', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'uuid', 'json', 'timestamps'] as const satisfies readonly (CommonTypeId | 'timestamps')[];
export const RELATION_KINDS = ['oneToMany', 'oneToOne', 'manyToMany'] as const satisfies readonly RelationKind[];

export type ColumnPreset = CommonTypeId | 'timestamps';

export type PaletteItem =
	| { kind: 'table' }
	| { kind: 'column'; preset: ColumnPreset }
	| { kind: 'relation'; relation: RelationKind }
	| { kind: 'note' }
	| { kind: 'area' };

export type ElementKey = 'table' | `column:${(typeof COLUMN_PRESETS)[number]}` | `relation:${RelationKind}` | 'note' | 'area';

export const ELEMENT_KEYS: readonly ElementKey[] = [
	'table',
	...COLUMN_PRESETS.map((preset) => `column:${preset}` as const),
	...RELATION_KINDS.map((kind) => `relation:${kind}` as const),
	'note',
	'area'
];

export const ELEMENT_ALIASES: Record<ElementKey, string> = {
	table: 'table tabla entidad entity',
	'column:text': 'text texto corto short varchar string cadena nombre name',
	'column:longText': 'text texto largo long descripcion description contenido body comentario comment',
	'column:integer': 'integer int entero numero number contador counter cantidad quantity',
	'column:decimal': 'decimal numeric numero number dinero money precio price importe amount',
	'column:boolean': 'boolean bool si no yes verdadero falso true false activo active bandera flag',
	'column:date': 'date fecha dia day calendario calendar',
	'column:datetime': 'datetime timestamp fecha hora date time momento',
	'column:uuid': 'uuid guid identificador identifier unico unique',
	'column:json': 'json jsonb datos data documento document objeto object',
	'column:timestamps': 'created_at updated_at timestamps fechas registro auditoria audit',
	'relation:oneToMany': '1:n 1:m uno muchos one many foranea foreign key fk padre hijo parent child referencia reference',
	'relation:oneToOne': '1:1 uno a uno one to one foranea foreign key fk unica unique perfil profile',
	'relation:manyToMany': 'n:m m:n muchos a muchos many to many tabla table puente junction intermedia pivot asociativa',
	note: 'note nota comentario comment anotacion annotation',
	area: 'area zona region grupo group seccion section contenedor'
};

export function itemKey(item: PaletteItem): ElementKey {
	switch (item.kind) {
		case 'column':
			return `column:${item.preset}`;
		case 'relation':
			return `relation:${item.relation}`;
		default:
			return item.kind;
	}
}

export function searchText(key: ElementKey, ...visible: string[]): string {
	return fold([...visible, ELEMENT_ALIASES[key]].join(' '));
}

export function matchesQuery(query: string, text: string): boolean {
	const words = fold(query).split(/\s+/).filter(Boolean);
	return words.every((word) => text.includes(word));
}
