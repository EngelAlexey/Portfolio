import { describe, expect, it } from 'vitest';
import { schemaflowUiEn } from '../../i18n/schemaflow-ui-en';
import { schemaflowUiEs } from '../../i18n/schemaflow-ui-es';
import { COLUMN_PRESETS, ELEMENT_ALIASES, ELEMENT_KEYS, itemKey, matchesQuery, RELATION_KINDS, searchText, TABLE_PRESETS, type ElementKey } from './elements';
import { COMMON_TYPES } from './types';

const find = (query: string) => ELEMENT_KEYS.filter((key) => matchesQuery(query, searchText(key)));

describe('palette elements', () => {
	it('lists every table, column and relation preset once', () => {
		expect(new Set(ELEMENT_KEYS).size).toBe(ELEMENT_KEYS.length);
		expect(ELEMENT_KEYS).toHaveLength(TABLE_PRESETS.length + COLUMN_PRESETS.length + RELATION_KINDS.length + 2);
		for (const key of ELEMENT_KEYS) expect(ELEMENT_ALIASES[key].trim().length).toBeGreaterThan(0);
		expect(Object.keys(ELEMENT_ALIASES).sort()).toEqual([...ELEMENT_KEYS].sort());
	});

	it('offers a column preset for every common type', () => {
		const common = Object.keys(COMMON_TYPES).sort();
		expect(COLUMN_PRESETS.filter((preset) => preset !== 'timestamps').sort()).toEqual(common);
	});

	it('derives the key of an item', () => {
		expect(itemKey({ kind: 'table', preset: 'lookup' })).toBe('table:lookup');
		expect(itemKey({ kind: 'column', preset: 'uuid' })).toBe('column:uuid');
		expect(itemKey({ kind: 'relation', relation: 'manyToMany' })).toBe('relation:manyToMany');
		expect(itemKey({ kind: 'note' })).toBe('note');
		expect(itemKey({ kind: 'area' })).toBe('area');
	});

	it('shows everything when the query is empty', () => {
		expect(find('')).toEqual(ELEMENT_KEYS);
		expect(find('   ')).toEqual(ELEMENT_KEYS);
	});

	it('finds relations by synonym in both languages, ignoring accents and case', () => {
		expect(find('foránea')).toEqual(['relation:oneToMany', 'relation:oneToOne']);
		expect(find('FOREIGN key')).toEqual(['relation:oneToMany', 'relation:oneToOne']);
		expect(find('1:N')).toEqual(['relation:oneToMany']);
		expect(find('1:1')).toEqual(['relation:oneToOne']);
		expect(find('n:m')).toEqual(['relation:manyToMany']);
		expect(find('tabla puente')).toEqual(['relation:manyToMany']);
	});

	it('finds columns and tables by what they hold', () => {
		expect(find('fecha')).toEqual(['table:timestamps', 'column:date', 'column:datetime', 'column:timestamps']);
		expect(find('catálogo')).toEqual(['table:lookup']);
		expect(find('dinero')).toEqual(['column:decimal']);
		expect(find('zona')).toEqual(['area']);
	});

	it('requires every word of the query to match', () => {
		expect(find('uno muchos')).toEqual(['relation:oneToMany']);
		expect(find('muchos fecha')).toEqual([]);
	});

	it('returns nothing for a word that matches no element', () => {
		expect(find('zzz')).toEqual([]);
	});

	it('matches the visible text of the current language as well as the aliases', () => {
		const text = (key: ElementKey, ...visible: string[]) => searchText(key, ...visible);
		expect(matchesQuery('calendario', text('column:date', 'Fecha'))).toBe(true);
		expect(matchesQuery('columna', text('column:date', 'Fecha', schemaflowUiEs.palette.groups.columns))).toBe(true);
		expect(matchesQuery('columns', text('column:date', 'Date', schemaflowUiEn.palette.groups.columns))).toBe(true);
		expect(matchesQuery('columns', text('table:basic', 'Table', schemaflowUiEn.palette.groups.tables))).toBe(false);
	});
});
