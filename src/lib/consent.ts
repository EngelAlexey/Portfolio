export type Decision = 'granted' | 'denied';

export const CONSENT_KEY = 'consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 730 * 24 * 60 * 60 * 1000;

export function serializeDecision(decision: Decision, now: number): string {
	return JSON.stringify({ analytics: decision, at: now, v: CONSENT_VERSION });
}

export function parseDecision(raw: string | null, now: number): Decision | null {
	if (raw === null) return null;
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== 'object' || value === null) return null;
		const { analytics, at, v } = value as { analytics?: unknown; at?: unknown; v?: unknown };
		if (analytics !== 'granted' && analytics !== 'denied') return null;
		if (v !== CONSENT_VERSION) return null;
		if (typeof at !== 'number' || !Number.isFinite(at) || at > now) return null;
		if (now - at > CONSENT_MAX_AGE_MS) return null;
		return analytics;
	} catch {
		return null;
	}
}

export function analyticsCookieNames(cookieHeader: string): string[] {
	return cookieHeader
		.split(';')
		.map((part) => part.split('=')[0]?.trim() ?? '')
		.filter((name) => name === '_ga' || name.startsWith('_ga_'));
}

export function cookieDomains(hostname: string): string[] {
	const parts = hostname.split('.');
	const domains: string[] = [];
	for (let i = 0; i < Math.max(parts.length - 1, 1); i++) domains.push(parts.slice(i).join('.'));
	return domains;
}

export function expiredCookie(name: string, domain: string | null): string {
	const scope = domain === null ? '' : `; domain=${domain}`;
	return `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/${scope}`;
}
