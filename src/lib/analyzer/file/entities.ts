export function unescapeXml(value: string): string {
	return value
		.replace(/&#(x[0-9a-f]+|\d+);/gi, (whole, code: string) => {
			const point = code.startsWith('x') || code.startsWith('X') ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10);
			return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : whole;
		})
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}
