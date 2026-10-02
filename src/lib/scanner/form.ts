import { createBotCheck } from './bot-check';
import { fill, minutesSentence, minutesUntil, RESCAN_KEY, renderScan } from './report';
import type { Scan, ScannerStrings } from './types';

export type { ScannerStrings };

type ApiError = { readonly error: string; readonly detail: string | undefined; readonly retryAfter: number | undefined };

const UNREACHABLE_ERRORS = new Set(['timeout', 'connection_failed', 'headers_too_large']);
const REDIRECT_ERRORS = new Set(['too_many_redirects', 'redirect_loop', 'redirect_invalid']);

function isScan(body: unknown): body is Scan {
	return typeof body === 'object' && body !== null && 'sections' in body && 'headers' in body && 'finalUrl' in body;
}

function readError(body: unknown): ApiError {
	if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
		const detail = 'detail' in body && typeof body.detail === 'string' ? body.detail : undefined;
		const retryAfter = 'retryAfter' in body && typeof body.retryAfter === 'number' ? body.retryAfter : undefined;
		return { error: body.error, detail, retryAfter };
	}
	return { error: 'unknown', detail: undefined, retryAfter: undefined };
}

function errorMessage(strings: ScannerStrings, { error, detail, retryAfter }: ApiError): string {
	if (error === 'redirect_offsite') {
		return fill(strings.errors['redirect_offsite'] ?? '', { target: detail ?? '' });
	}
	if (error === 'rate_limited') {
		const minutes = Math.max(1, Math.ceil((retryAfter ?? 3600) / 60));
		const template = minutes === 1 ? strings.errors['rate_limited_one'] : strings.errors['rate_limited'];
		return fill(template ?? '', { minutes: String(minutes) });
	}
	if (UNREACHABLE_ERRORS.has(error)) {
		return strings.errors['unreachable'] ?? '';
	}
	if (REDIRECT_ERRORS.has(error)) {
		return strings.errors['redirect_invalid'] ?? '';
	}
	return strings.errors[error] ?? strings.errors['unknown'] ?? '';
}

function reusedMessage(scan: Scan, strings: ScannerStrings): string {
	const ago = Math.max(1, Math.floor((Date.now() - Date.parse(scan.createdAt ?? '')) / 60_000) || 1);
	const wait = minutesUntil(scan.rescanAt);
	return `${minutesSentence(ago, strings.agoOne, strings.agoMany)} ${minutesSentence(wait, strings.rescanInOne, strings.rescanInMany)}`;
}

function takeRescan(): string | undefined {
	try {
		const host = sessionStorage.getItem(RESCAN_KEY) ?? undefined;
		sessionStorage.removeItem(RESCAN_KEY);
		return host;
	} catch {
		return undefined;
	}
}

export function hostFromInput(value: string): string {
	const trimmed = value.trim();
	try {
		return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).host;
	} catch {
		return trimmed;
	}
}

export function mountScannerForm(form: HTMLFormElement): void {
	const strings = JSON.parse(form.dataset['strings'] ?? '{}') as ScannerStrings;
	const api = form.dataset['api'] ?? '';
	const input = form.querySelector<HTMLInputElement>('input[name="url"]');
	const consent = form.querySelector<HTMLInputElement>('input[name="consent"]');
	const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
	const status = form.querySelector<HTMLElement>('[data-scanner-status]');
	const progress = form.querySelector<HTMLElement>('[data-scanner-progress]');
	const widget = form.querySelector<HTMLElement>('[data-scanner-turnstile]');
	const result = document.querySelector<HTMLElement>('[data-scanner-result]');
	if (!input || !consent || !button || !status || !progress || !widget || !result) {
		return;
	}
	const botCheck = createBotCheck(widget, form.dataset['sitekey'] ?? '');

	const rescan = takeRescan();
	if (rescan !== undefined) {
		input.value = rescan;
		input.focus();
	}

	input.addEventListener('blur', () => {
		input.value = hostFromInput(input.value);
	});

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const host = hostFromInput(input.value);
		input.value = host;
		if (host === '') {
			status.textContent = strings.errors['invalid_url'] ?? '';
			input.focus();
			return;
		}
		if (!consent.checked) {
			status.textContent = strings.errors['consent_required'] ?? '';
			consent.focus();
			return;
		}
		button.disabled = true;
		progress.hidden = false;
		form.setAttribute('aria-busy', 'true');
		result.hidden = true;
		status.textContent = fill(strings.scanning, { host });
		try {
			let token: string;
			try {
				token = await botCheck.token();
			} catch (error) {
				const code = error instanceof Error ? error.message : 'turnstile_failed';
				status.textContent = strings.errors[code] ?? strings.errors['turnstile_failed'] ?? '';
				return;
			}
			const startedAt = performance.now();
			const response = await fetch(`${api}/v1/scans`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ url: host, token })
			});
			const body: unknown = await response.json().catch(() => null);
			if (response.ok && isScan(body)) {
				status.textContent = body.reused === true ? reusedMessage(body, strings) : strings.done;
				renderScan(result, body, body.reused === true ? null : performance.now() - startedAt, strings, { reportLink: true });
			} else {
				status.textContent = errorMessage(strings, readError(body));
			}
		} catch {
			status.textContent = strings.errors['network'] ?? '';
		} finally {
			botCheck.reset();
			button.disabled = false;
			progress.hidden = true;
			form.removeAttribute('aria-busy');
		}
	});
}
