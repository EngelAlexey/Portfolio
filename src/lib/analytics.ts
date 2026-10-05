import { analyticsCookieNames, cookieDomains, expiredCookie } from './consent';

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

const SCRIPT_ID = 'ga-script';

function setDisabled(id: string, disabled: boolean): void {
	(window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = disabled;
}

export function loadAnalytics(id: string): void {
	if (document.getElementById(SCRIPT_ID)) {
		setDisabled(id, false);
		return;
	}
	setDisabled(id, false);
	window.dataLayer = window.dataLayer ?? [];
	window.gtag = function () {
		window.dataLayer?.push(arguments);
	};
	window.gtag('js', new Date());
	window.gtag('config', id, { allow_google_signals: false, allow_ad_personalization_signals: false });
	const script = document.createElement('script');
	script.id = SCRIPT_ID;
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
	document.head.append(script);
}

export function stopAnalytics(id: string | null): void {
	if (id !== null) setDisabled(id, true);
	for (const name of analyticsCookieNames(document.cookie)) {
		document.cookie = expiredCookie(name, null);
		for (const domain of cookieDomains(location.hostname)) document.cookie = expiredCookie(name, domain);
	}
}
