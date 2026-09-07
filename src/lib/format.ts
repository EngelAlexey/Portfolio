import type { Lang } from './i18n';

type Period = { start: string; end: string | null };

export function formatPeriod(
	period: Period,
	present: string,
	precision: 'year' | 'month' = 'month'
): string {
	const cut = (value: string) => (precision === 'year' ? value.slice(0, 4) : value);

	const start = cut(period.start);
	if (period.end === null) return `${start} — ${present}`;

	const end = cut(period.end);
	return start === end ? start : `${start} — ${end}`;
}

const LOCALE: Record<Lang, string> = { es: 'es-CR', en: 'en-US' };

const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

// La fecha se construye en UTC a proposito: `new Date('2026-09-14')` ya es
// medianoche UTC, y formatearla en la zona local la retrasaria un dia en America.
export function formatDate(iso: string, lang: Lang): string {
	let formatter = FORMATTERS.get(lang);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(LOCALE[lang], {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone: 'UTC'
		});
		FORMATTERS.set(lang, formatter);
	}
	return formatter.format(new Date(`${iso}T00:00:00Z`));
}
