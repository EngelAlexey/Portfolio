import { describe, expect, it } from 'vitest';
import { schemaflowUiEn } from '../../i18n/schemaflow-ui-en';
import { schemaflowUiEs } from '../../i18n/schemaflow-ui-es';
import { sameType } from '../model/ops';
import { DIALECTS } from '../model/types';
import { COMMON_TYPES, displayType, parseTypeText, renderType, searchTypes, TYPE_BY_ID, TYPE_CHOICES, type TypeChoiceId } from './types';

const ids = (list: readonly { id: string }[]) => list.map((choice) => choice.id);
const spanish = (id: TypeChoiceId) => schemaflowUiEs.types.choices[id].label;
const english = (id: TypeChoiceId) => schemaflowUiEn.types.choices[id].label;

describe('type catalogue', () => {
	it('has the 9 types of the palette first and 8 more after them', () => {
		expect(ids(TYPE_CHOICES.filter((choice) => choice.common))).toEqual(['text', 'longText', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'uuid', 'json']);
		expect(ids(TYPE_CHOICES.filter((choice) => !choice.common))).toEqual(['smallint', 'bigint', 'real', 'double', 'char', 'time', 'timestamp', 'binary']);
		expect(new Set(ids(TYPE_CHOICES)).size).toBe(TYPE_CHOICES.length);
	});

	it('gives every type a label and a hint in both languages', () => {
		for (const choice of TYPE_CHOICES) {
			for (const strings of [schemaflowUiEs, schemaflowUiEn]) {
				const text = strings.types.choices[choice.id];
				expect(text.label, choice.id).toBeTruthy();
				expect(text.hint, choice.id).toBeTruthy();
			}
		}
	});

	it('hands the palette the same logical types', () => {
		for (const [id, type] of Object.entries(COMMON_TYPES)) expect(sameType(type, TYPE_BY_ID[id as TypeChoiceId].type), id).toBe(true);
		expect(Object.keys(COMMON_TYPES)).toHaveLength(9);
	});

	for (const dialect of DIALECTS) {
		it(`reads its own name back and shows a native type in ${dialect}`, () => {
			for (const choice of TYPE_CHOICES) {
				const parsed = parseTypeText(choice.sql, dialect);
				expect(parsed !== null && sameType(parsed, choice.type), `${choice.id} in ${dialect}: ${displayType(choice.type)}`).toBe(true);
				expect(renderType(choice.type, dialect), choice.id).not.toBe('');
			}
		});
	}
});

describe('searchTypes', () => {
	it('lists the common types when nothing is typed', () => {
		expect(ids(searchTypes('', spanish, 'postgres'))).toEqual(['text', 'longText', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'uuid', 'json']);
	});

	it('finds a type by its Spanish name, which the SQL name does not contain', () => {
		expect(ids(searchTypes('fecha', spanish, 'postgres'))).toEqual(['date', 'datetime', 'timestamp']);
		expect(ids(searchTypes('hora', spanish, 'postgres')).slice(0, 2)).toEqual(['time', 'datetime']);
	});

	it('finds a type by its English name when the labels are Spanish', () => {
		expect(ids(searchTypes('yes', spanish, 'postgres'))[0]).toBe('boolean');
		expect(ids(searchTypes('date', spanish, 'postgres'))[0]).toBe('date');
		expect(ids(searchTypes('fecha', english, 'postgres'))[0]).toBe('date');
	});

	it('puts the closest match first and ignores accents', () => {
		expect(ids(searchTypes('int', spanish, 'postgres')).slice(0, 3)).toEqual(['integer', 'smallint', 'bigint']);
		expect(ids(searchTypes('cadena', spanish, 'postgres'))[0]).toBe('text');
		expect(ids(searchTypes('cumpleaños', spanish, 'postgres'))).toContain('date');
		expect(ids(searchTypes('Sí o no', spanish, 'postgres'))[0]).toBe('boolean');
	});

	it('ignores the length typed after a name', () => {
		expect(ids(searchTypes('varchar(80)', spanish, 'postgres'))[0]).toBe('text');
	});

	it('matches the native name of the dialect', () => {
		expect(ids(searchTypes('datetimeoffset', spanish, 'sqlserver'))).toEqual(['datetime']);
		expect(ids(searchTypes('uniqueidentifier', spanish, 'sqlserver'))).toEqual(['uuid']);
		expect(ids(searchTypes('nvarchar', spanish, 'sqlserver'))[0]).toBe('text');
		expect(ids(searchTypes('datetimeoffset', spanish, 'postgres'))).toEqual([]);
	});

	it('returns nothing for a word that names no type', () => {
		expect(searchTypes('zzzz', spanish, 'postgres')).toEqual([]);
	});

	it('shows why a typed word needs the search before the parser: an unknown name parses as a raw type', () => {
		expect(parseTypeText('fecha', 'postgres')?.kind).toBe('raw');
		expect(parseTypeText('varchar(80)', 'postgres')).toEqual({ kind: 'varchar', length: 80 });
	});
});
