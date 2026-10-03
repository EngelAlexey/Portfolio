import { describe, expect, it } from 'vitest';
import { generateMongo } from '../dialects/mongo-generate';
import { loadTemplates } from '../templates/template';
import { parseMongo } from './mongo-parse';
import { parseSql } from './sql-parse';

const errors = (result: ReturnType<typeof parseMongo>) => result.issues.filter((i) => i.severity === 'error');

describe('mongodb', async () => {
	const templates = await loadTemplates();

	for (const template of templates) {
		it(`${template.id} is stable through MongoDB`, () => {
			const original = parseSql('postgres', template.sql).schema;
			const code = generateMongo(original);
			const parsed = parseMongo(code);
			expect(errors(parsed), code).toEqual([]);
			expect(parsed.schema.tables.map((t) => t.name)).toEqual(original.tables.map((t) => t.name));
			expect(parsed.schema.relations.length).toBe(original.relations.length);
			expect(generateMongo(parsed.schema)).toBe(code);
		});
	}

	it('never runs code and rejects anything outside the whitelist', () => {
		for (const input of ['db.dropDatabase();', "require('fs');", "eval('1');", 'while (true) {}', 'db.users.drop();', "db.createCollection('a', { validator: x });"]) {
			const result = parseMongo(input);
			expect(errors(result).length, input).toBeGreaterThan(0);
		}
	});

	it('accepts shell use and getSiblingDB', () => {
		const result = parseMongo('use shop\ndb = db.getSiblingDB("shop");\ndb.createCollection("a");');
		expect(errors(result)).toEqual([]);
		expect(result.schema.tables.map((t) => t.name)).toEqual(['a']);
	});

	it('reports unsupported $jsonSchema keywords and bad bsonType', () => {
		const result = parseMongo(`db.createCollection("a", { validator: { $jsonSchema: {
			bsonType: "object",
			properties: { x: { bsonType: "strng", default: 1 }, y: { type: "integer" } },
			required: ["z"]
		} } });`);
		expect(errors(result).map((i) => i.code)).toEqual(['mongo-bsontype', 'mongo-keyword-unsupported', 'mongo-type-integer', 'mongo-required-unknown']);
	});

	it('reports JavaScript syntax errors with a position', () => {
		const [first] = errors(parseMongo('db.createCollection("a", {'));
		expect(first?.code).toBe('js-syntax');
	});
});
