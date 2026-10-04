import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresSession, type WorkerHandle } from './pglite';
import type { EngineResult, RunRequest, WorkerMessage } from './pglite-types';

class FakeWorker implements WorkerHandle {
	static all: FakeWorker[] = [];
	terminated = false;
	posted: RunRequest[] = [];
	private onMessage: ((message: WorkerMessage) => void) | null = null;
	private onError: ((message: string) => void) | null = null;

	constructor() {
		FakeWorker.all.push(this);
	}

	post(request: RunRequest): void {
		this.posted.push(request);
	}

	terminate(): void {
		this.terminated = true;
	}

	listen(onMessage: (message: WorkerMessage) => void, onError: (message: string) => void): void {
		this.onMessage = onMessage;
		this.onError = onError;
	}

	emit(message: WorkerMessage): void {
		if (!this.terminated) this.onMessage?.(message);
	}

	crash(text: string): void {
		if (!this.terminated) this.onError?.(text);
	}
}

const ok = (tables = 1): EngineResult => ({ ok: true, tables });
const sqlError: EngineResult = { ok: false, stage: 'ddl', message: 'syntax error', position: 3, hint: null, code: '42601' };
const done = (result: EngineResult, reusable = true): WorkerMessage => ({ kind: 'done', result, reusable });
const alive = () => FakeWorker.all.filter((w) => !w.terminated);
const worker = (index: number) => FakeWorker.all[index] as FakeWorker;

let session: PostgresSession;

beforeEach(() => {
	vi.useFakeTimers();
	FakeWorker.all = [];
	session = new PostgresSession(() => new FakeWorker(), 1000);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('PostgresSession', () => {
	it('boots a worker for the first run and keeps it afterwards', async () => {
		const run = session.run('CREATE TABLE a (id INT);');
		expect(FakeWorker.all).toHaveLength(1);
		expect(worker(0).posted).toEqual([{ sql: 'CREATE TABLE a (id INT);', query: undefined }]);
		worker(0).emit({ kind: 'ready' });
		worker(0).emit(done(ok()));
		expect(await run).toEqual(ok());
		expect(worker(0).terminated).toBe(false);
		expect(FakeWorker.all).toHaveLength(1);
		expect(session.warm).toBe(true);
	});

	it('runs the next request on the kept worker, without another boot', async () => {
		const first = session.run('a');
		worker(0).emit({ kind: 'ready' });
		worker(0).emit(done(ok()));
		await first;
		const second = session.run('b', { query: 'SELECT 1' });
		expect(FakeWorker.all).toHaveLength(1);
		expect(worker(0).posted).toEqual([
			{ sql: 'a', query: undefined },
			{ sql: 'b', query: 'SELECT 1' }
		]);
		expect(session.warm).toBe(false);
		worker(0).emit(done(ok(2)));
		expect(await second).toEqual(ok(2));
		expect(session.warm).toBe(true);
	});

	it('replaces a worker that says it cannot be reused', async () => {
		const run = session.run('a');
		worker(0).emit({ kind: 'ready' });
		worker(0).emit(done(ok(), false));
		await run;
		expect(worker(0).terminated).toBe(true);
		expect(FakeWorker.all).toHaveLength(2);
		expect(session.warm).toBe(false);
		worker(1).emit({ kind: 'ready' });
		expect(session.warm).toBe(true);
	});

	it('keeps the worker after the SQL fails, because the engine is fine', async () => {
		const run = session.run('bad');
		worker(0).emit({ kind: 'ready' });
		worker(0).emit(done(sqlError));
		expect(await run).toEqual(sqlError);
		expect(alive()).toHaveLength(1);
		expect(session.warm).toBe(true);
	});

	it('reports progress when the worker starts running', async () => {
		const onRunning = vi.fn();
		const run = session.run('a', { onRunning });
		worker(0).emit({ kind: 'running' });
		expect(onRunning).toHaveBeenCalledTimes(1);
		worker(0).emit(done(ok()));
		await run;
	});

	it('releases the kept worker after the idle time', async () => {
		const run = session.run('a');
		worker(0).emit(done(ok()));
		await run;
		vi.advanceTimersByTime(999);
		expect(alive()).toHaveLength(1);
		vi.advanceTimersByTime(2);
		expect(alive()).toHaveLength(0);
		const next = session.run('b');
		expect(FakeWorker.all).toHaveLength(2);
		worker(1).emit(done(ok()));
		await next;
	});

	it('starts the idle count again after every run', async () => {
		const first = session.run('a');
		worker(0).emit(done(ok()));
		await first;
		vi.advanceTimersByTime(800);
		const second = session.run('b');
		worker(0).emit(done(ok()));
		await second;
		vi.advanceTimersByTime(800);
		expect(alive()).toHaveLength(1);
		vi.advanceTimersByTime(300);
		expect(alive()).toHaveLength(0);
	});

	it('does not release a worker that is in the middle of a run', async () => {
		const first = session.run('a');
		worker(0).emit(done(ok()));
		await first;
		const second = session.run('b');
		vi.advanceTimersByTime(5000);
		expect(worker(0).terminated).toBe(false);
		worker(0).emit(done(ok()));
		await second;
	});

	it('stops a run on abort, ends its worker and does not boot another', async () => {
		const abort = new AbortController();
		const run = session.run('a', { signal: abort.signal });
		abort.abort();
		expect(await run).toMatchObject({ ok: false, stopped: true });
		expect(alive()).toHaveLength(0);
		expect(FakeWorker.all).toHaveLength(1);
	});

	it('does not start a worker when the signal is already aborted', async () => {
		const abort = new AbortController();
		abort.abort();
		expect(await session.run('a', { signal: abort.signal })).toMatchObject({ stopped: true });
		expect(FakeWorker.all).toHaveLength(0);
	});

	it('ends the run after the timeout and does not boot another worker', async () => {
		const run = session.run('a', { timeoutMs: 500 });
		vi.advanceTimersByTime(501);
		expect(await run).toMatchObject({ ok: false, timeout: true });
		expect(alive()).toHaveLength(0);
	});

	it('ignores a late answer after the run ended', async () => {
		const run = session.run('a', { timeoutMs: 500 });
		vi.advanceTimersByTime(501);
		await run;
		worker(0).emit(done(ok()));
		expect(FakeWorker.all).toHaveLength(1);
		expect(alive()).toHaveLength(0);
	});

	it('reports a worker that cannot boot during a run, and does not retry on its own', async () => {
		const run = session.run('a');
		worker(0).emit({ kind: 'failed', message: 'wasm failed' });
		expect(await run).toMatchObject({ ok: false, failed: true, message: 'wasm failed' });
		expect(alive()).toHaveLength(0);
	});

	it('reports a worker error event as a failure', async () => {
		const run = session.run('a');
		worker(0).crash('boom');
		expect(await run).toMatchObject({ ok: false, failed: true });
		expect(alive()).toHaveLength(0);
	});

	it('discards a kept worker that failed while idle and boots a new one', async () => {
		const first = session.run('a');
		worker(0).emit({ kind: 'ready' });
		worker(0).emit(done(ok()));
		await first;
		worker(0).crash('lost');
		expect(session.warm).toBe(false);
		const second = session.run('b');
		expect(worker(0).terminated).toBe(true);
		expect(FakeWorker.all).toHaveLength(2);
		expect(worker(1).posted).toHaveLength(1);
		worker(1).emit(done(ok()));
		await second;
	});

	it('gives each overlapping run its own worker and keeps only one afterwards', async () => {
		const a = session.run('a');
		const b = session.run('b');
		expect(FakeWorker.all).toHaveLength(2);
		worker(0).emit(done(ok(1)));
		expect(await a).toEqual(ok(1));
		worker(1).emit(done(ok(2)));
		expect(await b).toEqual(ok(2));
		expect(alive()).toHaveLength(1);
		expect(worker(0).terminated).toBe(false);
		expect(worker(1).terminated).toBe(true);
	});

	it('releases only the idle worker', async () => {
		const first = session.run('a');
		worker(0).emit(done(ok()));
		await first;
		const running = session.run('b');
		session.release();
		expect(worker(0).terminated).toBe(false);
		worker(0).emit(done(ok()));
		await running;
		expect(worker(0).terminated).toBe(false);
	});

	it('warms a worker on request, only once', () => {
		session.warmUp();
		session.warmUp();
		expect(FakeWorker.all).toHaveLength(1);
		expect(session.warm).toBe(false);
		worker(0).emit({ kind: 'ready' });
		expect(session.warm).toBe(true);
		session.release();
		expect(alive()).toHaveLength(0);
		expect(session.warm).toBe(false);
	});

	it('survives a worker that cannot even be created', async () => {
		const broken = new PostgresSession(() => {
			throw new Error('blocked');
		});
		expect(await broken.run('a')).toMatchObject({ ok: false, failed: true });
		broken.release();
	});
});
