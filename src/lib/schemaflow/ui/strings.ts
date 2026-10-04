import type { schemaflowUiEs } from '../../i18n/schemaflow-ui-es';
import { fill, type Catalog } from './messages';

export type Strings = typeof schemaflowUiEs & { engine: Catalog };
export type Plural = { one: string; other: string };

export { fill };

export function fold(text: string): string {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function plural(entry: Plural, n: number, params: Record<string, string | number> = {}): string {
	return fill(n === 1 ? entry.one : entry.other, { n, ...params });
}

export function joinList(items: string[], and: string): string {
	if (items.length <= 1) return items[0] ?? '';
	return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

export function summarize(strings: Strings, counts: { error: number; warning: number; info: number }): string {
	const parts: string[] = [];
	if (counts.error) parts.push(plural(strings.count.errors, counts.error));
	if (counts.warning) parts.push(plural(strings.count.warnings, counts.warning));
	if (counts.info) parts.push(plural(strings.count.suggestions, counts.info));
	const text = joinList(parts, strings.count.and);
	return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
