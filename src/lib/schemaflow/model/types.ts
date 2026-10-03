export type DialectId = 'postgres' | 'mysql' | 'sqlserver' | 'mongodb';
export type SqlDialectId = Exclude<DialectId, 'mongodb'>;

export const DIALECTS: readonly DialectId[] = ['postgres', 'mysql', 'sqlserver', 'mongodb'];
export const SQL_DIALECTS: readonly SqlDialectId[] = ['postgres', 'mysql', 'sqlserver'];

export type SimpleKind =
	| 'uuid'
	| 'smallint'
	| 'int'
	| 'bigint'
	| 'real'
	| 'double'
	| 'boolean'
	| 'text'
	| 'date'
	| 'time'
	| 'timestamp'
	| 'timestamptz'
	| 'json'
	| 'binary';

export type LogicalType =
	| { kind: SimpleKind }
	| { kind: 'varchar' | 'char'; length?: number }
	| { kind: 'decimal'; precision?: number; scale?: number }
	| { kind: 'raw'; dialect: DialectId; sql: string };

export type TypeKind = LogicalType['kind'];

export type DefaultValue =
	| { kind: 'none' }
	| { kind: 'now' }
	| { kind: 'uuid' }
	| { kind: 'autoincrement' }
	| { kind: 'literal'; value: string | number | boolean | null }
	| { kind: 'expression'; dialect: DialectId; sql: string }
	| { kind: 'computed'; dialect: DialectId; sql: string };

export type Action = 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
export const ACTIONS: readonly Action[] = ['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT'];

export interface Column {
	id: string;
	name: string;
	type: LogicalType;
	nullable: boolean;
	default: DefaultValue;
	comment?: string;
}

export interface UniqueConstraint {
	id: string;
	name?: string;
	columns: string[];
}

export interface Index {
	id: string;
	name?: string;
	columns: string[];
	unique: boolean;
}

export interface Table {
	id: string;
	name: string;
	x: number;
	y: number;
	color?: string;
	comment?: string;
	columns: Column[];
	primaryKey: string[];
	primaryKeyName?: string;
	uniques: UniqueConstraint[];
	indexes: Index[];
}

export interface Relation {
	id: string;
	name?: string;
	fromTable: string;
	fromColumns: string[];
	toTable: string;
	toColumns: string[];
	onDelete: Action;
	onUpdate: Action;
}

export interface Note {
	id: string;
	x: number;
	y: number;
	w: number;
	h: number;
	text: string;
	color: string;
}

export interface Area {
	id: string;
	x: number;
	y: number;
	w: number;
	h: number;
	title: string;
	color: string;
}

export interface Extra {
	id: string;
	dialect: DialectId;
	sql: string;
	placement: 'before' | 'after';
}

export interface Schema {
	version: 1;
	name: string;
	tables: Table[];
	relations: Relation[];
	notes: Note[];
	areas: Area[];
	extras: Extra[];
}

export const LIMITS = {
	tables: 200,
	columns: 100,
	name: 128,
	notes: 100,
	areas: 50,
	noteText: 2000,
	extras: 500,
	extraSql: 100_000,
	code: 250_000
} as const;

export const COLORS = ['slate', 'blue', 'teal', 'green', 'amber', 'red', 'violet'] as const;
export type ColorName = (typeof COLORS)[number];

export const CARD_WIDTH = 260;
export const HEADER_HEIGHT = 44;
export const ROW_HEIGHT = 28;
export const LIST_PADDING = 5;
export const CARD_BORDER = 1;

export function tableHeight(table: Pick<Table, 'columns'>): number {
	return CARD_BORDER * 2 + HEADER_HEIGHT + LIST_PADDING * 2 + Math.max(1, table.columns.length) * ROW_HEIGHT;
}

export function emptySchema(name = 'schema'): Schema {
	return { version: 1, name, tables: [], relations: [], notes: [], areas: [], extras: [] };
}
