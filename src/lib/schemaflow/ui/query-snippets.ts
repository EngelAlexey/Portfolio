import { clipIdentifier, quote } from '../dialects/names';
import { isUnique } from '../model/ops';
import type { Column, Relation, Schema, Table } from '../model/types';
import { checkedColumns, sampledColumns, sampleSql, sampleValue, type SampleLang } from './sample-rows';
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
	const names = new Map(schema.tables.map((table) => [table.id, table.name]));
	const skipped = Object.entries(result.reasons).map(([id, reason]) => note(fill(texts.skipped, { table: names.get(id) ?? '', reason: texts.skipReasons[reason] })));
	return [note(label), ...skipped, result.sql].join('\n');
}

function nullable(table: Table | undefined, ids: readonly string[]): boolean {
	return ids.every((id) => table?.columns.find((column) => column.id === id)?.nullable === true && !table.primaryKey.includes(id));
}

function survivesChange(schema: Schema, tableId: string, ids: readonly string[], seen: Set<string>): boolean {
	const mark = `${tableId}:${[...ids].sort().join()}`;
	if (seen.has(mark)) return true;
	seen.add(mark);
	const tables = new Map(schema.tables.map((candidate) => [candidate.id, candidate]));
	for (const relation of schema.relations) {
		if (relation.toTable !== tableId || !relation.toColumns.some((id) => ids.includes(id))) continue;
		if (relation.onUpdate !== 'CASCADE' && relation.onUpdate !== 'SET NULL') return false;
		if (!nullable(tables.get(relation.fromTable), relation.fromColumns)) return false;
		if (!survivesChange(schema, relation.fromTable, relation.fromColumns, seen)) return false;
	}
	return true;
}

function removable(schema: Schema, tableId: string, seen = new Set<string>()): boolean {
	if (seen.has(tableId)) return true;
	seen.add(tableId);
	const tables = new Map(schema.tables.map((candidate) => [candidate.id, candidate]));
	for (const relation of schema.relations) {
		if (relation.toTable !== tableId) continue;
		if (relation.onDelete === 'CASCADE') {
			if (!removable(schema, relation.fromTable, seen)) return false;
		} else if (relation.onDelete === 'SET NULL') {
			if (!nullable(tables.get(relation.fromTable), relation.fromColumns)) return false;
			if (!survivesChange(schema, relation.fromTable, relation.fromColumns, new Set())) return false;
		} else return false;
	}
	return true;
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
	const targeted = new Set(targets.flatMap((relation) => relation.toColumns));
	const unique = new Set([...table.primaryKey, ...table.uniques.flatMap((constraint) => constraint.columns), ...table.indexes.filter((index) => index.unique).flatMap((index) => index.columns)]);
	const plainColumns = table.columns.filter((column) => !table.primaryKey.includes(column.id) && !linked.has(column.id) && column.type.kind !== 'raw' && column.type.kind !== 'json' && column.type.kind !== 'binary');
	const filled = new Set((sampledColumns(schema, table, lang) ?? []).map((column) => column.id));
	const checked = checkedColumns(schema, table, lang);
	const sampled = plainColumns.filter((column) => filled.has(column.id));
	const textColumn = sampled.find((column) => isText(column) && NAME_LIKE.test(column.name)) ?? sampled.find(isText);
	const groupColumn = plainColumns.find((column) => isText(column) && STATE_LIKE.test(column.name)) ?? plainColumns.find((column) => column.type.kind === 'boolean') ?? plainColumns.find((column) => isText(column) && !isUnique(table, column.id));
	const numberColumn = plainColumns.find(isNumber);
	const dateColumn = plainColumns.find((column) => isTemporal(column) && /(^|_)(created|updated|date|fecha)/i.test(column.name)) ?? plainColumns.find(isTemporal);
	const keys = columnsOf(table, table.primaryKey);
	const valueColumn = sampled[0] ?? keys[0];
	const sample = (column: Column, n = 1) => sampleValue(schema, table, column, n, lang);
	const rowMatch = (columns: Column[]) => (columns.length > 0 ? columns.map((column) => `${q(column.name)} = ${sample(column)}`).join(' AND ') : 'true');
	const matching = keys.length > 0 ? keys : valueColumn ? [valueColumn] : [];
	const where = rowMatch(matching);
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
	const changeable = plainColumns.find((column) => !unique.has(column.id) && !targeted.has(column.id) && !checked.has(column.id) && !matching.includes(column) && column.default.kind !== 'computed' && column.default.kind !== 'autoincrement' && (isText(column) || isNumber(column) || column.type.kind === 'boolean' || isTemporal(column)));
	if (changeable) add('update', 'change', texts.update, { column: changeable.name }, `UPDATE ${name} SET ${q(changeable.name)} = ${sample(changeable, 2)} WHERE ${where};\nSELECT * FROM ${name} WHERE ${where};`);
	if (removable(schema, table.id)) {
		add('remove', 'change', texts.remove, {}, `DELETE FROM ${name} WHERE ${where};\nSELECT count(*) AS ${texts.remaining} FROM ${name};`);
	}

	add('columns', 'structure', texts.columns, {}, `SELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = ${quoted(clipIdentifier('postgres', table.name))}\nORDER BY ordinal_position;`);
	add('plan', 'structure', texts.plan, {}, `EXPLAIN SELECT * FROM ${name} WHERE ${where};`);
	return out;
}
