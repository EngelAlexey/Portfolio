import type { Schema, SqlDialectId } from '../model/types';
import { dbml } from './dbml';
import { DRIZZLE_DIALECTS, drizzle } from './drizzle';
import { prisma } from './prisma';
import { typescript } from './typescript';
import { zod } from './zod';

export type ExportFormat = 'prisma' | 'drizzle' | 'dbml' | 'typescript' | 'zod';

export interface FormatInfo {
	id: ExportFormat;
	label: string;
	file: (base: string) => string;
	mime: string;
	dialects: readonly SqlDialectId[];
	run: (schema: Schema, dialect: SqlDialectId) => string;
}

const ALL: readonly SqlDialectId[] = ['postgres', 'mysql', 'sqlserver'];

export const FORMATS: readonly FormatInfo[] = [
	{ id: 'prisma', label: 'Prisma', file: () => 'schema.prisma', mime: 'text/plain', dialects: ALL, run: prisma },
	{ id: 'drizzle', label: 'Drizzle ORM', file: () => 'schema.ts', mime: 'text/typescript', dialects: DRIZZLE_DIALECTS, run: drizzle },
	{ id: 'dbml', label: 'DBML', file: (base) => `${base}.dbml`, mime: 'text/plain', dialects: ALL, run: dbml },
	{ id: 'typescript', label: 'TypeScript', file: () => 'types.ts', mime: 'text/typescript', dialects: ALL, run: typescript },
	{ id: 'zod', label: 'Zod', file: () => 'schemas.ts', mime: 'text/typescript', dialects: ALL, run: zod }
];

export function formatInfo(id: ExportFormat): FormatInfo {
	return FORMATS.find((f) => f.id === id) ?? (FORMATS[0] as FormatInfo);
}
