import { PGlite } from '@electric-sql/pglite';
import { execute, failure, fingerprint, reusable, settle } from './pglite-run';
import type { RunRequest, WorkerMessage } from './pglite-types';

const send = (message: WorkerMessage) => postMessage(message);

const booting = (async () => {
	const db = new PGlite();
	await db.waitReady;
	const baseline = await fingerprint(db).catch(() => null);
	send({ kind: 'ready' });
	return { db, baseline };
})();

booting.catch((error: unknown) => send({ kind: 'failed', message: String((error as Error | undefined)?.message ?? error) }));

let runs = 0;
let queue: Promise<void> = Promise.resolve();

async function handle(request: RunRequest): Promise<void> {
	const received = performance.now();
	let engine: Awaited<typeof booting>;
	try {
		engine = await booting;
	} catch {
		return;
	}
	const waited = Math.round(performance.now() - received);
	send({ kind: 'running' });
	try {
		const result = await execute(engine.db, request, waited);
		runs++;
		const clean = await settle(engine.db, engine.baseline);
		send({ kind: 'done', result, reusable: clean && reusable(result, runs) });
	} catch (error) {
		send({ kind: 'done', result: failure(error, 'ddl'), reusable: false });
	}
}

self.addEventListener('message', (event: MessageEvent<RunRequest>) => {
	queue = queue.then(() => handle(event.data));
});
