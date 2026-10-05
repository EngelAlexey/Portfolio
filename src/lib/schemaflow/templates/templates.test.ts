import { describe, expect, it } from 'vitest';
import { schemaflowUiEn } from '../../i18n/schemaflow-ui-en';
import { schemaflowUiEs } from '../../i18n/schemaflow-ui-es';
import { parseSql } from '../parse/sql-parse';
import { analyze, score } from '../validate/rules';
import { loadTemplates, TAGS, TOPICS } from './template';

const describeIssues = (issues: ReturnType<typeof analyze>) => issues.map((issue) => `${issue.severity} ${issue.rule} ${Object.values(issue.params).join(' ')}`.trim());

describe('the template bank', async () => {
	const templates = await loadTemplates();

	it('has three templates in each of the eight topics', () => {
		expect(templates).toHaveLength(24);
		for (const topic of TOPICS) expect(templates.filter((template) => template.topic === topic).map((template) => template.id), topic).toHaveLength(3);
	});

	it('uses ids that are unique and written in lower case with hyphens', () => {
		expect(new Set(templates.map((template) => template.id)).size).toBe(templates.length);
		for (const template of templates) expect(template.id, template.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
	});

	it('names every topic and every tag in both languages', () => {
		for (const strings of [schemaflowUiEs, schemaflowUiEn]) {
			for (const topic of TOPICS) expect(strings.gallery.topics[topic], topic).toBeTruthy();
			for (const tag of TAGS) expect(strings.gallery.tags[tag], tag).toBeTruthy();
		}
	});

	it('orders the templates by topic and then by their own number', () => {
		const keys = templates.map((template) => TOPICS.indexOf(template.topic) * 10 + template.order);
		expect(keys).toEqual([...keys].sort((a, b) => a - b));
		expect(new Set(keys).size).toBe(keys.length);
	});

	for (const template of templates) {
		describe(template.id, () => {
			const schema = parseSql('postgres', template.sql).schema;

			it('has a name, a one-sentence description and one to three tags in both languages', () => {
				expect(TOPICS).toContain(template.topic);
				expect(template.tags.length).toBeGreaterThanOrEqual(1);
				expect(template.tags.length).toBeLessThanOrEqual(3);
				expect(new Set(template.tags).size).toBe(template.tags.length);
				for (const tag of template.tags) expect(TAGS).toContain(tag);
				for (const lang of ['es', 'en'] as const) {
					expect(template.name[lang].length, `${lang} name`).toBeGreaterThan(0);
					expect(template.name[lang].length, `${lang} name`).toBeLessThanOrEqual(40);
					expect(template.description[lang], `${lang} description`).toMatch(/^[A-ZÁÉÍÓÚÑ].*\.$/);
					expect(template.description[lang].length, `${lang} description`).toBeLessThanOrEqual(100);
					expect(template.description[lang], `${lang} description`).not.toMatch(/\.\s+\S/);
				}
			});

			it('has between 4 and 10 tables, each with a primary key and each related to another', () => {
				expect(schema.tables.length).toBeGreaterThanOrEqual(4);
				expect(schema.tables.length).toBeLessThanOrEqual(10);
				for (const table of schema.tables) {
					expect(table.primaryKey.length, `${table.name} primary key`).toBeGreaterThan(0);
					expect(schema.relations.some((relation) => relation.fromTable === table.id || relation.toTable === table.id), `${table.name} is related`).toBe(true);
				}
			});

			it('names tables and columns in English, in lower case with underscores', () => {
				for (const table of schema.tables) {
					expect(table.name, table.name).toMatch(/^[a-z][a-z0-9_]*$/);
					for (const column of table.columns) expect(column.name, `${table.name}.${column.name}`).toMatch(/^[a-z][a-z0-9_]*$/);
				}
			});

			it('has no finding at all in PostgreSQL', () => {
				const issues = analyze(schema, 'postgres');
				expect(describeIssues(issues)).toEqual([]);
				expect(score(issues)).toBe(100);
			});

			it('has no error in MySQL or SQL Server', () => {
				for (const dialect of ['mysql', 'sqlserver'] as const) {
					const errors = analyze(schema, dialect).filter((issue) => issue.severity === 'error');
					expect(describeIssues(errors), dialect).toEqual([]);
				}
			});
		});
	}
});
