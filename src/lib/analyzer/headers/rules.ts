import { finding } from '../codes';
import { parseSender } from '../sender/rules';
import type { Finding } from '../types';
import { splitHost } from '../url/registrable';
import { dkimDomains, parseAuthentication, parseHeaders, receivedTimes } from './parse';

const FAILED = new Set(['fail', 'softfail', 'permerror', 'temperror']);
const FIVE_MINUTES = 5 * 60_000;
const TWELVE_HOURS = 12 * 3_600_000;
const TWO_DAYS = 2 * 24 * 3_600_000;

const registrableOf = (domain: string): string => splitHost(domain).registrable;

export function analyzeHeaders(raw: string): Finding[] {
	const fields = parseHeaders(raw);
	if (fields.length === 0) return [];

	const out: Finding[] = [];
	const first = (name: string): string | undefined => fields.find((field) => field.name === name)?.value;

	const from = parseSender(first('from') ?? '');
	const returnPath = parseSender(first('return-path') ?? '');
	const replyTo = parseSender(first('reply-to') ?? '');

	const results = fields.filter((field) => field.name === 'authentication-results');
	const top = results[0];
	const auth = top === undefined ? null : parseAuthentication(top.value);

	if (results.length === 0) out.push(finding('hdr-auth-missing'));
	if (results.length > 1) out.push(finding('hdr-auth-untrusted', { count: String(results.length) }));

	if (auth !== null) {
		for (const mechanism of ['spf', 'dkim', 'dmarc'] as const) {
			const result = auth[mechanism];
			if (result !== null && FAILED.has(result)) out.push(finding('hdr-auth-fail', { mechanism, result }));
		}
	}

	const dmarcPass = auth?.dmarc === 'pass';

	if (from.domain !== null) {
		const fromDomain = registrableOf(from.domain);

		const signed = dkimDomains(fields);
		if (signed.length > 0 && !dmarcPass && !signed.some((domain) => registrableOf(domain) === fromDomain)) {
			out.push(finding('hdr-dkim-misaligned', { from: from.domain, dkim: signed.join(', ') }));
		}

		if (returnPath.domain !== null && !dmarcPass && registrableOf(returnPath.domain) !== fromDomain) {
			out.push(finding('hdr-from-return-path-mismatch', { from: from.domain, returnPath: returnPath.domain }));
		}

		if (replyTo.domain !== null && registrableOf(replyTo.domain) !== fromDomain) {
			out.push(finding('hdr-reply-to-mismatch', { from: from.domain, replyTo: replyTo.domain }));
		}
	}

	const times = receivedTimes(fields).reverse();
	for (let i = 1; i < times.length; i++) {
		const delta = (times[i] ?? 0) - (times[i - 1] ?? 0);
		if (delta < -FIVE_MINUTES) {
			out.push(finding('hdr-received-anomaly', { kind: 'order', hop: String(i + 1) }));
			break;
		}
		if (delta > TWELVE_HOURS) {
			out.push(finding('hdr-received-anomaly', { kind: 'delay', hop: String(i + 1), hours: String(Math.round(delta / 3_600_000)) }));
			break;
		}
	}

	const sent = Date.parse(first('date') ?? '');
	const oldest = times[0];
	if (Number.isFinite(sent) && oldest !== undefined && Math.abs(sent - oldest) > TWO_DAYS) {
		out.push(finding('hdr-received-anomaly', { kind: 'date', days: String(Math.round(Math.abs(sent - oldest) / 86_400_000)) }));
	}

	return out;
}
