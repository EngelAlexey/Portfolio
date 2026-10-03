import { sqlType } from '../dialects/sql-generate';
import type { DialectId, LogicalType } from '../model/types';
import { mapType } from '../parse/sql-types';
import { typeLabel } from '../validate/rules';

export interface TypeOption {
	text: string;
	type: LogicalType;
	group: 'numbers' | 'text' | 'dates' | 'other';
}

export const TYPE_OPTIONS: TypeOption[] = [
	{ text: 'smallint', type: { kind: 'smallint' }, group: 'numbers' },
	{ text: 'int', type: { kind: 'int' }, group: 'numbers' },
	{ text: 'bigint', type: { kind: 'bigint' }, group: 'numbers' },
	{ text: 'decimal(10, 2)', type: { kind: 'decimal', precision: 10, scale: 2 }, group: 'numbers' },
	{ text: 'real', type: { kind: 'real' }, group: 'numbers' },
	{ text: 'double', type: { kind: 'double' }, group: 'numbers' },
	{ text: 'varchar(255)', type: { kind: 'varchar', length: 255 }, group: 'text' },
	{ text: 'char(1)', type: { kind: 'char', length: 1 }, group: 'text' },
	{ text: 'text', type: { kind: 'text' }, group: 'text' },
	{ text: 'date', type: { kind: 'date' }, group: 'dates' },
	{ text: 'time', type: { kind: 'time' }, group: 'dates' },
	{ text: 'timestamp', type: { kind: 'timestamp' }, group: 'dates' },
	{ text: 'timestamptz', type: { kind: 'timestamptz' }, group: 'dates' },
	{ text: 'uuid', type: { kind: 'uuid' }, group: 'other' },
	{ text: 'boolean', type: { kind: 'boolean' }, group: 'other' },
	{ text: 'json', type: { kind: 'json' }, group: 'other' },
	{ text: 'binary', type: { kind: 'binary' }, group: 'other' }
];

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
