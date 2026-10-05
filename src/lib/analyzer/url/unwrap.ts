export type Unwrapped = { readonly wrapper: string; readonly destination: string };

function httpUrl(value: string | null | undefined): string | null {
	if (value === null || value === undefined || value === '') return null;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
	} catch {
		return null;
	}
}

function decoded(value: string): string | null {
	try {
		return decodeURIComponent(value);
	} catch {
		return null;
	}
}

function result(wrapper: string, destination: string | null): Unwrapped | null {
	return destination === null ? null : { wrapper, destination };
}

export function unwrap(url: URL): Unwrapped | null {
	const host = url.hostname.toLowerCase();
	const path = url.pathname;
	const params = url.searchParams;

	if (host === 'safelinks.protection.outlook.com' || host.endsWith('.safelinks.protection.outlook.com')) {
		return result('Microsoft Defender SafeLinks', httpUrl(params.get('url')));
	}

	if (host === 'urldefense.proofpoint.com') {
		if (path.startsWith('/v2/')) {
			const value = params.get('u');
			const text = value === null ? null : decoded(value.replace(/_/g, '/').replace(/-/g, '%'));
			return result('Proofpoint URL Defense', httpUrl(text));
		}
		if (path.startsWith('/v1/')) return result('Proofpoint URL Defense', httpUrl(params.get('u')));
	}

	if (host === 'urldefense.com' && path.startsWith('/v3/')) {
		const match = /\/v3\/__(.+?)__;/.exec(url.href);
		return result('Proofpoint URL Defense', httpUrl(match?.[1]));
	}

	if ((host === 'www.google.com' || host === 'google.com') && path === '/url') {
		return result('Google', httpUrl(params.get('q') ?? params.get('url')));
	}

	if ((host === 'l.facebook.com' || host === 'lm.facebook.com') && path === '/l.php') {
		return result('Facebook', httpUrl(params.get('u')));
	}

	if (host === 'linkprotect.cudasvc.com' && path === '/url') {
		return result('Barracuda', httpUrl(params.get('a')));
	}

	if ((host === 'www.linkedin.com' || host === 'linkedin.com') && path === '/redir/redirect') {
		return result('LinkedIn', httpUrl(params.get('url')));
	}

	return null;
}
