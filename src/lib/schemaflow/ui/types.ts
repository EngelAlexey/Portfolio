import { sqlType } from '../dialects/sql-generate';
import type { DialectId, LogicalType } from '../model/types';
import { mapType } from '../parse/sql-types';
import { typeLabel } from '../validate/rules';
import { fold, type Strings } from './strings';

export type TypeGroup = 'numbers' | 'text' | 'dates' | 'other';
export type CommonTypeId = 'text' | 'longText' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'uuid' | 'json';
export type TypeChoiceId = CommonTypeId | 'smallint' | 'bigint' | 'real' | 'double' | 'char' | 'time' | 'timestamp' | 'binary';

export interface TypeChoice {
	id: TypeChoiceId;
	type: LogicalType;
	group: TypeGroup;
	common: boolean;
	sql: string;
	keywords: readonly string[];
}

export const TYPE_CHOICES: readonly TypeChoice[] = [
	{ id: 'text', type: { kind: 'varchar', length: 255 }, group: 'text', common: true, sql: 'varchar(255)', keywords: ['texto', 'text', 'cadena', 'string', 'varchar', 'nombre', 'name', 'correo', 'email', 'titulo', 'title'] },
	{ id: 'longText', type: { kind: 'text' }, group: 'text', common: true, sql: 'text', keywords: ['texto largo', 'long text', 'descripcion', 'description', 'comentario', 'comment', 'contenido', 'content'] },
	{ id: 'integer', type: { kind: 'int' }, group: 'numbers', common: true, sql: 'int', keywords: ['entero', 'integer', 'numero', 'number', 'cantidad', 'quantity', 'contador', 'count', 'edad', 'age'] },
	{ id: 'decimal', type: { kind: 'decimal', precision: 10, scale: 2 }, group: 'numbers', common: true, sql: 'decimal', keywords: ['decimal', 'numeric', 'numerico', 'dinero', 'money', 'precio', 'price', 'importe', 'amount', 'moneda', 'currency'] },
	{ id: 'boolean', type: { kind: 'boolean' }, group: 'other', common: true, sql: 'boolean', keywords: ['si o no', 'yes or no', 'booleano', 'boolean', 'bool', 'verdadero', 'falso', 'true', 'false', 'activo', 'active', 'bandera', 'flag'] },
	{ id: 'date', type: { kind: 'date' }, group: 'dates', common: true, sql: 'date', keywords: ['fecha', 'date', 'dia', 'day', 'cumpleanos', 'birthday', 'vencimiento', 'due'] },
	{ id: 'datetime', type: { kind: 'timestamptz' }, group: 'dates', common: true, sql: 'timestamptz', keywords: ['fecha y hora', 'date and time', 'datetime', 'momento', 'creado', 'created', 'actualizado', 'updated', 'zona horaria', 'time zone'] },
	{ id: 'uuid', type: { kind: 'uuid' }, group: 'other', common: true, sql: 'uuid', keywords: ['uuid', 'guid', 'identificador', 'identifier', 'unico', 'unique', 'clave', 'key'] },
	{ id: 'json', type: { kind: 'json' }, group: 'other', common: true, sql: 'json', keywords: ['json', 'jsonb', 'objeto', 'object', 'datos', 'data', 'configuracion', 'settings'] },
	{ id: 'smallint', type: { kind: 'smallint' }, group: 'numbers', common: false, sql: 'smallint', keywords: ['entero pequeno', 'small integer', 'int2', 'pequeno', 'small'] },
	{ id: 'bigint', type: { kind: 'bigint' }, group: 'numbers', common: false, sql: 'bigint', keywords: ['entero grande', 'big integer', 'int8', 'grande', 'big', 'long'] },
	{ id: 'real', type: { kind: 'real' }, group: 'numbers', common: false, sql: 'real', keywords: ['float', 'float4', 'flotante', 'decimal aproximado', 'approximate'] },
	{ id: 'double', type: { kind: 'double' }, group: 'numbers', common: false, sql: 'double', keywords: ['double precision', 'float8', 'doble', 'decimal aproximado', 'approximate'] },
	{ id: 'char', type: { kind: 'char', length: 1 }, group: 'text', common: false, sql: 'char(1)', keywords: ['texto de longitud fija', 'fixed length', 'fixed-length text', 'codigo', 'code'] },
	{ id: 'time', type: { kind: 'time' }, group: 'dates', common: false, sql: 'time', keywords: ['hora', 'hour'] },
	{ id: 'timestamp', type: { kind: 'timestamp' }, group: 'dates', common: false, sql: 'timestamp', keywords: ['fecha y hora sin zona', 'without time zone', 'sin zona', 'datetime'] },
	{ id: 'binary', type: { kind: 'binary' }, group: 'other', common: false, sql: 'binary', keywords: ['binario', 'blob', 'bytea', 'varbinary', 'archivo', 'file', 'bytes'] }
];

export const TYPE_BY_ID = Object.fromEntries(TYPE_CHOICES.map((choice) => [choice.id, choice])) as Record<TypeChoiceId, TypeChoice>;
export const COMMON_TYPES = Object.fromEntries(TYPE_CHOICES.filter((choice) => choice.common).map((choice) => [choice.id, choice.type])) as Record<CommonTypeId, LogicalType>;

export function choiceLabel(strings: Strings, id: TypeChoiceId): string {
	return strings.types.choices[id].label;
}

export function searchTypes(query: string, labelOf: (id: TypeChoiceId) => string, dialect: DialectId): TypeChoice[] {
	const needle = fold(query.replace(/\(.*$/, '')).trim();
	if (!needle) return TYPE_CHOICES.filter((choice) => choice.common);
	const scored: { choice: TypeChoice; rank: number; order: number }[] = [];
	TYPE_CHOICES.forEach((choice, order) => {
		const terms = [labelOf(choice.id), choice.sql, renderType(choice.type, dialect), ...choice.keywords].map(fold);
		let rank = Number.POSITIVE_INFINITY;
		for (const term of terms) {
			if (term === needle) rank = Math.min(rank, 0);
			else if (term.startsWith(needle)) rank = Math.min(rank, 1);
			else if (term.split(/[^a-z0-9]+/).some((word) => word.startsWith(needle))) rank = Math.min(rank, 2);
			else if (term.includes(needle)) rank = Math.min(rank, 3);
		}
		if (rank !== Number.POSITIVE_INFINITY) scored.push({ choice, rank, order });
	});
	return scored.sort((a, b) => a.rank - b.rank || a.order - b.order).map((entry) => entry.choice);
}

const BSON: Record<string, string> = {
	uuid: 'objectId',
	smallint: 'int',
	int: 'int',
	bigint: 'long',
	real: 'double',
	double: 'double',
	decimal: 'decimal',
	boolean: 'bool',
	varchar: 'string',
	char: 'string',
	text: 'string',
	date: 'date',
	time: 'string',
	timestamp: 'date',
	timestamptz: 'date',
	json: 'object',
	binary: 'binData'
};

export function renderType(type: LogicalType, dialect: DialectId): string {
	if (dialect === 'mongodb') return type.kind === 'raw' ? (type.dialect === 'mongodb' ? type.sql : 'string') : (BSON[type.kind] ?? 'string');
	return sqlType(dialect, type);
}

export function displayType(type: LogicalType): string {
	return typeLabel(type);
}

const ALIASES: Record<string, LogicalType> = {
	uuid: { kind: 'uuid' },
	smallint: { kind: 'smallint' },
	int: { kind: 'int' },
	integer: { kind: 'int' },
	bigint: { kind: 'bigint' },
	real: { kind: 'real' },
	float: { kind: 'double' },
	double: { kind: 'double' },
	boolean: { kind: 'boolean' },
	bool: { kind: 'boolean' },
	text: { kind: 'text' },
	string: { kind: 'text' },
	date: { kind: 'date' },
	time: { kind: 'time' },
	timestamp: { kind: 'timestamp' },
	datetime: { kind: 'timestamp' },
	timestamptz: { kind: 'timestamptz' },
	json: { kind: 'json' },
	jsonb: { kind: 'json' },
	binary: { kind: 'binary' },
	varchar: { kind: 'varchar', length: 255 },
	char: { kind: 'char', length: 1 },
	decimal: { kind: 'decimal', precision: 10, scale: 2 },
	numeric: { kind: 'decimal', precision: 10, scale: 2 }
};

export function parseTypeText(text: string, dialect: DialectId): LogicalType | null {
	const clean = text.trim().replace(/\s+/g, ' ');
	if (!clean || clean.length > 100) return null;
	const match = /^([A-Za-z_][A-Za-z0-9_ ]*?)\s*(?:\(\s*([^()]*)\s*\))?(\s*\[\])?$/.exec(clean);
	if (!match) return null;
	const base = (match[1] ?? '').toLowerCase();
	const args = (match[2] ?? '')
		.split(',')
		.map((a) => a.trim())
		.filter(Boolean);
	const nums = args.map((a) => (/^\d+$/.test(a) ? Number(a) : a.toUpperCase() === 'MAX' ? 'MAX' : NaN));
	if (nums.some((n) => typeof n === 'number' && Number.isNaN(n))) return null;
	if (!match[3]) {
		if ((base === 'varchar' || base === 'char') && nums.length <= 1) {
			const length = nums[0];
			if (length === 'MAX') return { kind: 'text' };
			if (typeof length === 'number') return length > 0 && length <= 1_000_000 ? { kind: base, length } : null;
			return ALIASES[base] ?? null;
		}
		if ((base === 'decimal' || base === 'numeric') && nums.length <= 2) {
			const [p, sc] = nums;
			if (typeof p === 'number' && p > 0 && p <= 1000) {
				const scale = typeof sc === 'number' ? sc : 0;
				return scale <= p ? { kind: 'decimal', precision: p, scale } : null;
			}
			if (nums.length === 0) return ALIASES[base] ?? null;
			return null;
		}
		if (nums.length === 0 && ALIASES[base]) return ALIASES[base] ?? null;
	}
	if (dialect === 'mongodb') {
		const bson: Record<string, LogicalType> = { objectid: { kind: 'uuid' }, long: { kind: 'bigint' }, bindata: { kind: 'binary' }, object: { kind: 'json' } };
		return bson[base] ?? { kind: 'raw', dialect: 'mongodb', sql: clean };
	}
	const parsed = mapType(dialect, base.toUpperCase(), nums.filter((n): n is number | 'MAX' => n !== undefined), { tz: false, array: Boolean(match[3]), unsigned: false, text: clean, quoted: false });
	return parsed.type;
}
