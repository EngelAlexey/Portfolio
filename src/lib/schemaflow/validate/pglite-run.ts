import { types, type PGlite } from '@electric-sql/pglite';
import type { EngineResult, Failure, RunRequest } from './pglite-types';

export const MAX_ROWS = 200;
export const MAX_RUNS = 40;
export const HEAVY_ROWS = 20_000;
export const HEAVY_MS = 3000;

const COUNT_TABLES = "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type = 'BASE TABLE'";

const CATALOGS = [
	'pg_namespace',
	'pg_class',
	'pg_attribute',
	'pg_type',
	'pg_proc',
	'pg_operator',
	'pg_cast',
	'pg_collation',
	'pg_conversion',
	'pg_constraint',
	'pg_index',
	'pg_sequence',
	'pg_trigger',
	'pg_event_trigger',
	'pg_rewrite',
	'pg_policy',
	'pg_extension',
	'pg_language',
	'pg_foreign_data_wrapper',
	'pg_foreign_server',
	'pg_publication',
	'pg_ts_config',
	'pg_ts_dict',
	'pg_roles',
	'pg_db_role_setting',
	'pg_largeobject_metadata',
	'pg_default_acl',
	'pg_description',
	'pg_shdescription'
] as const;

const FINGERPRINT = `SELECT json_build_object(${CATALOGS.map((name) => `'${name}', (SELECT count(*) FROM ${name})`).join(', ')})::text AS f`;

interface EngineError {
	message?: string;
	position?: string | number;
	hint?: string;
	code?: string;
}

const hex = (bytes: Uint8Array) => `\\x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;

export function cell(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
	if (value instanceof Uint8Array) return hex(value);
	if (typeof value === 'object') return JSON.stringify(value, (_key, v: unknown) => (typeof v === 'bigint' ? v.toString() : v instanceof Uint8Array ? hex(v) : v));
	return String(value);
}

const text = (value: string): string => value;

function rawParsers(db: PGlite): Record<number, (value: string) => string> {
	const raw: Record<number, (value: string) => string> = {};
	for (const key of Object.keys(db.parsers)) raw[Number(key)] = text;
	raw[types.BOOL] = (value) => (value === 't' ? 'true' : 'false');
	return raw;
}

export function failure(error: unknown, stage: 'ddl' | 'query'): Failure {
	const e = error as EngineError;
	const position = Number(e.position);
	return {
		ok: false,
		stage,
		message: String(e.message ?? error),
		position: Number.isFinite(position) && position > 0 ? position : null,
		hint: e.hint ?? null,
		code: e.code ?? null
	};
}

export async function fingerprint(db: PGlite): Promise<string> {
	const result = await db.query<{ f: string }>(FINGERPRINT);
	return result.rows[0]?.f ?? '';
}

async function attempt(db: PGlite, request: RunRequest, waited: number): Promise<EngineResult> {
	const started = performance.now();
	let tables: number;
	try {
		await db.exec(request.sql);
		tables = (await db.query<{ n: number }>(COUNT_TABLES)).rows[0]?.n ?? 0;
	} catch (error) {
		return failure(error, 'ddl');
	}
	if (request.query === undefined) return { ok: true, tables };
	const applied = performance.now();
	try {
		const results = await db.exec(request.query, { parsers: rawParsers(db), rowMode: 'array' });
		const last = [...results].reverse().find((r) => r.fields.length > 0) ?? results[results.length - 1];
		const fields = last ? last.fields.map((f) => f.name) : [];
		const rows = last ? last.rows.slice(0, MAX_ROWS).map((row) => (row as unknown[]).map((value) => cell(value))) : [];
		const affected = last && last.fields.length === 0 ? (results[results.length - 1]?.affectedRows ?? 0) : 0;
		return {
			ok: true,
			tables,
			query: { fields, rows, total: last ? last.rows.length : 0, affected },
			timings: { boot: waited, schema: Math.round(applied - started), query: Math.round(performance.now() - applied) }
		};
	} catch (error) {
		return failure(error, 'query');
	}
}

export async function execute(db: PGlite, request: RunRequest, waited = 0): Promise<EngineResult> {
	try {
		await db.exec('BEGIN');
	} catch (error) {
		return failure(error, 'ddl');
	}
	try {
		return await attempt(db, request, waited);
	} finally {
		await db.exec('ROLLBACK').catch(() => undefined);
	}
}

export async function settle(db: PGlite, baseline: string | null): Promise<boolean> {
	if (baseline === null) return false;
	try {
		await db.exec('ROLLBACK');
		await db.exec('DISCARD ALL');
		return (await fingerprint(db)) === baseline;
	} catch {
		return false;
	}
}

export function reusable(result: EngineResult, runs: number): boolean {
	if (runs >= MAX_RUNS) return false;
	if (!result.ok) return true;
	if ((result.query?.total ?? 0) > HEAVY_ROWS) return false;
	return !result.timings || result.timings.schema + result.timings.query <= HEAVY_MS;
}
