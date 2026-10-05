export interface QueryOutput {
	fields: string[];
	rows: (string | null)[][];
	total: number;
	affected: number;
}

export interface Timings {
	boot: number;
	schema: number;
	query: number;
}

export interface Failure {
	ok: false;
	message: string;
	position: number | null;
	hint: string | null;
	code: string | null;
	table?: string | null;
	stage?: 'ddl' | 'query';
	timeout?: boolean;
	stopped?: boolean;
	failed?: boolean;
}

export type EngineResult = { ok: true; tables: number; query?: QueryOutput; timings?: Timings } | Failure;

export interface RunRequest {
	sql: string;
	query?: string;
}

export type WorkerMessage = { kind: 'ready' } | { kind: 'running' } | { kind: 'failed'; message: string } | { kind: 'done'; result: EngineResult; reusable: boolean };
