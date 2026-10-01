import codes from './codes.json';
import type { Finding, Scan, ScannerStrings, Section, SectionId, Severity, UnreviewedStatus } from './types';

type CheckState = 'pass' | Severity;
type LineState = CheckState | 'neutral';
type FindingSpec = { readonly section: SectionId; readonly severity: Severity; readonly check: string };
type HeaderLine = { readonly name: string; readonly state: LineState; readonly value: string; readonly label: string | undefined };
type Notice = { readonly status: UnreviewedStatus; readonly text: string };

const SECTION_ORDER: readonly SectionId[] = ['connection', 'headers', 'cookies', 'content', 'email'];
const UNREVIEWED: ReadonlySet<string> = new Set<UnreviewedStatus>(['error', 'blocked', 'not_applicable']);

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
const FINDING_SPECS = codes.findings as Readonly<Record<string, FindingSpec | undefined>>;
const CHECK_ORDER = Object.keys(codes.passed);
const SHOWN_HEADERS = Object.keys(HEADER_CHECKS);
const COPIED_RESET_MS = 2500;
export const RESCAN_KEY = 'scanner:rescan';

export function minutesSentence(minutes: number, one: string, many: string): string {
	return minutes === 1 ? one : fill(many, { minutes: String(minutes) });
}

export function minutesUntil(iso: string | undefined): number {
	return Math.max(1, Math.ceil((Date.parse(iso ?? '') - Date.now()) / 60_000) || 1);
}

export function fill(template: string, values: Readonly<Record<string, string>>): string {
	return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder);
}

function severityOf(code: string): Severity {
	return FINDING_SPECS[code]?.severity ?? 'info';
}

function rank(severity: Severity): number {
	return SEVERITY_ORDER.indexOf(severity);
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

function formatSeconds(milliseconds: number): string {
	const lang = document.documentElement.lang || 'es';
	return new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(milliseconds / 1000);
}

function sectionsOf(scan: Scan): [SectionId, Section][] {
	return SECTION_ORDER.flatMap((id) => {
		const section = scan.sections[id];
		return section === undefined ? [] : [[id, section] as [SectionId, Section]];
	});
}

function allFindings(scan: Scan): Finding[] {
	return sectionsOf(scan)
		.flatMap(([, section]) => section.findings)
		.toSorted((a, b) => rank(severityOf(a.code)) - rank(severityOf(b.code)));
}

function checkStates(scan: Scan, findings: readonly Finding[]): Map<string, CheckState> {
	const states = new Map<string, CheckState>();
	for (const [, section] of sectionsOf(scan)) {
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

function notices(scan: Scan, strings: ScannerStrings): Notice[] {
	const lang = document.documentElement.lang || 'es';
	const grouped = new Map<UnreviewedStatus, string[]>();
	for (const [id, section] of sectionsOf(scan)) {
		if (UNREVIEWED.has(section.status)) {
			const status = section.status as UnreviewedStatus;
			grouped.set(status, [...(grouped.get(status) ?? []), strings.sections[id]]);
		}
	}
	return [...grouped].map(([status, names]) => {
		const listed = new Intl.ListFormat(lang, { type: 'conjunction' }).format(
			names.map((name, index) => (index === 0 ? name : `${name.charAt(0).toLowerCase()}${name.slice(1)}`))
		);
		const text = names.length === 1 ? strings.sectionStatus[status] : strings.sectionStatusMany[status];
		return { status, text: `${listed}: ${text}` };
	});
}

function noteTexts(scan: Scan, strings: ScannerStrings): string[] {
	return sectionsOf(scan).flatMap(([, section]) =>
		section.notes.map((note) => {
			const separator = note.indexOf(':');
			const code = separator === -1 ? note : note.slice(0, separator);
			const detail = separator === -1 ? '' : note.slice(separator + 1);
			return fill(strings.notes[code] ?? code, { detail });
		})
	);
}

function headersBlocked(scan: Scan): boolean {
	return scan.sections.headers?.status === 'blocked';
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
	const blocked = headersBlocked(scan);
	return SHOWN_HEADERS.map((name) => {
		const values = scan.headers[name];
		const state = blocked ? 'neutral' : lineState(name, values !== undefined, states, findings);
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

function factLabels(scan: Scan, elapsedMs: number | null, strings: ScannerStrings): string[] {
	const labels: string[] = [];
	if (scan.status !== null) {
		labels.push(fill(strings.facts.status, { code: String(scan.status) }));
	}
	if (scan.finalUrl?.startsWith('https:')) {
		labels.push(strings.facts.https);
	}
	if (scan.hops.length > 0) {
		const template = scan.hops.length === 1 ? strings.facts.redirectsOne : strings.facts.redirectsMany;
		labels.push(fill(template, { count: String(scan.hops.length) }));
	}
	if (scan.finalUrl !== null && !headersBlocked(scan)) {
		const sent = SHOWN_HEADERS.filter((name) => scan.headers[name] !== undefined).length;
		labels.push(fill(strings.facts.headers, { sent: String(sent), total: String(SHOWN_HEADERS.length) }));
	}
	if (elapsedMs !== null) {
		labels.push(fill(strings.facts.time, { seconds: formatSeconds(elapsedMs) }));
	}
	return labels;
}

function gradeLine(scan: Scan, strings: ScannerStrings): string | undefined {
	if (scan.grade === undefined || scan.score === undefined) {
		return undefined;
	}
	return fill(strings.grade, { grade: scan.grade, score: String(scan.score) });
}

function tally(states: Map<string, CheckState>, strings: ScannerStrings): string {
	const total = states.size;
	const passed = [...states.values()].filter((state) => state === 'pass').length;
	return fill(total === 1 ? strings.summaryOne : strings.summaryMany, { passed: String(passed), total: String(total) });
}

function passedMessages(scan: Scan, strings: ScannerStrings): string[] {
	return sectionsOf(scan).flatMap(([, section]) => section.passed.map((check) => strings.passed[check] ?? check));
}

function findingTitle(finding: Finding, strings: ScannerStrings): string {
	return strings.findings[finding.code] ?? finding.code;
}

function sectionLabel(finding: Finding, strings: ScannerStrings): string {
	const section = FINDING_SPECS[finding.code]?.section;
	return section === undefined ? '' : strings.sections[section];
}

function resultText(
	scan: Scan,
	states: Map<string, CheckState>,
	findings: readonly Finding[],
	elapsedMs: number | null,
	strings: ScannerStrings
): string {
	const lines = [fill(strings.resultTitle, { host: scan.displayHost })];
	const graded = gradeLine(scan, strings);
	if (graded !== undefined) {
		lines.push(scan.partial === true ? `${graded}. ${strings.partialGrade}` : graded);
	}
	if (states.size > 0) {
		lines.push(tally(states, strings));
	}
	lines.push(factLabels(scan, elapsedMs, strings).join(' | '));
	for (const notice of notices(scan, strings)) {
		lines.push(notice.text);
	}
	lines.push('', `${strings.findingsTitle} (${findings.length})`);
	if (findings.length === 0) {
		lines.push(scan.partial === true ? strings.noFindingsPartial : strings.noFindings);
	}
	for (const finding of findings) {
		const header = headerOf(finding);
		const current = header === undefined ? undefined : scan.headers[header]?.join(' | ');
		lines.push(`- [${strings.severity[severityOf(finding.code)]}] ${sectionLabel(finding, strings)}: ${findingTitle(finding, strings)}`);
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
	if (scan.finalUrl !== null) {
		lines.push('', strings.headersTitle, `GET https://${scan.host}/`);
		for (const hop of scan.hops) {
			lines.push(`  ${hop.status} → ${hop.location}`);
		}
		lines.push(`HTTP/1.1 ${scan.status ?? ''} ${scan.finalUrl}`);
		if (headersBlocked(scan)) {
			lines.push(strings.blockedPage);
		}
		for (const line of headerLines(scan, states, findings, strings)) {
			lines.push(`${LINE_MARKS[line.state]} ${line.name}: ${line.value}${line.label === undefined ? '' : ` (${line.label})`}`);
		}
	}
	const passed = passedMessages(scan, strings);
	if (passed.length > 0) {
		lines.push('', `${strings.passedTitle} (${passed.length})`, ...passed.map((message) => `- ${message}`));
	}
	const notes = noteTexts(scan, strings);
	if (notes.length > 0) {
		lines.push('', `${strings.notesTitle} (${notes.length})`, ...notes.map((note) => `- ${note}`));
	}
	return `${lines.join('\n')}\n`;
}

function renderSummary(
	scan: Scan,
	states: Map<string, CheckState>,
	findings: readonly Finding[],
	elapsedMs: number | null,
	strings: ScannerStrings
): HTMLElement {
	const summary = create('div', undefined, 'summary');
	const title = create('h2', fill(strings.resultTitle, { host: scan.displayHost }));
	title.tabIndex = -1;
	summary.append(title);

	const graded = gradeLine(scan, strings);
	if (graded !== undefined && scan.grade !== undefined) {
		const grade = create('div', undefined, 'grade');
		grade.dataset['grade'] = scan.grade;
		const letter = create('span', scan.grade, 'letter');
		letter.setAttribute('aria-hidden', 'true');
		const text = create('div', undefined, 'text');
		text.append(create('p', graded, 'words'));
		if (scan.partial === true) {
			text.append(create('p', strings.partialGrade, 'partial'));
		}
		grade.append(letter, text);
		summary.append(grade);
	}

	if (states.size > 0) {
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
		summary.append(create('p', tally(states, strings), 'tally'), meter);
	}

	const facts = create('ul', undefined, 'facts');
	for (const label of factLabels(scan, elapsedMs, strings)) {
		facts.append(create('li', label));
	}
	summary.append(facts);

	const pending = notices(scan, strings);
	if (pending.length > 0) {
		const list = create('ul', undefined, 'notices');
		for (const notice of pending) {
			const item = create('li', notice.text);
			item.dataset['status'] = notice.status;
			list.append(item);
		}
		summary.append(list);
	}
	return summary;
}

function renderFindings(scan: Scan, findings: readonly Finding[], strings: ScannerStrings): HTMLElement {
	if (findings.length === 0) {
		return create('p', scan.partial === true ? strings.noFindingsPartial : strings.noFindings, 'empty');
	}
	const list = create('ul', undefined, 'findings');
	for (const finding of findings) {
		const severity = severityOf(finding.code);
		const item = create('li');
		item.dataset['severity'] = severity;
		const heading = create('span', undefined, 'title');
		const section = sectionLabel(finding, strings);
		if (section !== '') {
			heading.append(create('span', section, 'section'));
		}
		heading.append(document.createTextNode(findingTitle(finding, strings)));
		item.append(create('span', strings.severity[severity], 'severity'), heading);

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
		item.append(explanationDisclosure(finding.code, strings));
		list.append(item);
	}
	return list;
}

async function loadExplanation(code: string, body: HTMLElement, strings: ScannerStrings): Promise<void> {
	body.dataset['state'] = 'loading';
	body.replaceChildren(create('p', strings.explanationLoading, 'fix-status'));
	try {
		const lang = document.documentElement.lang || 'es';
		const response = await fetch(`/scanner/explanations/${lang}/${encodeURIComponent(code)}`);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const article = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('article.explanation');
		if (article === null) {
			throw new Error('no explanation in the fragment');
		}
		body.replaceChildren(document.importNode(article, true));
		body.dataset['state'] = 'loaded';
	} catch {
		delete body.dataset['state'];
		body.replaceChildren(create('p', strings.explanationError, 'fix-status'));
	}
}

function explanationDisclosure(code: string, strings: ScannerStrings): HTMLElement {
	const disclosure = create('details', undefined, 'fix');
	const body = create('div', undefined, 'fix-body');
	disclosure.append(create('summary', strings.explanationShow), body);
	disclosure.addEventListener('toggle', () => {
		if (disclosure.open && body.dataset['state'] === undefined) {
			void loadExplanation(code, body, strings);
		}
	});
	return disclosure;
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
	statusLine.append(create('span', `HTTP/1.1 ${scan.status ?? ''}`, 'code'), create('span', scan.finalUrl ?? '', 'url'));
	panel.append(chain, statusLine);
	if (headersBlocked(scan)) {
		panel.append(create('p', strings.blockedPage, 'caption'));
	}

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
	panel.append(lines);
	return panel;
}

function list(className: string, items: readonly string[]): HTMLElement {
	const node = create('ul', undefined, className);
	for (const item of items) {
		node.append(create('li', item));
	}
	return node;
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

export type RenderOptions = {
	readonly reportLink: boolean;
};

function mountReportLink(summary: HTMLElement, scan: Scan, strings: ScannerStrings): void {
	const actions = summary.querySelector<HTMLElement>('.actions');
	if (actions === null || typeof scan.id !== 'string') {
		return;
	}
	const link = create('a', strings.reportLink, 'copy report-link');
	link.href = fill(strings.reportPath, { id: scan.id });
	actions.prepend(link);
}

export function renderScan(
	container: HTMLElement,
	scan: Scan,
	elapsedMs: number | null,
	strings: ScannerStrings,
	options: RenderOptions = { reportLink: false }
): void {
	const findings = allFindings(scan);
	const states = checkStates(scan, findings);
	const summary = renderSummary(scan, states, findings, elapsedMs, strings);
	const title = fill(strings.resultTitle, { host: scan.displayHost });
	mountCopy(summary, resultText(scan, states, findings, elapsedMs, strings), title, strings);
	if (options.reportLink) {
		mountReportLink(summary, scan, strings);
	}
	container.replaceChildren(
		summary,
		create('h3', `${strings.findingsTitle} (${findings.length})`),
		renderFindings(scan, findings, strings)
	);
	if (scan.finalUrl !== null) {
		container.append(create('h3', strings.headersTitle), renderResponse(scan, states, findings, strings));
	}
	const passed = passedMessages(scan, strings);
	if (passed.length > 0) {
		container.append(create('h3', `${strings.passedTitle} (${passed.length})`), list('passed', passed));
	}
	const notes = noteTexts(scan, strings);
	if (notes.length > 0) {
		container.append(create('h3', `${strings.notesTitle} (${notes.length})`), list('notes', notes));
	}
	container.hidden = false;
	summary.querySelector('h2')?.focus();
}
