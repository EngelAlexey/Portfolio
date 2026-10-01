import { fill, minutesSentence, minutesUntil, RESCAN_KEY, renderScan } from './report';
import type { Scan, ScannerStrings } from './types';

export type ReportPageStrings = {
	readonly loading: string;
	readonly notFound: string;
	readonly network: string;
	readonly scanned: string;
	readonly expires: string;
	readonly copyLink: string;
	readonly copied: string;
	readonly copiedStatus: string;
	readonly copyError: string;
};

const ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const COPIED_RESET_MS = 2500;

function reportId(): string | undefined {
	const last = location.pathname.split('/').pop() ?? '';
	if (ID_PATTERN.test(last)) {
		return last;
	}
	const query = new URLSearchParams(location.search).get('id') ?? '';
	return ID_PATTERN.test(query) ? query : undefined;
}

function isReport(body: unknown): body is Scan & { readonly createdAt: string; readonly expiresAt: string; readonly rescanAt: string } {
	return typeof body === 'object' && body !== null && 'sections' in body && 'createdAt' in body && 'expiresAt' in body;
}

function format(value: string, options: Intl.DateTimeFormatOptions): string {
	return new Intl.DateTimeFormat(document.documentElement.lang || 'es', options).format(new Date(value));
}

function rememberRescan(host: string): void {
	try {
		sessionStorage.setItem(RESCAN_KEY, host);
	} catch {
		return;
	}
}

export function mountReportPage(root: HTMLElement): void {
	const api = root.dataset['api'] ?? '';
	const base = root.dataset['reportBase'] ?? '';
	const strings = JSON.parse(root.dataset['strings'] ?? '{}') as ScannerStrings;
	const page = JSON.parse(root.dataset['page'] ?? '{}') as ReportPageStrings;
	const status = root.querySelector<HTMLElement>('[data-report-status]');
	const result = root.querySelector<HTMLElement>('[data-scanner-result]');
	const meta = root.querySelector<HTMLElement>('[data-report-meta]');
	const actions = root.querySelector<HTMLElement>('[data-report-actions]');
	const copy = root.querySelector<HTMLButtonElement>('[data-report-copy]');
	const copyLabel = root.querySelector<HTMLElement>('[data-report-copy-label]');
	const live = root.querySelector<HTMLElement>('[data-report-live]');
	const fallback = root.querySelector<HTMLElement>('[data-report-fallback]');
	const fallbackError = root.querySelector<HTMLElement>('[data-report-error]');
	const fallbackUrl = root.querySelector<HTMLInputElement>('[data-report-url]');
	const rescan = root.querySelector<HTMLAnchorElement>('[data-report-rescan]');
	const rescanHint = root.querySelector<HTMLElement>('[data-report-rescan-hint]');
	if (!status || !result || !meta || !actions || !copy || !copyLabel || !live || !fallback || !fallbackError || !fallbackUrl || !rescan || !rescanHint) {
		return;
	}

	const id = reportId();
	const langSwitch = document.querySelector<HTMLAnchorElement>('[data-lang-switch]');
	if (id !== undefined && langSwitch !== null) {
		langSwitch.href = `${langSwitch.getAttribute('href') ?? ''}/${id}`;
	}
	if (id === undefined) {
		status.textContent = page.notFound;
		return;
	}

	const shareUrl = `${location.origin}${base}/${id}`;
	let timer: number | undefined;
	copy.addEventListener('click', async () => {
		window.clearTimeout(timer);
		try {
			await navigator.clipboard.writeText(shareUrl);
			fallback.hidden = true;
			copy.dataset['state'] = 'copied';
			copyLabel.textContent = page.copied;
			live.textContent = page.copiedStatus;
			timer = window.setTimeout(() => {
				delete copy.dataset['state'];
				copyLabel.textContent = page.copyLink;
				live.textContent = '';
			}, COPIED_RESET_MS);
		} catch {
			fallbackError.textContent = page.copyError;
			fallbackUrl.value = shareUrl;
			fallback.hidden = false;
			fallbackUrl.focus();
			fallbackUrl.select();
		}
	});

	status.textContent = page.loading;
	void (async () => {
		try {
			const response = await fetch(`${api}/v1/reports/${encodeURIComponent(id)}`);
			const body: unknown = await response.json().catch(() => null);
			if (!response.ok || !isReport(body)) {
				status.textContent = response.status === 404 ? page.notFound : page.network;
				return;
			}
			status.textContent = '';
			meta.textContent = `${fill(page.scanned, { date: format(body.createdAt, { dateStyle: 'long', timeStyle: 'short' }) })} ${fill(page.expires, { date: format(body.expiresAt, { dateStyle: 'long' }) })}`;
			rescan.addEventListener('click', () => rememberRescan(body.displayHost));
			if (Date.parse(body.rescanAt) > Date.now()) {
				rescanHint.textContent = minutesSentence(minutesUntil(body.rescanAt), strings.rescanInOne, strings.rescanInMany);
				rescanHint.hidden = false;
			}
			actions.hidden = false;
			renderScan(result, body, null, strings);
		} catch {
			status.textContent = page.network;
		}
	})();
}
