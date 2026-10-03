import { PGlite } from '@electric-sql/pglite';

interface EngineError {
	message?: string;
	position?: string | number;
	hint?: string;
	code?: string;
}

self.addEventListener('message', async (event: MessageEvent<{ sql: string }>) => {
	let db: PGlite | null = null;
	try {
		db = new PGlite();
		await db.waitReady;
		postMessage({ stage: 'running' });
		await db.exec(event.data.sql);
		const result = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type = 'BASE TABLE'");
		postMessage({ ok: true, tables: result.rows[0]?.n ?? 0 });
	} catch (error) {
		const e = error as EngineError;
		const position = Number(e.position);
		postMessage({
			ok: false,
			message: String(e.message ?? error),
			position: Number.isFinite(position) && position > 0 ? position : null,
			hint: e.hint ?? null,
			code: e.code ?? null
		});
	} finally {
		await db?.close().catch(() => undefined);
	}
});
