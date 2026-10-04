import { classifyTypeChange, diffSchemas, notNull, type ColumnChange, type SchemaDiff, type TableDiff } from '../model/diff';
import { dropOrder } from '../model/order';
import type { Column, Index, Schema, SqlDialectId, Table, UniqueConstraint } from '../model/types';
import { constraintName, quote } from './names';
import { columnLine, comments, createIndex, createIndexes, createTable, defaultSql, foreignKey, identitySql, indexLabel, keyList, relationName, sqlType, stringLiteral } from './sql-generate';

export const WARNING_CODES = [
	'drop-table',
	'drop-column',
	'recreate-column',
	'type-narrow',
	'type-convert',
	'set-not-null',
	'add-not-null',
	'add-primary-key',
	'add-unique',
	'add-foreign-key',
	'identity-manual'
] as const;

export type WarningCode = (typeof WARNING_CODES)[number];

export interface Warning {
	level: 'danger' | 'caution';
	code: WarningCode;
	table: string;
	column?: string;
}

export interface Step {
	sql: string;
	warnings: Warning[];
	batch: boolean;
}

export interface Migration {
	dialect: SqlDialectId;
	steps: Step[];
}

const danger = (code: WarningCode, table: string, column?: string): Warning => ({ level: 'danger', code, table, ...(column === undefined ? {} : { column }) });
const caution = (code: WarningCode, table: string, column?: string): Warning => ({ level: 'caution', code, table, ...(column === undefined ? {} : { column }) });

const isComputed = (column: Column) => column.default.kind === 'computed';

const CATEGORY: Record<string, string> = {
	smallint: 'number',
	int: 'number',
	bigint: 'number',
	real: 'number',
	double: 'number',
	decimal: 'number',
	varchar: 'string',
	char: 'string',
	text: 'string',
	date: 'time',
	time: 'time',
	timestamp: 'time',
	timestamptz: 'time'
};

function needsUsing(from: Column, to: Column): boolean {
	const a = CATEGORY[from.type.kind] ?? from.type.kind;
	const b = CATEGORY[to.type.kind] ?? to.type.kind;
	return a !== b;
}

export function buildMigration(d: SqlDialectId, diff: SchemaDiff): Migration {
	const steps: Step[] = [];
	const q = (name: string) => quote(d, name);
	let counter = 0;
	const variable = () => `@m${++counter}`;
	const push = (sql: string, warnings: Warning[] = [], batch = false) => steps.push({ sql, warnings, batch });

	const bracket = (table: string) => `[dbo].[${table.replaceAll(']', ']]')}]`;
	const objectId = (table: string) => `OBJECT_ID(${stringLiteral('sqlserver', bracket(table))})`;
	const dropFound = (table: string, v: string) => `IF ${v} IS NOT NULL EXEC(${stringLiteral('sqlserver', `ALTER TABLE ${bracket(table)} DROP CONSTRAINT `)} + QUOTENAME(${v}));`;
	const dropDefault = (table: string, column: string) => {
		const v = variable();
		return `DECLARE ${v} sysname = (SELECT dc.name FROM sys.default_constraints dc JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id WHERE dc.parent_object_id = ${objectId(table)} AND c.name = ${stringLiteral('sqlserver', column)});\n${dropFound(table, v)}`;
	};
	const dropPrimaryKey = (table: Table) => {
		if (d === 'mysql') return `ALTER TABLE ${q(table.name)} DROP PRIMARY KEY;`;
		if (d === 'postgres') return `ALTER TABLE ${q(table.name)} DROP CONSTRAINT ${q(table.primaryKeyName ?? constraintName(d, `${table.name}_pkey`))};`;
		if (table.primaryKeyName) return `ALTER TABLE ${q(table.name)} DROP CONSTRAINT ${q(table.primaryKeyName)};`;
		const v = variable();
		return `DECLARE ${v} sysname = (SELECT kc.name FROM sys.key_constraints kc WHERE kc.parent_object_id = ${objectId(table.name)} AND kc.type = 'PK');\n${dropFound(table.name, v)}`;
	};
	const columnNames = (table: Table, ids: string[]) => ids.map((id) => table.columns.find((c) => c.id === id)?.name ?? id);
	const dropUnique = (table: Table, unique: UniqueConstraint) => {
		const names = columnNames(table, unique.columns);
		if (d === 'mysql') return `ALTER TABLE ${q(table.name)} DROP INDEX ${q(unique.name ?? names[0] ?? '')};`;
		if (unique.name || d === 'postgres') return `ALTER TABLE ${q(table.name)} DROP CONSTRAINT ${q(unique.name ?? constraintName(d, `${table.name}_${names.join('_')}_key`))};`;
		const v = variable();
		const has = names.map((n) => `EXISTS (SELECT 1 FROM sys.index_columns k JOIN sys.columns c ON c.object_id = k.object_id AND c.column_id = k.column_id WHERE k.object_id = i.object_id AND k.index_id = i.index_id AND c.name = ${stringLiteral('sqlserver', n)})`).join(' AND ');
		return `DECLARE ${v} sysname = (SELECT TOP 1 i.name FROM sys.indexes i WHERE i.object_id = ${objectId(table.name)} AND i.is_unique_constraint = 1 AND (SELECT COUNT(*) FROM sys.index_columns k WHERE k.object_id = i.object_id AND k.index_id = i.index_id) = ${names.length} AND ${has});\n${dropFound(table.name, v)}`;
	};
	const dropIndex = (table: Table, index: Index) => {
		const name = q(indexLabel(d, table, index));
		return d === 'postgres' ? `DROP INDEX ${name};` : `DROP INDEX ${name} ON ${q(table.name)};`;
	};
	const description = (table: string, value: string, column: string | undefined, procedure: 'add' | 'update' | 'drop') => {
		const parts = [`@name = N'MS_Description'`];
		if (procedure !== 'drop') parts.push(`@value = ${stringLiteral('sqlserver', value)}`);
		parts.push(`@level0type = N'SCHEMA'`, `@level0name = N'dbo'`, `@level1type = N'TABLE'`, `@level1name = ${stringLiteral('sqlserver', table)}`);
		if (column !== undefined) parts.push(`@level2type = N'COLUMN'`, `@level2name = ${stringLiteral('sqlserver', column)}`);
		return `EXEC sys.sp_${procedure}extendedproperty ${parts.join(', ')};`;
	};
	const commentStep = (table: Table, column: Column | undefined, before: string, after: string) => {
		const target = column === undefined ? `TABLE ${q(table.name)}` : `COLUMN ${q(table.name)}.${q(column.name)}`;
		if (d === 'postgres') push(`COMMENT ON ${target} IS ${after ? stringLiteral(d, after) : 'NULL'};`);
		else if (d === 'sqlserver') push(description(table.name, after, column?.name, !before ? 'add' : after ? 'update' : 'drop'));
		else if (column === undefined) push(`ALTER TABLE ${q(table.name)} COMMENT = ${stringLiteral(d, after)};`);
	};

	const dropping = dropOrder(diff.tablesDropped, diff.before.relations);

	for (const relation of [...diff.relationsDropped, ...dropping.cyclic]) {
		const from = diff.before.tables.find((t) => t.id === relation.fromTable);
		if (!from) continue;
		const name = q(relationName(d, relation, from));
		push(d === 'mysql' ? `ALTER TABLE ${q(from.name)} DROP FOREIGN KEY ${name};` : `ALTER TABLE ${q(from.name)} DROP CONSTRAINT ${name};`);
	}

	for (const t of diff.tables) {
		for (const index of t.indexesDropped) push(dropIndex(t.before, index));
		for (const unique of t.uniquesDropped) push(dropUnique(t.before, unique));
		if (t.primaryKey && t.primaryKey.before.length > 0) push(dropPrimaryKey(t.before));
	}

	for (const t of diff.tables) {
		for (const column of t.columnsDropped) {
			if (d === 'sqlserver' && defaultSql(d, column) !== null) push(dropDefault(t.before.name, column.name));
			push(`ALTER TABLE ${q(t.before.name)} DROP COLUMN ${q(column.name)};`, [danger('drop-column', t.before.name, column.name)], true);
		}
	}

	for (const table of dropping.order) push(`DROP TABLE ${q(table.name)};`, [danger('drop-table', table.name)]);

	for (const t of diff.tables) {
		if (!t.renamed) continue;
		if (d === 'postgres') push(`ALTER TABLE ${q(t.before.name)} RENAME TO ${q(t.after.name)};`);
		else if (d === 'mysql') push(`RENAME TABLE ${q(t.before.name)} TO ${q(t.after.name)};`);
		else push(`EXEC sp_rename ${stringLiteral(d, t.before.name)}, ${stringLiteral(d, t.after.name)};`, [], true);
	}

	const recreated = (c: ColumnChange) => c.default && (isComputed(c.before) || isComputed(c.after));

	for (const t of diff.tables) {
		for (const change of t.columnsChanged) {
			if (!change.renamed || recreated(change)) continue;
			if (d === 'sqlserver') push(`EXEC sp_rename ${stringLiteral(d, `${t.after.name}.${change.before.name}`)}, ${stringLiteral(d, change.after.name)}, N'COLUMN';`, [], true);
			else push(`ALTER TABLE ${q(t.after.name)} RENAME COLUMN ${q(change.before.name)} TO ${q(change.after.name)};`);
		}
	}

	const addColumn = (t: TableDiff, column: Column) => {
		const warnings: Warning[] = [];
		if (notNull(t.after, column) && defaultSql(d, column) === null && identitySql(d, column) === null && !isComputed(column)) warnings.push(caution('add-not-null', t.after.name, column.name));
		const line = columnLine(d, t.after, column, false, false);
		push(d === 'sqlserver' ? `ALTER TABLE ${q(t.after.name)} ADD ${line};` : `ALTER TABLE ${q(t.after.name)} ADD COLUMN ${line};`, warnings, true);
	};

	const alterColumn = (t: TableDiff, change: ColumnChange) => {
		const { before, after } = change;
		const table = t.after.name;
		if (recreated(change)) {
			push(`ALTER TABLE ${q(table)} DROP COLUMN ${q(before.name)};`, [danger('recreate-column', table, after.name)], true);
			addColumn(t, after);
			return;
		}
		const warnings: Warning[] = [];
		if (change.type) {
			const kind = classifyTypeChange(before.type, after.type);
			if (kind === 'narrow') warnings.push(danger('type-narrow', table, after.name));
			else if (kind === 'convert') warnings.push(caution('type-convert', table, after.name));
		}
		const wasRequired = notNull(t.before, before);
		const required = notNull(t.after, after);
		if (change.nullable && required && !wasRequired) warnings.push(caution('set-not-null', table, after.name));
		const beforeDefault = defaultSql(d, before);
		const afterDefault = defaultSql(d, after);
		const defaultChanged = beforeDefault !== afterDefault;
		const identityChanged = (identitySql(d, before) !== null) !== (identitySql(d, after) !== null);
		const typeChanged = change.type;
		const commentChanged = change.comment;

		if (d === 'mysql') {
			if (typeChanged || change.nullable || defaultChanged || identityChanged || commentChanged) push(`ALTER TABLE ${q(table)} MODIFY COLUMN ${columnLine(d, t.after, after, false, false)};`, warnings, true);
			return;
		}

		if (d === 'sqlserver') {
			if (beforeDefault !== null && (typeChanged || defaultChanged)) push(dropDefault(table, after.name));
			if (typeChanged || change.nullable) push(`ALTER TABLE ${q(table)} ALTER COLUMN ${q(after.name)} ${sqlType(d, after.type)} ${required ? 'NOT NULL' : 'NULL'};`, warnings, true);
			if (afterDefault !== null && (defaultChanged || (typeChanged && beforeDefault !== null))) push(`ALTER TABLE ${q(table)} ADD DEFAULT ${afterDefault} FOR ${q(after.name)};`, [], true);
			if (identityChanged) push('', [caution('identity-manual', table, after.name)]);
			if (commentChanged) commentStep(t.after, after, before.comment ?? '', after.comment ?? '');
			return;
		}

		const alter = (what: string) => `ALTER TABLE ${q(table)} ALTER COLUMN ${q(after.name)} ${what};`;
		const droppedDefault = beforeDefault !== null && (typeChanged || (identityChanged && identitySql(d, after) !== null));
		const statements: string[] = [];
		if (droppedDefault) statements.push(alter('DROP DEFAULT'));
		if (typeChanged) statements.push(alter(`TYPE ${sqlType(d, after.type)}${needsUsing(before, after) ? ` USING ${q(after.name)}::${sqlType(d, after.type)}` : ''}`));
		if (change.nullable) statements.push(alter(required ? 'SET NOT NULL' : 'DROP NOT NULL'));
		if (identityChanged) statements.push(alter(identitySql(d, after) !== null ? 'ADD GENERATED BY DEFAULT AS IDENTITY' : 'DROP IDENTITY IF EXISTS'));
		if (afterDefault !== null && (defaultChanged || droppedDefault)) statements.push(alter(`SET DEFAULT ${afterDefault}`));
		else if (afterDefault === null && defaultChanged && !droppedDefault) statements.push(alter('DROP DEFAULT'));
		if (statements.length > 0) push(statements.join('\n'), warnings);
		if (commentChanged) commentStep(t.after, after, before.comment ?? '', after.comment ?? '');
	};

	for (const t of diff.tables) for (const change of t.columnsChanged) alterColumn(t, change);

	for (const table of diff.tablesAdded) {
		push(createTable(d, table), [], true);
		for (const sql of createIndexes(d, table)) push(sql);
		for (const sql of comments(d, table)) push(sql);
	}

	for (const t of diff.tables) {
		for (const column of t.columnsAdded) {
			addColumn(t, column);
			if (column.comment && d !== 'mysql') commentStep(t.after, column, '', column.comment);
		}
	}

	for (const t of diff.tables) {
		if (t.primaryKey && t.primaryKey.after.length > 0) {
			const prefix = t.after.primaryKeyName ? `CONSTRAINT ${q(t.after.primaryKeyName)} ` : '';
			push(`ALTER TABLE ${q(t.after.name)} ADD ${prefix}PRIMARY KEY (${keyList(d, t.after, t.after.primaryKey)});`, [caution('add-primary-key', t.after.name)]);
		}
		for (const unique of t.uniquesAdded) {
			const prefix = unique.name ? `CONSTRAINT ${q(unique.name)} ` : '';
			push(`ALTER TABLE ${q(t.after.name)} ADD ${prefix}UNIQUE (${keyList(d, t.after, unique.columns)});`, [caution('add-unique', t.after.name, columnNames(t.after, unique.columns).join(', '))]);
		}
		for (const index of t.indexesAdded) push(createIndex(d, t.after, index));
		if (t.commentChanged) commentStep(t.after, undefined, t.before.comment ?? '', t.after.comment ?? '');
	}

	const created = new Set(diff.tablesAdded.map((t) => t.id));
	for (const relation of diff.relationsAdded) {
		const sql = foreignKey(d, diff.after, relation);
		if (!sql) continue;
		const from = diff.after.tables.find((t) => t.id === relation.fromTable);
		push(sql, created.has(relation.fromTable) || !from ? [] : [caution('add-foreign-key', from.name, columnNames(from, relation.fromColumns).join(', '))]);
	}

	return { dialect: d, steps };
}

export function migrate(d: SqlDialectId, before: Schema, after: Schema): Migration {
	return buildMigration(d, diffSchemas(before, after));
}

export function migrationWarnings(migration: Migration): Warning[] {
	return migration.steps.flatMap((s) => s.warnings);
}

export interface RenderOptions {
	transaction: boolean;
	describe: (warning: Warning) => string;
}

const commentLine = (text: string) => `-- ${text.replace(/[\r\n\u2028\u2029]+/g, ' ')}`;

export function renderMigration(migration: Migration, options: RenderOptions): string {
	if (migration.steps.length === 0) return '';
	const d = migration.dialect;
	let out = '';
	migration.steps.forEach((step, i) => {
		const lines = [...step.warnings.map((w) => commentLine(options.describe(w))), step.sql].filter(Boolean).join('\n');
		out += lines;
		if (i < migration.steps.length - 1) out += d === 'sqlserver' && step.batch ? '\nGO\n\n' : '\n\n';
	});
	if (!options.transaction || d === 'mysql') return `${out}\n`;
	if (d === 'postgres') return `BEGIN;\n\n${out}\n\nCOMMIT;\n`;
	return `SET XACT_ABORT ON;\nBEGIN TRANSACTION;\n\n${out}\n\nCOMMIT;\n`;
}
