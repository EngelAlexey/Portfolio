import { LIMITS } from '../limits';

export type HeaderField = { readonly name: string; readonly value: string };

export function parseHeaders(raw: string): HeaderField[] {
	const text = raw.slice(0, LIMITS.headerChars);
	const end = text.search(/\r?\n[ \t]*\r?\n/);
	const block = end < 0 ? text : text.slice(0, end);
	const fields: { name: string; value: string }[] = [];
	for (const line of block.split(/\r?\n/)) {
		if (/^[ \t]/.test(line)) {
			const last = fields.at(-1);
			if (last !== undefined) last.value = `${last.value} ${line.trim()}`;
			continue;
		}
		const match = /^([!-9;-~]+):[ \t]*(.*)$/.exec(line);
		if (match === null) continue;
		fields.push({ name: (match[1] ?? '').toLowerCase(), value: match[2] ?? '' });
		if (fields.length >= LIMITS.headerFields) break;
	}
	return fields;
}

export type Authentication = {
	readonly spf: string | null;
	readonly dkim: string | null;
	readonly dmarc: string | null;
};

export function parseAuthentication(value: string): Authentication {
	const plain = value.replace(/\([^)]*\)/g, ' ').toLowerCase();
	const read = (mechanism: string): string | null => {
		const match = new RegExp(`\\b${mechanism}\\s*=\\s*([a-z]+)`).exec(plain);
		return match?.[1] ?? null;
	};
	return { spf: read('spf'), dkim: read('dkim'), dmarc: read('dmarc') };
}

export function dkimDomains(fields: readonly HeaderField[]): string[] {
	const out: string[] = [];
	for (const field of fields) {
		if (field.name !== 'dkim-signature') continue;
		const match = /(?:^|[;\s])d=([^;\s]+)/i.exec(field.value);
		if (match?.[1] !== undefined) out.push(match[1].toLowerCase());
	}
	return out;
}

export function receivedTimes(fields: readonly HeaderField[]): number[] {
	const times: number[] = [];
	for (const field of fields) {
		if (field.name !== 'received') continue;
		const stamp = field.value.slice(field.value.lastIndexOf(';') + 1).trim();
		const time = Date.parse(stamp);
		if (Number.isFinite(time)) times.push(time);
	}
	return times;
}
