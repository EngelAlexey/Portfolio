const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const MAX_CODE_POINT = 0x10ffff;
const MAX_LABEL = 256;
const MAX_INT = 0x7fffffff;

function digit(code: number): number {
	if (code >= 48 && code <= 57) return code - 22;
	if (code >= 65 && code <= 90) return code - 65;
	if (code >= 97 && code <= 122) return code - 97;
	return BASE;
}

function adapt(delta: number, points: number, first: boolean): number {
	let d = first ? Math.floor(delta / DAMP) : delta >> 1;
	d += Math.floor(d / points);
	let k = 0;
	while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
		d = Math.floor(d / (BASE - T_MIN));
		k += BASE;
	}
	return k + Math.floor(((BASE - T_MIN + 1) * d) / (d + SKEW));
}

export function decodePunycode(input: string): string | null {
	if (input.length > MAX_LABEL) return null;
	const output: number[] = [];
	let basic = input.lastIndexOf('-');
	if (basic < 0) basic = 0;
	for (let j = 0; j < basic; j++) {
		const code = input.charCodeAt(j);
		if (code >= 0x80) return null;
		output.push(code);
	}
	let n = INITIAL_N;
	let i = 0;
	let bias = INITIAL_BIAS;
	let index = basic > 0 ? basic + 1 : 0;
	while (index < input.length) {
		const previous = i;
		let weight = 1;
		for (let k = BASE; ; k += BASE) {
			if (index >= input.length) return null;
			const d = digit(input.charCodeAt(index++));
			if (d >= BASE) return null;
			i += d * weight;
			if (i > MAX_INT) return null;
			const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
			if (d < t) break;
			weight *= BASE - t;
			if (weight > MAX_INT) return null;
		}
		const length = output.length + 1;
		bias = adapt(i - previous, length, previous === 0);
		n += Math.floor(i / length);
		if (n > MAX_CODE_POINT) return null;
		i %= length;
		output.splice(i++, 0, n);
	}
	try {
		return String.fromCodePoint(...output);
	} catch {
		return null;
	}
}

export function toUnicodeHost(host: string): string {
	return host
		.split('.')
		.map((label) => (label.toLowerCase().startsWith('xn--') ? (decodePunycode(label.slice(4)) ?? label) : label))
		.join('.');
}
