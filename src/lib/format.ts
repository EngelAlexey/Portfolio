type Period = { start: string; end: string | null };

/**
 * `year` for cards and the org rail, `month` for the project page, which has
 * room for it. Written once because three call sites drifted: the same project
 * read "2025 — 2026" on its card and "2025-09 — 2026-07" on its page, and an
 * ongoing one mixed the two on the same line.
 */
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
