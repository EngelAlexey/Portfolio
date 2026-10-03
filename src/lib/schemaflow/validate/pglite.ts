export type EngineResult =
	| { ok: true; tables: number }
	| { ok: false; message: string; position: number | null; hint: string | null; code: string | null; timeout?: boolean; stopped?: boolean; failed?: boolean };

export function runPostgres(sql: string, options: { signal?: AbortSignal; onRunning?: () => void; timeoutMs?: number } = {}): Promise<EngineResult> {
	return new Promise((resolve) => {
		let worker: Worker;
		try {
			worker = new Worker(new URL('./pglite-worker.ts', import.meta.url), { type: 'module' });
		} catch (error) {
			resolve({ ok: false, message: String(error), position: null, hint: null, code: null, failed: true });
			return;
		}
		let settled = false;
		const finish = (result: EngineResult) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			worker.terminate();
			resolve(result);
		};
		const timer = setTimeout(() => finish({ ok: false, message: '', position: null, hint: null, code: null, timeout: true }), options.timeoutMs ?? 20_000);
		options.signal?.addEventListener('abort', () => finish({ ok: false, message: '', position: null, hint: null, code: null, stopped: true }));
		worker.addEventListener('message', (event: MessageEvent<EngineResult | { stage: 'running' }>) => {
			if ('stage' in event.data) {
				options.onRunning?.();
				return;
			}
			finish(event.data);
		});
		worker.addEventListener('error', (event) => finish({ ok: false, message: event.message || 'worker', position: null, hint: null, code: null, failed: true }));
		worker.postMessage({ sql });
	});
}
