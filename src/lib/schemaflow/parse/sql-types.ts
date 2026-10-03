import type { LogicalType, SqlDialectId } from '../model/types';

export type TypeArg = number | 'MAX' | string;

export interface ParsedType {
	type: LogicalType;
	autoincrement: boolean;
	serialNotNullUnique: boolean;
	unsigned: boolean;
}

const num = (arg: TypeArg | undefined): number | undefined => (typeof arg === 'number' ? arg : undefined);

function raw(dialect: SqlDialectId, text: string): ParsedType {
	return { type: { kind: 'raw', dialect, sql: text }, autoincrement: false, serialNotNullUnique: false, unsigned: false };
}

function of(type: LogicalType, autoincrement = false): ParsedType {
	return { type, autoincrement, serialNotNullUnique: false, unsigned: false };
}

function decimal(args: TypeArg[]): LogicalType {
	const precision = num(args[0]);
	const scale = num(args[1]);
	if (precision === undefined) return { kind: 'decimal' };
	return scale === undefined ? { kind: 'decimal', precision, scale: 0 } : { kind: 'decimal', precision, scale };
}

function postgres(base: string, args: TypeArg[], tz: boolean, array: boolean, text: string): ParsedType {
	if (array) return raw('postgres', text);
	switch (base) {
		case 'UUID':
			return of({ kind: 'uuid' });
		case 'SMALLINT':
		case 'INT2':
			return of({ kind: 'smallint' });
		case 'SMALLSERIAL':
		case 'SERIAL2':
			return of({ kind: 'smallint' }, true);
		case 'INTEGER':
		case 'INT':
		case 'INT4':
			return of({ kind: 'int' });
		case 'SERIAL':
		case 'SERIAL4':
			return of({ kind: 'int' }, true);
		case 'BIGINT':
		case 'INT8':
			return of({ kind: 'bigint' });
		case 'BIGSERIAL':
		case 'SERIAL8':
			return of({ kind: 'bigint' }, true);
		case 'REAL':
		case 'FLOAT4':
			return of({ kind: 'real' });
		case 'DOUBLE PRECISION':
		case 'FLOAT8':
			return of({ kind: 'double' });
		case 'FLOAT': {
			const p = num(args[0]);
			return of({ kind: p !== undefined && p <= 24 ? 'real' : 'double' });
		}
		case 'NUMERIC':
		case 'DECIMAL':
			return of(decimal(args));
		case 'BOOLEAN':
		case 'BOOL':
			return of({ kind: 'boolean' });
		case 'TEXT':
			return of({ kind: 'text' });
		case 'VARCHAR':
		case 'CHARACTER VARYING':
		case 'CHAR VARYING': {
			const length = num(args[0]);
			return of(length === undefined ? { kind: 'varchar' } : { kind: 'varchar', length });
		}
		case 'CHAR':
		case 'CHARACTER':
		case 'BPCHAR':
			return of({ kind: 'char', length: num(args[0]) ?? 1 });
		case 'DATE':
			return of({ kind: 'date' });
		case 'TIME':
			return tz ? raw('postgres', text) : of({ kind: 'time' });
		case 'TIMETZ':
			return raw('postgres', text);
		case 'TIMESTAMP':
			return of({ kind: tz ? 'timestamptz' : 'timestamp' });
		case 'TIMESTAMPTZ':
			return of({ kind: 'timestamptz' });
		case 'JSON':
		case 'JSONB':
			return of({ kind: 'json' });
		case 'BYTEA':
			return of({ kind: 'binary' });
		default:
			return raw('postgres', text);
	}
}

function mysql(base: string, args: TypeArg[], text: string): ParsedType {
	switch (base) {
		case 'CHAR':
		case 'CHARACTER':
		case 'NCHAR':
		case 'NATIONAL CHAR':
		case 'NATIONAL CHARACTER': {
			const length = num(args[0]) ?? 1;
			return of(length === 36 ? { kind: 'uuid' } : { kind: 'char', length });
		}
		case 'TINYINT':
			return of({ kind: num(args[0]) === 1 ? 'boolean' : 'smallint' });
		case 'BOOL':
		case 'BOOLEAN':
			return of({ kind: 'boolean' });
		case 'SMALLINT':
			return of({ kind: 'smallint' });
		case 'MEDIUMINT':
		case 'INT':
		case 'INTEGER':
			return of({ kind: 'int' });
		case 'BIGINT':
			return of({ kind: 'bigint' });
		case 'SERIAL':
			return { type: { kind: 'bigint' }, autoincrement: true, serialNotNullUnique: true, unsigned: true };
		case 'FLOAT': {
			const p = num(args[0]);
			return of({ kind: p !== undefined && p > 24 && args.length === 1 ? 'double' : 'real' });
		}
		case 'DOUBLE':
		case 'DOUBLE PRECISION':
		case 'REAL':
			return of({ kind: 'double' });
		case 'DECIMAL':
		case 'DEC':
		case 'NUMERIC':
		case 'FIXED':
			return of(decimal(args));
		case 'VARCHAR':
		case 'CHARACTER VARYING':
		case 'CHAR VARYING':
		case 'NVARCHAR':
		case 'NATIONAL VARCHAR':
		case 'NATIONAL CHARACTER VARYING':
		case 'NATIONAL CHAR VARYING': {
			const length = num(args[0]);
			return of(length === undefined ? { kind: 'varchar' } : { kind: 'varchar', length });
		}
		case 'TINYTEXT':
		case 'TEXT':
		case 'MEDIUMTEXT':
		case 'LONGTEXT':
		case 'LONG VARCHAR':
			return of({ kind: 'text' });
		case 'DATE':
			return of({ kind: 'date' });
		case 'TIME':
			return of({ kind: 'time' });
		case 'DATETIME':
			return of({ kind: 'timestamp' });
		case 'TIMESTAMP':
			return of({ kind: 'timestamptz' });
		case 'JSON':
			return of({ kind: 'json' });
		case 'BLOB':
		case 'TINYBLOB':
		case 'MEDIUMBLOB':
		case 'LONGBLOB':
		case 'VARBINARY':
		case 'LONG VARBINARY':
			return of({ kind: 'binary' });
		case 'BINARY':
			return num(args[0]) === 16 ? raw('mysql', text) : of({ kind: 'binary' });
		default:
			return raw('mysql', text);
	}
}

function sqlserver(base: string, args: TypeArg[], text: string): ParsedType {
	const isMax = args[0] === 'MAX';
	switch (base) {
		case 'UNIQUEIDENTIFIER':
			return of({ kind: 'uuid' });
		case 'TINYINT':
		case 'SMALLINT':
			return of({ kind: 'smallint' });
		case 'INT':
		case 'INTEGER':
			return of({ kind: 'int' });
		case 'BIGINT':
			return of({ kind: 'bigint' });
		case 'REAL':
			return of({ kind: 'real' });
		case 'FLOAT': {
			const p = num(args[0]);
			return of({ kind: p !== undefined && p <= 24 ? 'real' : 'double' });
		}
		case 'DOUBLE PRECISION':
			return of({ kind: 'double' });
		case 'DECIMAL':
		case 'DEC':
		case 'NUMERIC':
			return of(decimal(args));
		case 'MONEY':
			return of({ kind: 'decimal', precision: 19, scale: 4 });
		case 'SMALLMONEY':
			return of({ kind: 'decimal', precision: 10, scale: 4 });
		case 'BIT':
			return of({ kind: 'boolean' });
		case 'VARCHAR':
		case 'NVARCHAR':
		case 'CHARACTER VARYING':
		case 'CHAR VARYING':
		case 'NATIONAL CHARACTER VARYING':
		case 'NATIONAL CHAR VARYING':
			return of(isMax ? { kind: 'text' } : { kind: 'varchar', length: num(args[0]) ?? 1 });
		case 'CHAR':
		case 'NCHAR':
		case 'CHARACTER':
		case 'NATIONAL CHARACTER':
		case 'NATIONAL CHAR':
			return of({ kind: 'char', length: num(args[0]) ?? 1 });
		case 'TEXT':
		case 'NTEXT':
			return of({ kind: 'text' });
		case 'DATE':
			return of({ kind: 'date' });
		case 'TIME':
			return of({ kind: 'time' });
		case 'DATETIME':
		case 'DATETIME2':
		case 'SMALLDATETIME':
			return of({ kind: 'timestamp' });
		case 'DATETIMEOFFSET':
			return of({ kind: 'timestamptz' });
		case 'VARBINARY':
		case 'BINARY':
		case 'IMAGE':
			return of({ kind: 'binary' });
		case 'JSON':
			return of({ kind: 'json' });
		default:
			return raw('sqlserver', text);
	}
}

export function mapType(
	dialect: SqlDialectId,
	base: string,
	args: TypeArg[],
	options: { tz: boolean; array: boolean; unsigned: boolean; text: string; quoted: boolean }
): ParsedType {
	if (options.quoted) return raw(dialect, options.text);
	let parsed: ParsedType;
	if (dialect === 'postgres') parsed = postgres(base, args, options.tz, options.array, options.text);
	else if (dialect === 'mysql') parsed = mysql(base, args, options.text);
	else parsed = sqlserver(base, args, options.text);
	return { ...parsed, unsigned: parsed.unsigned || options.unsigned };
}
