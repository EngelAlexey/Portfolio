import type { MessageInput, Report } from './analyze';
import { analyzeAll } from './analyze-all';
import type { FileFacts } from './file/analyze-file';
import { LIMITS } from './limits';
import type { Finding, SectionId, Severity } from './types';

export type ClientStrings = {
	readonly findings: Readonly<Record<string, string>>;
	readonly status: {
		readonly working: string;
		readonly timeout: string;
		readonly error: string;
		readonly empty: string;
		readonly truncated: string;
	};
	readonly result: {
		readonly title: string;
		readonly summaryOne: string;
		readonly summaryMany: string;
		readonly none: string;
		readonly closing: string;
		readonly explain: string;
		readonly sources: string;
		readonly file: {
			readonly title: string;
			readonly name: string;
			readonly size: string;
			readonly type: string;
			readonly hash: string;
			readonly copy: string;
			readonly copied: string;
			readonly hashHint: string;
			readonly notRead: string;
			readonly kinds: Readonly<Record<string, string>>;
		};
		readonly sections: Readonly<Record<'links' | 'text' | 'sender' | 'headers' | 'files', string>>;
		readonly severity: Readonly<Record<Severity, string>>;
		readonly evidence: Readonly<Record<string, string>>;
		readonly doTitle: string;
		readonly doItems: readonly string[];
		readonly skippedTitle: string;
		readonly skippedItems: readonly string[];
	};
	readonly sample: {
		readonly message: string;
		readonly links: string;
		readonly sender: string;
		readonly headers: string;
	};
};

type Answer = { readonly report?: Report; readonly error?: boolean };

const SECTIONS: readonly SectionId[] = ['links', 'text', 'sender', 'headers', 'files'];
const HIDDEN_EVIDENCE: ReadonlySet<string> = new Set(['how', 'kind', 'start', 'end']);

export function fill(template: string, values: Readonly<Record<string, string>>): string {
	return template.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? '');
}

export type FileSelection = { readonly name: string; readonly size: number; readonly buffer?: ArrayBuffer };

export function analyse(input: MessageInput, file?: FileSelection): Promise<Report> {
	return new Promise((resolve, reject) => {
		let worker: Worker;
		try {
			worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
		} catch {
			const given =
				file === undefined
					? undefined
					: { name: file.name, size: file.size, ...(file.buffer === undefined ? {} : { bytes: new Uint8Array(file.buffer) }) };
			analyzeAll(input, given).then(resolve, () => reject(new Error('error')));
			return;
		}
		const finish = (): void => {
			clearTimeout(timer);
			worker.terminate();
		};
		const timer = setTimeout(() => {
			worker.terminate();
			reject(new Error('timeout'));
		}, LIMITS.analysisMs);
		worker.onmessage = (event: MessageEvent<Answer>) => {
			finish();
			if (event.data.report !== undefined) resolve(event.data.report);
			else reject(new Error('error'));
		};
		worker.onerror = () => {
			finish();
			reject(new Error('error'));
		};
		worker.postMessage({ input, file }, file?.buffer === undefined ? [] : [file.buffer]);
	});
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
	const element = document.createElement(tag);
	if (className !== '') element.className = className;
	if (text !== '') element.textContent = text;
	return element;
}

function list(items: readonly string[]): HTMLUListElement {
	const element = node('ul', 'plain');
	for (const item of items) element.append(node('li', '', item));
	return element;
}

function formatSize(bytes: number): string {
	const format = new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: 1 });
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${format.format(bytes / 1024)} KB`;
	return `${format.format(bytes / (1024 * 1024))} MB`;
}

function fileFacts(file: FileFacts, strings: ClientStrings): HTMLElement {
	const copy = strings.result.file;
	const facts = node('dl', 'evidence');
	const row = (label: string, value: string): HTMLElement => {
		const line = node('div');
		line.append(node('dt', '', label));
		line.append(node('dd', '', value));
		facts.append(line);
		return line;
	};
	row(copy.name, file.name);
	row(copy.size, formatSize(file.size));
	if (file.kind !== null) row(copy.type, copy.kinds[file.kind] ?? file.kind);
	if (file.sha256 === null) {
		row(copy.hash, copy.notRead);
		return facts;
	}
	const line = row(copy.hash, file.sha256);
	const button = node('button', 'copy', copy.copy);
	button.type = 'button';
	const reset = copy.copy;
	button.addEventListener('click', () => {
		navigator.clipboard.writeText(file.sha256 ?? '').then(
			() => {
				button.textContent = copy.copied;
				setTimeout(() => {
					button.textContent = reset;
				}, 2000);
			},
			() => undefined
		);
	});
	line.append(button);
	facts.append(node('p', 'hint', copy.hashHint));
	return facts;
}

function card(item: Finding, strings: ClientStrings, templates: ReadonlyMap<string, HTMLTemplateElement>): HTMLElement {
	const article = node('article', 'finding');
	article.dataset['severity'] = item.severity;

	const head = node('header');
	head.append(node('span', 'severity', strings.result.severity[item.severity]));
	head.append(node('h4', '', strings.findings[item.code] ?? item.code));
	article.append(head);

	const rows = Object.entries(item.evidence).filter(([key, value]) => {
		if (HIDDEN_EVIDENCE.has(key) || value === '') return false;
		return key !== 'count' || Number(value) > 1;
	});
	if (rows.length > 0) {
		const evidence = node('dl', 'evidence');
		for (const [key, value] of rows) {
			const row = node('div');
			row.append(node('dt', '', strings.result.evidence[key] ?? key));
			row.append(node('dd', '', value));
			evidence.append(row);
		}
		article.append(evidence);
	}

	const template = templates.get(item.code);
	if (template !== undefined) {
		const details = node('details', 'explain');
		details.append(node('summary', '', strings.result.explain));
		const body = node('div', 'explanation');
		body.append(template.content.cloneNode(true));
		details.append(body);
		article.append(details);
	}

	return article;
}

export function renderReport(
	container: HTMLElement,
	report: Report,
	strings: ClientStrings,
	templates: ReadonlyMap<string, HTMLTemplateElement>
): HTMLElement {
	container.replaceChildren();

	const heading = node('h2', 'result-title', strings.result.title);
	heading.tabIndex = -1;
	container.append(heading);

	const total = report.findings.length;
	const high = report.findings.filter((item) => item.severity === 'critical' || item.severity === 'high').length;
	const medium = report.findings.filter((item) => item.severity === 'medium').length;
	const low = total - high - medium;
	if (total === 0) {
		container.append(node('p', 'summary', strings.result.none));
	} else {
		const template = total === 1 ? strings.result.summaryOne : strings.result.summaryMany;
		container.append(
			node('p', 'summary', fill(template, { total: String(total), high: String(high), medium: String(medium), low: String(low) }))
		);
	}

	for (const section of SECTIONS) {
		const found = report.findings.filter((item) => item.section === section);
		if (found.length === 0 && !(section === 'files' && report.file !== undefined)) continue;
		const block = node('section', 'group');
		block.append(node('h3', '', strings.result.sections[section as 'links' | 'text' | 'sender' | 'headers' | 'files']));
		if (section === 'files' && report.file !== undefined) block.append(fileFacts(report.file, strings));
		for (const item of found) block.append(card(item, strings, templates));
		container.append(block);
	}

	const todo = node('section', 'group');
	todo.append(node('h3', '', strings.result.doTitle));
	todo.append(list(strings.result.doItems));
	container.append(todo);

	const skipped = node('section', 'group');
	skipped.append(node('h3', '', strings.result.skippedTitle));
	skipped.append(list(strings.result.skippedItems));
	container.append(skipped);

	container.append(node('p', 'closing', strings.result.closing));

	return heading;
}
