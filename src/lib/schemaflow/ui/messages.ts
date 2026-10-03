import type { schemaflowEs } from '../../i18n/schemaflow-es';
import { DIALECT_LABELS } from '../dialects';
import type { DialectId } from '../model/types';
import type { CodeIssue } from '../parse/issues';
import type { DesignIssue } from '../validate/rules';

export type Catalog = typeof schemaflowEs;

const SPECIAL: Record<string, keyof Catalog['expected']> = { name: 'name', type: 'type', expression: 'expression', number: 'number', text: 'text', '…': 'more' };

export function fill(template: string, params: Record<string, string | number> = {}): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));
}

export function quoted(lang: 'es' | 'en', value: string): string {
	return lang === 'es' ? `«${value}»` : `"${value}"`;
}

function list(catalog: Catalog, lang: 'es' | 'en', raw: string): string {
	const items = raw
		.split('|')
		.filter(Boolean)
		.map((item) => {
			const special = SPECIAL[item];
			return special ? catalog.expected[special] : quoted(lang, item);
		});
	if (items.length <= 1) return items[0] ?? '';
	return `${items.slice(0, -1).join(', ')} ${catalog.expected.or} ${items[items.length - 1]}`;
}

export function codeMessage(catalog: Catalog, lang: 'es' | 'en', dialect: DialectId, item: CodeIssue): string {
	const template = (catalog.codes as Record<string, string>)[item.code] ?? item.code;
	const params: Record<string, string | number> = { dialect: DIALECT_LABELS[dialect], ...item.params };
	if (item.code === 'syntax') {
		params.expected = list(catalog, lang, String(item.params?.expected ?? ''));
		const found = String(item.params?.found ?? '');
		params.found = found ? quoted(lang, found) : catalog.expected.end;
	}
	return fill(template, params);
}

export function ruleMessage(catalog: Catalog, dialect: DialectId, item: DesignIssue): { title: string; body: string; fix?: string } {
	const entry = catalog.rules[item.rule] as { title: string; body: string; bodyMongo?: string; bodyWarning?: string; bodyMysql?: string; fix?: string };
	const params: Record<string, string | number> = { dialect: DIALECT_LABELS[dialect], ...item.params };
	if (typeof params.source === 'string' && params.source in DIALECT_LABELS) params.source = DIALECT_LABELS[params.source as DialectId];
	if (typeof params.dialects === 'string') params.dialects = params.dialects.split(', ').map((d) => DIALECT_LABELS[d as DialectId] ?? d).join(', ');
	let body = entry.body;
	if (dialect === 'mongodb' && entry.bodyMongo) body = entry.bodyMongo;
	if (item.severity === 'warning' && entry.bodyWarning) body = entry.bodyWarning;
	if (dialect === 'mysql' && entry.bodyMysql && !(item.rule === 'key-lob' && item.severity === 'error')) body = entry.bodyMysql;
	const result: { title: string; body: string; fix?: string } = { title: fill(entry.title, params), body: fill(body, params) };
	if (entry.fix && item.fix) result.fix = fill(entry.fix, params);
	return result;
}
