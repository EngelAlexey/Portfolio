import { quote } from '../dialects/names';
import { isUnique } from '../model/ops';
import type { Column, Relation, Schema, Table } from '../model/types';
import { sampleSql, sampleValue, type SampleLang } from './sample-rows';
import { fill, type Strings } from './strings';

export type SnippetGroup = 'view' | 'filter' | 'join' | 'group' | 'change' | 'structure';
export type SnippetTexts = Strings['pg']['query']['snippets'];

export const SNIPPET_GROUPS: readonly SnippetGroup[] = ['view', 'filter', 'join', 'group', 'change', 'structure'];

export interface Snippet {
	id: string;
	group: SnippetGroup;
	label: string;
	sql: string;
}

const TEXT = new Set(['varchar', 'char', 'text']);
const NUMBER = new Set(['smallint', 'int', 'bigint', 'decimal', 'real', 'double']);
const TEMPORAL = new Set(['date', 'timestamp', 'timestamptz']);
const NAME_LIKE = /(^|_)(name|nombre|title|titulo|description|descripcion|label|etiqueta|text|texto)($|_)/i;
const STATE_LIKE = /(^|_)(status|estado|state|type|tipo|role|rol|plan|level|nivel|category|categoria)($|_)/i;

const isText = (column: Column) => TEXT.has(column.type.kind);
const isNumber = (column: Column) => NUMBER.has(column.type.kind);
const isTemporal = (column: Column) => TEMPORAL.has(column.type.kind);
const quoted = (text: string) => `'${text.replaceAll("'", "''")}'`;
const note = (text: string) => `-- ${text.replace(/[\r\n\u2028\u2029]+/g, ' ')}`;

export function sampleScript(schema: Schema, tableIds: readonly string[] | null, label: string, texts: SnippetTexts, lang: SampleLang): string {
	const result = sampleSql(schema, tableIds, lang);
	return [note(label), ...result.skipped.map((table) => note(fill(texts.skipped, { table }))), result.sql].join('\n');
}

function columnsOf(table: Table, ids: readonly string[]): Column[] {
	return ids.map((id) => table.columns.find((column) => column.id === id)).filter((column): column is Column => column !== undefined);
}

export function buildSnippets(schema: Schema, tableId: string, texts: SnippetTexts, lang: SampleLang): Snippet[] {
	const table = schema.tables.find((candidate) => candidate.id === tableId);
	if (!table) return [];
	const q = (name: string) => quote('postgres', name);
	const name = q(table.name);
	const tables = new Map(schema.tables.map((candidate) => [candidate.id, candidate]));
	const sources = schema.relations.filter((relation) => relation.fromTable === table.id);
	const targets = schema.relations.filter((relation) => relation.toTable === table.id);
	const linked = new Set(sources.flatMap((relation) => relation.fromColumns));
	const plainColumns = table.columns.filter((column) => !table.primaryKey.includes(column.id) && !linked.has(column.id) && column.type.kind !== 'raw' && column.type.kind !== 'json' && column.type.kind !== 'binary');
	const textColumn = plainColumns.find((column) => isText(column) && NAME_LIKE.test(column.name)) ?? plainColumns.find(isText);
	const groupColumn = plainColumns.find((column) => isText(column) && STATE_LIKE.test(column.name)) ?? plainColumns.find((column) => column.type.kind === 'boolean') ?? plainColumns.find((column) => isText(column) && !isUnique(table, column.id));
	const numberColumn = plainColumns.find(isNumber);
	const dateColumn = plainColumns.find((column) => isTemporal(column) && /(^|_)(created|updated|date|fecha)/i.test(column.name)) ?? plainColumns.find(isTemporal);
	const valueColumn = plainColumns[0] ?? table.columns[0];
	const keys = columnsOf(table, table.primaryKey);
	const sample = (column: Column, n = 1) => sampleValue(schema, table, column, n, lang);
	const rowMatch = (columns: Column[]) => (columns.length > 0 ? columns.map((column) => `${q(column.name)} = ${sample(column)}`).join(' AND ') : 'true');
	const where = rowMatch(keys.length > 0 ? keys : valueColumn ? [valueColumn] : []);
	const out: Snippet[] = [];
	const add = (id: string, group: SnippetGroup, text: string, params: Record<string, string>, sql: string) => {
		const label = fill(text, params);
		out.push({ id, group, label, sql: `${note(label)}\n${sql}` });
	};
	const shown = (owner: Table, alias?: string) =>
		owner.columns
			.slice(0, 3)
			.map((column) => `${q(owner.name)}.${q(column.name)}${alias === undefined ? '' : ` AS ${q(`${alias}_${column.name}`)}`}`)
			.join(', ');

	add('rows', 'view', texts.rows, {}, `SELECT * FROM ${name} LIMIT 10;`);
	add('count', 'view', texts.count, {}, `SELECT count(*) AS total FROM ${name};`);
	if (groupColumn) add('distinct', 'view', texts.distinct, { column: groupColumn.name }, `SELECT DISTINCT ${q(groupColumn.name)} FROM ${name} ORDER BY ${q(groupColumn.name)};`);

	if (valueColumn) add('by-value', 'filter', texts.byValue, { column: valueColumn.name }, `SELECT * FROM ${name} WHERE ${q(valueColumn.name)} = ${sample(valueColumn)};`);
	if (textColumn) add('by-text', 'filter', texts.byText, { column: textColumn.name }, `SELECT * FROM ${name} WHERE ${q(textColumn.name)} ILIKE ${quoted(`%${texts.word}%`)};`);
	if (dateColumn) add('newest', 'filter', texts.newest, { column: dateColumn.name }, `SELECT * FROM ${name} ORDER BY ${q(dateColumn.name)} DESC LIMIT 10;`);

	const joinOn = (relation: Relation, from: Table, to: Table) =>
		columnsOf(from, relation.fromColumns)
			.map((column, i) => `${q(to.name)}.${q(columnsOf(to, relation.toColumns)[i]?.name ?? '')} = ${q(from.name)}.${q(column.name)}`)
			.join(' AND ');
	const seen = new Set<string>();
	for (const relation of sources) {
		const parent = tables.get(relation.toTable);
		if (!parent) continue;
		if (parent.id === table.id) {
			const on = columnsOf(table, relation.fromColumns)
				.map((column, i) => `parent.${q(columnsOf(table, relation.toColumns)[i]?.name ?? '')} = child.${q(column.name)}`)
				.join(' AND ');
			const pick = (alias: string) =>
				table.columns
					.slice(0, 3)
					.map((column) => `${alias}.${q(column.name)} AS ${q(`${alias}_${column.name}`)}`)
					.join(', ');
			add(`join-self-${relation.id}`, 'join', texts.joinSelf, {}, `SELECT ${pick('child')}, ${pick('parent')}\nFROM ${name} AS child\nJOIN ${name} AS parent ON ${on}\nLIMIT 10;`);
			continue;
		}
		if (seen.has(`${parent.id}:${relation.fromColumns.join()}`)) continue;
		seen.add(`${parent.id}:${relation.fromColumns.join()}`);
		add(`join-${relation.id}`, 'join', texts.join, { table: parent.name }, `SELECT ${shown(table)}, ${shown(parent, parent.name)}\nFROM ${name}\nJOIN ${q(parent.name)} ON ${joinOn(relation, table, parent)}\nLIMIT 10;`);
	}
	for (const relation of targets) {
		const child = tables.get(relation.fromTable);
		if (!child || child.id === table.id) continue;
		if (seen.has(`${child.id}:${relation.fromColumns.join()}`)) continue;
		seen.add(`${child.id}:${relation.fromColumns.join()}`);
		add(`join-${relation.id}`, 'join', texts.join, { table: child.name }, `SELECT ${shown(table)}, ${shown(child, child.name)}\nFROM ${name}\nJOIN ${q(child.name)} ON ${joinOn(relation, child, table)}\nLIMIT 10;`);
	}
	const without = new Set<string>();
	for (const relation of targets) {
		const child = tables.get(relation.fromTable);
		const probe = child ? columnsOf(child, relation.fromColumns)[0] : undefined;
		if (!child || !probe || child.id === table.id || without.has(child.id)) continue;
		without.add(child.id);
		add(`without-${relation.id}`, 'join', texts.without, { table: child.name }, `SELECT ${name}.*\nFROM ${name}\nLEFT JOIN ${q(child.name)} ON ${joinOn(relation, child, table)}\nWHERE ${q(child.name)}.${q(probe.name)} IS NULL;`);
	}

	if (groupColumn) add('count-by', 'group', texts.countBy, { column: groupColumn.name }, `SELECT ${q(groupColumn.name)}, count(*) AS total\nFROM ${name}\nGROUP BY ${q(groupColumn.name)}\nORDER BY total DESC;`);
	if (numberColumn) add('sum', 'group', texts.sum, { column: numberColumn.name }, `SELECT sum(${q(numberColumn.name)}) AS total, avg(${q(numberColumn.name)}) AS ${texts.average} FROM ${name};`);

	out.push({ id: 'sample', group: 'change', label: texts.sample, sql: sampleScript(schema, [table.id], texts.sample, texts, lang) });
	out.push({ id: 'sample-all', group: 'change', label: texts.sampleAll, sql: sampleScript(schema, null, texts.sampleAll, texts, lang) });
	const changeable = plainColumns.find((column) => isText(column) || isNumber(column) || column.type.kind === 'boolean' || isTemporal(column));
	if (changeable) {
		const fresh = isText(changeable) ? quoted(texts.newValue.slice(0, changeable.type.kind === 'varchar' || changeable.type.kind === 'char' ? (changeable.type.length ?? 255) : 255)) : isNumber(changeable) ? '99' : changeable.type.kind === 'boolean' ? (sample(changeable) === 'true' ? 'false' : 'true') : "'2026-12-31'";
		add('update', 'change', texts.update, { column: changeable.name }, `UPDATE ${name} SET ${q(changeable.name)} = ${fresh} WHERE ${where};\nSELECT * FROM ${name} WHERE ${where};`);
	}
	if (targets.every((relation) => relation.fromTable === table.id || relation.onDelete === 'CASCADE' || relation.onDelete === 'SET NULL')) {
		add('remove', 'change', texts.remove, {}, `DELETE FROM ${name} WHERE ${where};\nSELECT count(*) AS ${texts.remaining} FROM ${name};`);
	}

	add('columns', 'structure', texts.columns, {}, `SELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = ${quoted(table.name)}\nORDER BY ordinal_position;`);
	add('plan', 'structure', texts.plan, {}, `EXPLAIN SELECT * FROM ${name} WHERE ${where};`);
	return out;
}
