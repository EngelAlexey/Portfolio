import type { EngineResult, RunRequest, WorkerMessage } from './pglite-types';

export type { EngineResult, QueryOutput, Timings } from './pglite-types';

export interface WorkerHandle {
	post(request: RunRequest): void;
	terminate(): void;
	listen(onMessage: (message: WorkerMessage) => void, onError: (message: string) => void): void;
}

export interface RunOptions {
	query?: string;
	signal?: AbortSignal;
	onRunning?: () => void;
	timeoutMs?: number;
}

interface Slot {
	handle: WorkerHandle;
	ready: boolean;
	failed: boolean;
	sink: ((message: WorkerMessage) => void) | null;
}

type Outcome = 'keep' | 'replace' | 'drop';

export const IDLE_MS = 300_000;
export const TIMEOUT_MS = 20_000;

const DEAD: WorkerHandle = { post: () => undefined, terminate: () => undefined, listen: () => undefined };

const fail = (extra: Partial<Extract<EngineResult, { ok: false }>>): EngineResult => ({ ok: false, message: '', position: null, hint: null, code: null, ...extra });

export class PostgresSession {
	private idle: Slot | null = null;
	private idleTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(
		private readonly create: () => WorkerHandle,
		private readonly idleMs = IDLE_MS
	) {}

	get warm(): boolean {
		return this.idle !== null && this.idle.ready && !this.idle.failed;
	}

	warmUp(): void {
		clearTimeout(this.idleTimer);
		if (!this.idle || this.idle.failed) {
			this.idle?.handle.terminate();
			this.idle = this.spawn();
		}
		this.idleTimer = setTimeout(() => this.release(), this.idleMs);
	}

	release(): void {
		clearTimeout(this.idleTimer);
		this.idle?.handle.terminate();
		this.idle = null;
	}

	run(sql: string, options: RunOptions = {}): Promise<EngineResult> {
		return new Promise((resolve) => {
			const { signal } = options;
			if (signal?.aborted) {
				resolve(fail({ stopped: true }));
				return;
			}
			clearTimeout(this.idleTimer);
			const slot = this.take();
			let settled = false;
			const finish = (result: EngineResult, outcome: Outcome) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				signal?.removeEventListener('abort', onAbort);
				slot.sink = null;
				if (outcome === 'keep' && !this.idle && !slot.failed) this.idle = slot;
				else slot.handle.terminate();
				if (outcome !== 'drop') this.warmUp();
				resolve(result);
			};
			const onAbort = () => finish(fail({ stopped: true }), 'drop');
			const timer = setTimeout(() => finish(fail({ timeout: true }), 'drop'), options.timeoutMs ?? TIMEOUT_MS);
			signal?.addEventListener('abort', onAbort, { once: true });
			slot.sink = (message) => {
				if (message.kind === 'running') options.onRunning?.();
				else if (message.kind === 'done') finish(message.result, message.reusable ? 'keep' : 'replace');
				else if (message.kind === 'failed') finish(fail({ message: message.message, failed: true }), 'drop');
			};
			if (slot.failed) finish(fail({ failed: true }), 'drop');
			else slot.handle.post({ sql, query: options.query });
		});
	}

	private take(): Slot {
		const slot = this.idle;
		this.idle = null;
		if (slot && !slot.failed) return slot;
		slot?.handle.terminate();
		return this.spawn();
	}

	private spawn(): Slot {
		let handle: WorkerHandle;
		try {
			handle = this.create();
		} catch {
			return { handle: DEAD, ready: false, failed: true, sink: null };
		}
		const slot: Slot = { handle, ready: false, failed: false, sink: null };
		handle.listen(
			(message) => {
				if (message.kind === 'ready') slot.ready = true;
				else if (message.kind === 'failed') slot.failed = true;
				slot.sink?.(message);
			},
			(text) => {
				slot.failed = true;
				slot.sink?.({ kind: 'failed', message: text });
			}
		);
		return slot;
	}
}

function createBrowserWorker(): WorkerHandle {
	const worker = new Worker(new URL('./pglite-worker.ts', import.meta.url), { type: 'module' });
	return {
		post: (request) => worker.postMessage(request),
		terminate: () => worker.terminate(),
		listen(onMessage, onError) {
			worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => onMessage(event.data));
			worker.addEventListener('error', (event) => onError(event.message || 'worker'));
		}
	};
}

const shared = new PostgresSession(createBrowserWorker);

export const runPostgres = (sql: string, options: RunOptions = {}): Promise<EngineResult> => shared.run(sql, options);
export const isPostgresWarm = (): boolean => shared.warm;
export const releasePostgres = (): void => shared.release();
