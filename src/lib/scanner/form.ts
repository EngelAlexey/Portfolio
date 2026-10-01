import codes from './codes.json';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type CheckState = 'pass' | Severity;
type LineState = CheckState | 'neutral';

export type ScannerStrings = {
	readonly scanning: string;
	readonly done: string;
	readonly errors: Readonly<Record<string, string>>;
	readonly resultTitle: string;
	readonly copy: string;
	readonly copied: string;
	readonly copiedStatus: string;
	readonly copyError: string;
	readonly summaryOne: string;
	readonly summaryMany: string;
	readonly facts: {
		readonly status: string;
		readonly https: string;
		readonly redirectsOne: string;
		readonly redirectsMany: string;
		readonly headers: string;
		readonly time: string;
	};
	readonly redirects: string;
	readonly headersTitle: string;
	readonly lineOk: string;
	readonly missing: string;
	readonly notSent: string;
	readonly currentValue: string;
	readonly guide: string;
	readonly guides: Readonly<Record<string, string>>;
	readonly headerHints: Readonly<Record<string, string>>;
	readonly findingsTitle: string;
	readonly noFindings: string;
	readonly blocked: string;
	readonly passedTitle: string;
	readonly severity: Readonly<Record<Severity, string>>;
	readonly findings: Readonly<Record<string, string>>;
	readonly passed: Readonly<Record<string, string>>;
};

type Finding = { readonly code: string; readonly evidence?: Readonly<Record<string, unknown>> };
type Section = {
	readonly status: string;
	readonly findings: readonly Finding[];
	readonly passed: readonly string[];
	readonly notes: readonly string[];
};
type ApiError = { readonly error: string; readonly detail: string | undefined; readonly retryAfter: number | undefined };
type TurnstileApi = {
	render(container: HTMLElement, options: Readonly<Record<string, unknown>>): string | undefined;
	execute(widget: string): void;
	reset(widget: string): void;
};
type BotCheck = { token(): Promise<string>; reset(): void };

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}
type Hop = { readonly url: string; readonly status: number; readonly location: string };
type Scan = {
	readonly host: string;
	readonly displayHost: string;
	readonly finalUrl: string;
	readonly status: number;
	readonly hops: readonly Hop[];
	readonly headers: Readonly<Record<string, readonly string[]>>;
	readonly sections: Readonly<Record<string, Section>>;
};
type FindingSpec = { readonly severity: Severity; readonly check: string };
type HeaderLine = { readonly name: string; readonly state: LineState; readonly value: string; readonly label: string | undefined };

const HEADER_CHECKS: Readonly<Record<string, string | null>> = {
	'strict-transport-security': 'hsts',
	'content-security-policy': 'csp',
	'content-security-policy-report-only': null,
	'x-frame-options': 'framing',
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'referrer-policy',
	'permissions-policy': 'permissions-policy',
	'server': 'version',
	'x-powered-by': 'version'
};

const CHECK_HEADERS: Readonly<Record<string, string>> = {
	'hsts': 'strict-transport-security',
	'csp': 'content-security-policy',
	'framing': 'x-frame-options',
	'nosniff': 'x-content-type-options',
	'referrer-policy': 'referrer-policy',
	'permissions-policy': 'permissions-policy',
	'version': 'server'
};

const LINE_MARKS: Readonly<Record<LineState, string>> = {
	pass: '✓',
	neutral: '·',
	critical: '●',
	high: '●',
	medium: '●',
	low: '●',
	info: '●'
};

const SEVERITY_ORDER: readonly Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
const UNREACHABLE_ERRORS = new Set(['timeout', 'connection_failed', 'headers_too_large']);
const REDIRECT_ERRORS = new Set(['too_many_redirects', 'redirect_loop', 'redirect_invalid']);
const FINDING_SPECS = codes.findings as Readonly<Record<string, FindingSpec | undefined>>;
const CHECK_ORDER = Object.keys(codes.passed);
const SHOWN_HEADERS = Object.keys(HEADER_CHECKS);
const COPIED_RESET_MS = 2500;
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_ACTION = 'scan';

let turnstileLoad: Promise<TurnstileApi> | undefined;

function severityOf(code: string): Severity {
	return FINDING_SPECS[code]?.severity ?? 'info';
}

function rank(severity: Severity): number {
	return SEVERITY_ORDER.indexOf(severity);
}

function fill(template: string, values: Readonly<Record<string, string>>): string {
	return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder);
}

function create<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (text !== undefined) {
		node.textContent = text;
	}
	if (className !== undefined) {
		node.className = className;
	}
	return node;
}

function describeEvidence(evidence: Readonly<Record<string, unknown>> | undefined): string {
	if (evidence === undefined) {
		return '';
	}
	return Object.values(evidence)
		.map((value) => (Array.isArray(value) ? value.join(', ') : String(value)))
		.join(' | ');
}

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

export function hostFromInput(value: string): string {
	const trimmed = value.trim();
	try {
		return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).host;
	} catch {
		return trimmed;
	}
}

function formatSeconds(milliseconds: number): string {
	const lang = document.documentElement.lang || 'es';
	return new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(milliseconds / 1000);
}

function allFindings(scan: Scan): Finding[] {
	return Object.values(scan.sections)
		.flatMap((section) => section.findings)
		.toSorted((a, b) => rank(severityOf(a.code)) - rank(severityOf(b.code)));
}

function checkStates(scan: Scan, findings: readonly Finding[]): Map<string, CheckState> {
	const states = new Map<string, CheckState>();
	for (const section of Object.values(scan.sections)) {
		for (const check of section.passed) {
			states.set(check, 'pass');
		}
	}
	for (const finding of findings) {
		const spec = FINDING_SPECS[finding.code];
		if (spec === undefined) {
			continue;
		}
		const current = states.get(spec.check);
		if (current === undefined || current === 'pass' || rank(spec.severity) < rank(current)) {
			states.set(spec.check, spec.severity);
		}
	}
	return new Map([...states].sort(([a], [b]) => CHECK_ORDER.indexOf(a) - CHECK_ORDER.indexOf(b)));
}

function evidenceHeaders(finding: Finding): string[] {
	return Object.values(finding.evidence ?? {})
		.flat()
		.map((value) => String(value).toLowerCase().split(':')[0] ?? '')
		.filter((name) => name in HEADER_CHECKS);
}

function lineState(name: string, present: boolean, states: Map<string, CheckState>, findings: readonly Finding[]): LineState {
	const check = HEADER_CHECKS[name];
	const state = check ? states.get(check) : undefined;
	if (state === undefined) {
		return 'neutral';
	}
	if (check === 'version') {
		const flagged = findings.some((finding) => finding.code === 'version-disclosure' && evidenceHeaders(finding).includes(name));
		return flagged && state !== 'pass' ? state : 'pass';
	}
	if (state === 'pass') {
		return present ? 'pass' : 'neutral';
	}
	return state;
}

function headerLines(scan: Scan, states: Map<string, CheckState>, findings: readonly Finding[], strings: ScannerStrings): HeaderLine[] {
	return SHOWN_HEADERS.map((name) => {
		const values = scan.headers[name];
		const state = lineState(name, values !== undefined, states, findings);
		const value =
			values === undefined ? (state === 'pass' || state === 'neutral' ? strings.notSent : strings.missing) : values.join(' | ');
		const label = state === 'pass' ? strings.lineOk : state === 'neutral' ? undefined : strings.severity[state];
		return { name, state, value, label };
	});
}

function headerOf(finding: Finding): string | undefined {
	const check = FINDING_SPECS[finding.code]?.check;
	if (check === 'version') {
		return evidenceHeaders(finding)[0] ?? CHECK_HEADERS[check];
	}
	return check === undefined ? undefined : CHECK_HEADERS[check];
}

function extraDetail(finding: Finding, header: string | undefined, current: string | undefined): string {
	const detail = describeEvidence(finding.evidence);
	if (detail === '' || (current ?? '').toLowerCase().includes(detail.toLowerCase()) || detail.toLowerCase().startsWith(`${header ?? ''}:`)) {
		return '';
	}
	return detail;
}

function factLabels(scan: Scan, elapsedMs: number, strings: ScannerStrings): string[] {
	const labels = [fill(strings.facts.status, { code: String(scan.status) })];
	if (scan.finalUrl.startsWith('https:')) {
		labels.push(strings.facts.https);
	}
	if (scan.hops.length > 0) {
		const template = scan.hops.length === 1 ? strings.facts.redirectsOne : strings.facts.redirectsMany;
		labels.push(fill(template, { count: String(scan.hops.length) }));
	}
	const sent = SHOWN_HEADERS.filter((name) => scan.headers[name] !== undefined).length;
	labels.push(fill(strings.facts.headers, { sent: String(sent), total: String(SHOWN_HEADERS.length) }));
	labels.push(fill(strings.facts.time, { seconds: formatSeconds(elapsedMs) }));
	return labels;
}

function tally(states: Map<string, CheckState>, strings: ScannerStrings): string {
	const total = states.size;
	const passed = [...states.values()].filter((state) => state === 'pass').length;
	return fill(total === 1 ? strings.summaryOne : strings.summaryMany, { passed: String(passed), total: String(total) });
}

function passedMessages(scan: Scan, strings: ScannerStrings): string[] {
	return Object.values(scan.sections).flatMap((section) => section.passed.map((check) => strings.passed[check] ?? check));
}

function isBlocked(scan: Scan): boolean {
	return Object.values(scan.sections).some((section) => section.status === 'blocked');
}

function resultText(
	scan: Scan,
	states: Map<string, CheckState>,
	findings: readonly Finding[],
	elapsedMs: number,
	strings: ScannerStrings
): string {
	const blocked = isBlocked(scan);
	const lines = [
		fill(strings.resultTitle, { host: scan.displayHost }),
		blocked ? strings.blocked : tally(states, strings),
		factLabels(scan, elapsedMs, strings).join(' | ')
	];
	if (!blocked) {
		lines.push('', `${strings.findingsTitle} (${findings.length})`);
	}
	if (!blocked && findings.length === 0) {
		lines.push(strings.noFindings);
	}
	for (const finding of findings) {
		const header = headerOf(finding);
		const current = header === undefined ? undefined : scan.headers[header]?.join(' | ');
		lines.push(`- [${strings.severity[severityOf(finding.code)]}] ${strings.findings[finding.code] ?? finding.code}`);
		if (header !== undefined) {
			lines.push(`  ${header}: ${current ?? strings.missing}`);
		}
		const detail = extraDetail(finding, header, current);
		if (detail !== '') {
			lines.push(`  ${detail}`);
		}
		const guide = strings.guides[finding.code];
		if (guide !== undefined) {
			lines.push(`  ${new URL(guide, window.location.origin).href}`);
		}
	}
	lines.push('', strings.headersTitle, `GET https://${scan.host}/`);
	for (const hop of scan.hops) {
		lines.push(`  ${hop.status} → ${hop.location}`);
	}
	lines.push(`HTTP/1.1 ${scan.status} ${scan.finalUrl}`);
	for (const line of headerLines(scan, states, findings, strings)) {
		lines.push(`${LINE_MARKS[line.state]} ${line.name}: ${line.value}${line.label === undefined ? '' : ` (${line.label})`}`);
	}
	const passed = passedMessages(scan, strings);
	if (passed.length > 0) {
		lines.push('', `${strings.passedTitle} (${passed.length})`, ...passed.map((message) => `- ${message}`));
	}
	return `${lines.join('\n')}\n`;
}

function renderSummary(
	scan: Scan,
	states: Map<string, CheckState>,
	findings: readonly Finding[],
	elapsedMs: number,
	strings: ScannerStrings
): HTMLElement {
	const summary = create('div', undefined, 'summary');
	const title = create('h2', fill(strings.resultTitle, { host: scan.displayHost }));
	title.tabIndex = -1;

	const meter = create('ol', undefined, 'meter');
	meter.setAttribute('aria-hidden', 'true');
	let index = 0;
	for (const [check, state] of states) {
		const segment = create('li');
		segment.dataset['state'] = state;
		segment.style.setProperty('--i', String(index++));
		const worst = findings.find((finding) => FINDING_SPECS[finding.code]?.check === check);
		segment.title = state === 'pass' ? (strings.passed[check] ?? check) : (strings.findings[worst?.code ?? ''] ?? check);
		meter.append(segment);
	}

	const facts = create('ul', undefined, 'facts');
	for (const label of factLabels(scan, elapsedMs, strings)) {
		facts.append(create('li', label));
	}

	if (isBlocked(scan)) {
		summary.append(title, create('p', strings.blocked, 'notice'), facts);
	} else {
		summary.append(title, create('p', tally(states, strings), 'tally'), meter, facts);
	}
	return summary;
}

function renderFindings(scan: Scan, findings: readonly Finding[], strings: ScannerStrings): HTMLElement {
	if (findings.length === 0) {
		return create('p', strings.noFindings, 'empty');
	}
	const list = create('ul', undefined, 'findings');
	for (const finding of findings) {
		const severity = severityOf(finding.code);
		const item = create('li');
		item.dataset['severity'] = severity;
		item.append(create('span', strings.severity[severity], 'severity'), create('span', strings.findings[finding.code] ?? finding.code, 'title'));

		const header = headerOf(finding);
		const current = header === undefined ? undefined : scan.headers[header]?.join(' | ');
		if (header !== undefined) {
			const meta = create('p', undefined, 'meta');
			meta.append(create('code', header, 'header'), create('span', `${strings.currentValue}: ${current ?? strings.missing}`, 'current'));
			item.append(meta);
		}
		const detail = extraDetail(finding, header, current);
		if (detail !== '') {
			item.append(create('p', detail, 'detail'));
		}
		const guide = strings.guides[finding.code];
		if (guide !== undefined) {
			const link = create('a', strings.guide, 'guide');
			link.href = guide;
			item.append(link);
		}
		list.append(item);
	}
	return list;
}

function renderResponse(scan: Scan, states: Map<string, CheckState>, findings: readonly Finding[], strings: ScannerStrings): HTMLElement {
	const panel = create('div', undefined, 'response');
	const chain = create('ol', undefined, 'chain');
	chain.setAttribute('aria-label', strings.redirects);
	chain.append(create('li', `GET https://${scan.host}/`, 'request'));
	for (const hop of scan.hops) {
		chain.append(create('li', `${hop.status}  →  ${hop.location}`, 'hop'));
	}
	const statusLine = create('p', undefined, 'status-line');
	statusLine.append(create('span', `HTTP/1.1 ${scan.status}`, 'code'), create('span', scan.finalUrl, 'url'));

	const lines = create('ul', undefined, 'lines');
	for (const header of headerLines(scan, states, findings, strings)) {
		const line = create('li');
		line.dataset['state'] = header.state;
		const mark = create('span', undefined, 'mark');
		mark.setAttribute('aria-hidden', 'true');
		const main = create('div', undefined, 'line-main');
		main.append(create('span', header.name, 'key'), create('span', ': ', 'sep'));
		main.append(create('span', header.value, scan.headers[header.name] === undefined ? 'gap' : 'val'));
		if (header.label !== undefined) {
			main.append(create('span', header.label, 'tag'));
		}
		line.append(mark, main, create('p', strings.headerHints[header.name] ?? '', 'hint'));
		lines.append(line);
	}
	panel.append(chain, statusLine, lines);
	return panel;
}

function selectAll(field: HTMLTextAreaElement): void {
	field.focus();
	field.select();
}

function mountCopy(summary: HTMLElement, text: string, title: string, strings: ScannerStrings): void {
	const template = document.querySelector<HTMLTemplateElement>('template[data-scanner-copy]');
	if (template === null) {
		return;
	}
	const fragment = template.content.cloneNode(true) as DocumentFragment;
	const button = fragment.querySelector<HTMLButtonElement>('[data-copy]');
	const label = fragment.querySelector<HTMLElement>('[data-copy-label]');
	const live = fragment.querySelector<HTMLElement>('[data-copy-live]');
	const fallback = fragment.querySelector<HTMLElement>('[data-copy-fallback]');
	const error = fragment.querySelector<HTMLElement>('[data-copy-error]');
	const source = fragment.querySelector<HTMLTextAreaElement>('[data-copy-source]');
	if (!button || !label || !live || !fallback || !error || !source) {
		return;
	}
	source.value = text;
	source.setAttribute('aria-label', title);
	let timer: number | undefined;
	button.addEventListener('click', async () => {
		window.clearTimeout(timer);
		try {
			await navigator.clipboard.writeText(text);
			fallback.hidden = true;
			button.dataset['state'] = 'copied';
			label.textContent = strings.copied;
			live.textContent = strings.copiedStatus;
			timer = window.setTimeout(() => {
				delete button.dataset['state'];
				label.textContent = strings.copy;
				live.textContent = '';
			}, COPIED_RESET_MS);
		} catch {
			error.textContent = strings.copyError;
			fallback.hidden = false;
			selectAll(source);
		}
	});
	summary.append(fragment);
}

function renderScan(container: HTMLElement, scan: Scan, elapsedMs: number, strings: ScannerStrings): void {
	const findings = allFindings(scan);
	const states = checkStates(scan, findings);
	const summary = renderSummary(scan, states, findings, elapsedMs, strings);
	mountCopy(summary, resultText(scan, states, findings, elapsedMs, strings), fill(strings.resultTitle, { host: scan.displayHost }), strings);
	const response = [create('h3', strings.headersTitle), renderResponse(scan, states, findings, strings)];
	if (isBlocked(scan)) {
		container.replaceChildren(summary, ...response);
	} else {
		container.replaceChildren(
			summary,
			create('h3', `${strings.findingsTitle} (${findings.length})`),
			renderFindings(scan, findings, strings),
			...response
		);
	}
	const passed = passedMessages(scan, strings);
	if (passed.length > 0) {
		const list = create('ul', undefined, 'passed');
		for (const message of passed) {
			list.append(create('li', message));
		}
		container.append(create('h3', `${strings.passedTitle} (${passed.length})`), list);
	}
	container.hidden = false;
	summary.querySelector('h2')?.focus();
}

function loadTurnstile(): Promise<TurnstileApi> {
	turnstileLoad ??= new Promise<TurnstileApi>((resolve, reject) => {
		if (window.turnstile) {
			resolve(window.turnstile);
			return;
		}
		const script = document.createElement('script');
		script.src = TURNSTILE_SCRIPT;
		script.async = true;
		script.addEventListener('load', () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile_load'))));
		script.addEventListener('error', () => reject(new Error('turnstile_load')));
		document.head.append(script);
	}).catch((error: unknown) => {
		turnstileLoad = undefined;
		throw error;
	});
	return turnstileLoad;
}

function pageTheme(): string {
	const theme = document.documentElement.dataset['theme'];
	return theme === 'dark' || theme === 'light' ? theme : 'auto';
}

function createBotCheck(container: HTMLElement, siteKey: string): BotCheck {
	let widget: string | undefined;
	let pending: { resolve(token: string): void; reject(error: Error): void } | undefined;
	const settle = (outcome: string | Error): void => {
		const current = pending;
		pending = undefined;
		if (current === undefined) {
			return;
		}
		if (typeof outcome === 'string') {
			current.resolve(outcome);
		} else {
			current.reject(outcome);
		}
	};
	return {
		async token() {
			const api = await loadTurnstile();
			return new Promise<string>((resolve, reject) => {
				pending = { resolve, reject };
				widget ??= api.render(container, {
					'sitekey': siteKey,
					'action': TURNSTILE_ACTION,
					'appearance': 'interaction-only',
					'execution': 'execute',
					'retry': 'never',
					'language': document.documentElement.lang || 'auto',
					'theme': pageTheme(),
					'callback': (token: string) => settle(token),
					'error-callback': () => settle(new Error('turnstile_failed')),
					'timeout-callback': () => settle(new Error('turnstile_failed')),
					'expired-callback': () => settle(new Error('turnstile_failed'))
				});
				if (widget === undefined) {
					settle(new Error('turnstile_load'));
					return;
				}
				api.execute(widget);
			});
		},
		reset() {
			if (widget !== undefined) {
				window.turnstile?.reset(widget);
			}
		}
	};
}

export function mountScannerForm(form: HTMLFormElement): void {
	const strings = JSON.parse(form.dataset['strings'] ?? '{}') as ScannerStrings;
	const api = form.dataset['api'] ?? '';
	const input = form.querySelector<HTMLInputElement>('input[name="url"]');
	const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
	const status = form.querySelector<HTMLElement>('[data-scanner-status]');
	const progress = form.querySelector<HTMLElement>('[data-scanner-progress]');
	const widget = form.querySelector<HTMLElement>('[data-scanner-turnstile]');
	const result = document.querySelector<HTMLElement>('[data-scanner-result]');
	if (!input || !button || !status || !progress || !widget || !result) {
		return;
	}
	const botCheck = createBotCheck(widget, form.dataset['sitekey'] ?? '');

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
				status.textContent = strings.done;
				renderScan(result, body, performance.now() - startedAt, strings);
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
