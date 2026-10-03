import type { DialectId, Schema } from '../model/types';
import { generateMongo } from './mongo-generate';
import { generateSql } from './sql-generate';

export const DIALECT_LABELS: Record<DialectId, string> = {
	postgres: 'PostgreSQL',
	mysql: 'MySQL',
	sqlserver: 'SQL Server',
	mongodb: 'MongoDB'
};

export const FILE_NAMES: Record<DialectId, string> = {
	postgres: 'schema.postgres.sql',
	mysql: 'schema.mysql.sql',
	sqlserver: 'schema.sqlserver.sql',
	mongodb: 'schema.mongodb.js'
};

export function generate(dialect: DialectId, schema: Schema): string {
	return dialect === 'mongodb' ? generateMongo(schema) : generateSql(dialect, schema);
}
