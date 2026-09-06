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
