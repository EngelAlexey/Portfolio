import { notNull } from '../model/diff';
import type { Column, Schema, SqlDialectId } from '../model/types';
import { nameTables } from './names';
import { isComputed, isOptionalOnInsert, propertyKey } from './typescript';

export function zodType(column: Column): string {
	const type = column.type;
	switch (type.kind) {
		case 'uuid':
			return 'z.string().uuid()';
		case 'smallint':
			return 'z.number().int().min(-32768).max(32767)';
		case 'int':
			return 'z.number().int().min(-2147483648).max(2147483647)';
		case 'bigint':
			return 'z.number().int()';
		case 'real':
		case 'double':
			return 'z.number()';
		case 'decimal':
			return 'z.string().regex(/^-?\\d+(\\.\\d+)?$/)';
		case 'boolean':
			return 'z.boolean()';
		case 'varchar':
			return type.length ? `z.string().max(${type.length})` : 'z.string()';
		case 'char':
			return type.length ? `z.string().length(${type.length})` : 'z.string()';
		case 'date':
		case 'timestamp':
		case 'timestamptz':
			return 'z.date()';
		case 'binary':
			return 'z.instanceof(Uint8Array)';
		case 'json':
		case 'raw':
			return 'z.unknown()';
		default:
			return 'z.string()';
	}
}

export function zod(schema: Schema, _dialect: SqlDialectId): string {
	const names = nameTables(schema);
	const blocks: string[] = [];
	for (const table of schema.tables) {
		const named = names.get(table.id);
		if (!named) continue;
		const base = `${named.variable}Schema`;
		const insert = `${named.variable}InsertSchema`;
		const shape = table.columns.map((c) => `\t${propertyKey(c.name)}: ${zodType(c)}${notNull(table, c) ? '' : '.nullable()'},`);
		const computed = table.columns.filter(isComputed).map((c) => `${propertyKey(c.name)}: true`);
		const optional = table.columns.filter((c) => !isComputed(c) && isOptionalOnInsert(table, c)).map((c) => `${propertyKey(c.name)}: true`);
		let chain = base;
		if (computed.length > 0) chain += `.omit({ ${computed.join(', ')} })`;
		if (optional.length > 0) chain += `.partial({ ${optional.join(', ')} })`;
		blocks.push(
			[
				`export const ${base} = z.object({\n${shape.join('\n')}\n});`,
				`export type ${named.typeName} = z.infer<typeof ${base}>;`,
				`export const ${insert} = ${chain};`,
				`export type ${named.typeName}Insert = z.infer<typeof ${insert}>;`
			].join('\n')
		);
	}
	return blocks.length > 0 ? `import { z } from 'zod';\n\n${blocks.join('\n\n')}\n` : '';
}
