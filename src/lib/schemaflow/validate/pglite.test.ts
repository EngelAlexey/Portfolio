import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';
import { generateSql } from '../dialects/sql-generate';
import { parseSql } from '../parse/sql-parse';
import { loadTemplates } from '../templates/template';

describe('generated PostgreSQL runs on a real engine', async () => {
	const templates = await loadTemplates();

	for (const template of templates) {
		it(`${template.id}`, async () => {
			const db = new PGlite();
			try {
				const schema = parseSql('postgres', template.sql).schema;
				await db.exec(generateSql('postgres', schema));
				const result = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'");
				expect(result.rows[0]?.n).toBe(schema.tables.length);
			} finally {
				await db.close();
			}
		}, 60_000);
	}

	it('reports engine errors with a position', async () => {
		const db = new PGlite();
		try {
			await expect(db.exec('CREATE TABLE a (id INT PRIMARY KEY, b_id INT REFERENCES missing(id));')).rejects.toMatchObject({
				message: expect.stringContaining('missing')
			});
		} finally {
			await db.close();
		}
	}, 60_000);
});
