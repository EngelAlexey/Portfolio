export function defang(raw: string): string {
	const match = /^([a-z][a-z0-9+.-]*):(\/\/)?(.*)$/is.exec(raw);
	if (match === null) return raw.replace(/\./g, '[.]');
	const scheme = match[1] ?? '';
	const rest = match[3] ?? '';
	if (match[2] === undefined) return `${scheme}[:]${rest}`;
	const end = rest.search(/[/?#]/);
	const authority = end < 0 ? rest : rest.slice(0, end);
	const tail = end < 0 ? '' : rest.slice(end);
	const shown = /^http/i.test(scheme) ? scheme.replace(/^http/i, 'hxxp') : scheme;
	return `${shown}://${authority.replace(/\./g, '[.]').replace(/@/g, '[@]')}${tail}`;
}
