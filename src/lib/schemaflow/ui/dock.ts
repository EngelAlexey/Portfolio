import { DIALECT_LABELS, FILE_NAMES, generate } from '../dialects';
import { mergeImported } from '../model/merge';
import { DIALECTS, LIMITS, type DialectId, type Schema } from '../model/types';
import type { CodeIssue } from '../parse/issues';
import type { ParseResult } from '../parse';
import type { EngineResult } from '../validate/pglite';
import type { CodeEditor } from './code-editor';
import { copyText, download, h, icon, mod } from './dom';
import { codeMessage } from './messages';
import { QueryPanel } from './query-panel';
import type { Bubble, Live, Toasts } from './popups';
import type { Store } from './store';
import { fill, plural, type Strings } from './strings';

type State = 'synced' | 'edited' | 'applying';
type ParseModule = typeof import('../parse');

export interface DockHost {
	strings: Strings;
	lang: 'es' | 'en';
	bubble: Bubble;
	toasts: Toasts;
	live: Live;
	commit(next: Schema, label: string): void;
	undo(): void;
	afterApply(wasEmpty: boolean): void;
	designName(): string;
}

const MARKERS: Record<DialectId, RegExp[]> = {
	postgres: [/\bSERIAL\b/i, /::\w/, /\$\$/, /\bBIGSERIAL\b/i, /\bJSONB\b/i, /\bTIMESTAMPTZ\b/i, /\bBYTEA\b/i, /GENERATED\s+(ALWAYS|BY DEFAULT)\s+AS\s+IDENTITY/i],
	mysql: [/\bAUTO_INCREMENT\b/i, /\bENGINE\s*=/i, /`/, /\bTINYINT\s*\(\s*1\s*\)/i, /\bUNSIGNED\b/i, /DEFAULT CHARSET/i],
	sqlserver: [/\bIDENTITY\s*\(/i, /\bNVARCHAR\b/i, /^\s*GO\s*$/im, /\[\w+\]/, /\bUNIQUEIDENTIFIER\b/i, /\bDATETIME2\b/i],
	mongodb: [/db\.createCollection/, /\$jsonSchema/, /bsonType/, /db\.\w+\.createIndex/]
};

export function detectDialect(text: string): DialectId | null {
	let best: DialectId | null = null;
	let bestScore = 1;
	for (const dialect of DIALECTS) {
		const score = MARKERS[dialect].filter((re) => re.test(text)).length;
		if (score > bestScore) {
			best = dialect;
			bestScore = score;
		}
	}
	return best;
}

function lineCol(text: string, offset: number): { line: number; column: number } {
	const before = text.slice(0, Math.max(0, offset));
	const line = before.split('\n').length;
	const column = offset - (before.lastIndexOf('\n') + 1) + 1;
	return { line, column };
}

export class Dock {
	private state: State = 'synced';
	private editor: CodeEditor | null = null;
	private editorLoading: Promise<void> | null = null;
	private fallback: HTMLPreElement;
	private generated = '';
	private parseModule: ParseModule | null = null;
	private result: ParseResult | null = null;
	private validateTimer: ReturnType<typeof setTimeout> | undefined;
	private regenerateTimer: ReturnType<typeof setTimeout> | undefined;
	private regeneratePending = false;
	private diagramChanged = false;
	private detected: DialectId | null = null;
	private engine: { state: 'idle' | 'loading' | 'running'; result: EngineResult | null; abort: AbortController | null; text: string } = { state: 'idle', result: null, abort: null, text: '' };
	private importHint = false;
	private readonly tabs = new Map<DialectId, HTMLButtonElement>();
	private chip: HTMLElement;
	private editorHost: HTMLElement;
	private findings: HTMLElement;
	private actions: HTMLElement;
	private mongoNote: HTMLElement;
	private hintLine: HTMLElement;
	private copyButton: HTMLButtonElement;
	private downloadButton: HTMLButtonElement;
	private select: HTMLSelectElement;
	private queryPanel: QueryPanel;

	constructor(
		private readonly store: Store,
		private readonly host: DockHost,
		root: HTMLElement
	) {
		const t = host.strings;
		const tablist = h('div', { class: 'sf-dock-tabs', role: 'tablist', 'aria-label': t.code.dialect });
		for (const dialect of DIALECTS) {
			const tab = h('button', { type: 'button', role: 'tab', class: 'sf-dock-tab', id: `sf-tab-${dialect}`, 'aria-selected': 'false', 'aria-controls': 'sf-code-panel', tabindex: '-1', text: DIALECT_LABELS[dialect] });
			tab.addEventListener('click', () => this.requestDialect(dialect, tab));
			tab.addEventListener('keydown', (event) => {
				const order = [...DIALECTS];
				const at = order.indexOf(dialect);
				let next: DialectId | undefined;
				if (event.key === 'ArrowRight') next = order[(at + 1) % order.length];
				else if (event.key === 'ArrowLeft') next = order[(at - 1 + order.length) % order.length];
				else if (event.key === 'Home') next = order[0];
				else if (event.key === 'End') next = order[order.length - 1];
				if (next) {
					event.preventDefault();
					this.tabs.get(next)?.focus();
				}
			});
			this.tabs.set(dialect, tab);
			tablist.append(tab);
		}
		this.select = h('select', { class: 'sf-dock-select', 'aria-label': t.code.dialect });
		for (const dialect of DIALECTS) this.select.append(h('option', { value: dialect, text: DIALECT_LABELS[dialect] }));
		this.select.addEventListener('change', () => this.requestDialect(this.select.value as DialectId, this.select));
		const status = h('div', { class: 'sf-dock-status' });
		this.chip = h('span', { class: 'sf-chip', 'data-tip': t.code.syncedTip });
		this.copyButton = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': t.code.copy, 'data-tip': t.code.copy });
		this.copyButton.append(icon('copy'));
		this.copyButton.addEventListener('click', () => void this.copy());
		this.downloadButton = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': '', 'data-tip': '' });
		this.downloadButton.append(icon('download'));
		this.downloadButton.addEventListener('click', () => this.download());
		status.append(this.chip, h('span', { class: 'sf-spacer' }), this.copyButton, this.downloadButton);
		this.mongoNote = h('p', { class: 'sf-dock-note', text: t.code.mongoNote, hidden: true });
		this.hintLine = h('p', { class: 'sf-dock-note sf-dock-import', text: t.code.importHint, hidden: true });
		this.editorHost = h('div', { class: 'sf-editor', id: 'sf-code-panel', role: 'tabpanel' });
		this.fallback = h('pre', { class: 'sf-editor-fallback', 'aria-busy': 'true' });
		this.fallback.append(h('span', { class: 'sf-editor-loading', text: t.code.loadingEditor }));
		this.editorHost.append(this.fallback);
		this.findings = h('div', { class: 'sf-findings', 'aria-live': 'polite' });
		this.actions = h('div', { class: 'sf-dock-actions' });
		this.queryPanel = new QueryPanel(t, store, host.lang, () => this.text(), () => this.querySchema());
		root.append(h('h2', { class: 'sr-only', text: t.code.title }), tablist, this.select, status, this.mongoNote, this.hintLine, this.editorHost, this.findings, this.actions, this.queryPanel.element);
		store.on('schema', () => this.onModel());
		store.on('dialect', () => this.onDialect());
		this.onDialect();
	}

	refresh(): void {
		this.onDialect();
	}

	get isEdited(): boolean {
		return this.state === 'edited';
	}

	private get dialect(): DialectId {
		return this.store.dialect;
	}

	ensureEditor(): Promise<void> {
		if (this.editor) return Promise.resolve();
		if (this.editorLoading) return this.editorLoading;
		const t = this.host.strings;
		this.editorLoading = import('./code-editor')
			.then(({ createCodeEditor }) => {
				this.fallback.remove();
				this.editor = createCodeEditor(this.editorHost, {
					dialect: this.dialect,
					value: this.generated,
					label: fill(t.code.editorLabel, { dialect: DIALECT_LABELS[this.dialect] }),
					placeholder: this.dialect === 'mongodb' ? t.code.placeholderMongo : t.code.placeholderSql,
					onChange: (value) => this.onEdit(value)
				});
				this.editor.view.contentDOM.addEventListener('keydown', (event) => {
					if (event.key === 'Enter' && mod(event)) {
						event.preventDefault();
						void this.apply();
					}
				});
			})
			.catch(() => {
				this.editorLoading = null;
				this.fallback.replaceChildren(h('span', { class: 'sf-editor-loading', text: t.code.editorFailed }));
				const retry = h('button', { type: 'button', class: 'sf-btn', text: t.retry });
				retry.addEventListener('click', () => void this.ensureEditor());
				this.fallback.append(retry);
			});
		return this.editorLoading;
	}

	private async parser(): Promise<ParseModule> {
		if (!this.parseModule) this.parseModule = await import('../parse');
		return this.parseModule;
	}

	private text(): string {
		return this.editor ? this.editor.getValue() : this.generated;
	}

	private querySchema(): Schema {
		return this.state === 'edited' && this.result ? this.result.schema : this.store.schema;
	}

	private regenerate(): void {
		this.generated = generate(this.dialect, this.store.schema);
		if (this.editor) this.editor.setValue(this.generated);
		else if (this.generated) this.fallback.textContent = this.generated;
		this.editor?.setDiagnostics([]);
		this.result = null;
	}

	private onModel(): void {
		if (this.state === 'synced') {
			clearTimeout(this.regenerateTimer);
			this.regeneratePending = true;
			this.regenerateTimer = setTimeout(() => {
				this.regeneratePending = false;
				if (this.state !== 'synced') return;
				this.regenerate();
				this.render();
			}, 60);
			return;
		}
		if (this.state === 'edited') {
			this.diagramChanged = true;
			this.render();
		}
	}

	private onDialect(): void {
		const t = this.host.strings;
		for (const [dialect, tab] of this.tabs) {
			const active = dialect === this.dialect;
			tab.setAttribute('aria-selected', String(active));
			tab.tabIndex = active ? 0 : -1;
		}
		this.select.value = this.dialect;
		this.editorHost.setAttribute('aria-labelledby', `sf-tab-${this.dialect}`);
		this.mongoNote.hidden = this.dialect !== 'mongodb';
		this.queryPanel.setVisible(this.dialect === 'postgres');
		this.queryPanel.refresh();
		const file = FILE_NAMES[this.dialect];
		this.downloadButton.setAttribute('aria-label', fill(t.code.download, { file }));
		this.downloadButton.dataset.tip = fill(t.code.download, { file });
		this.editor?.setDialect(this.dialect);
		this.editor?.setReadOnlyLabel(fill(t.code.editorLabel, { dialect: DIALECT_LABELS[this.dialect] }));
		this.engine = { state: 'idle', result: null, abort: null, text: '' };
		if (this.state !== 'edited') {
			this.state = 'synced';
			this.regenerate();
		} else {
			void this.validate();
		}
		this.render();
	}

	private requestDialect(dialect: DialectId, anchor: HTMLElement): void {
		if (dialect === this.dialect) return;
		const t = this.host.strings;
		if (this.state !== 'edited') {
			this.store.setDialect(dialect);
			return;
		}
		const content = h('div', { class: 'sf-bubble-body' });
		content.append(h('p', { class: 'sf-bubble-title', text: t.code.switchTitle }), h('p', { class: 'sf-bubble-text', text: fill(t.code.switchBody, { dialect: DIALECT_LABELS[dialect] }) }));
		const row = h('div', { class: 'sf-bubble-actions' });
		const cancel = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.cancel });
		const discard = h('button', { type: 'button', class: 'sf-btn', text: t.code.discardAndSwitch });
		const apply = h('button', { type: 'button', class: 'sf-btn sf-btn-primary', text: t.code.applyAndSwitch });
		const blocked = this.result ? this.result.issues.some((i) => i.blocking) : false;
		apply.disabled = blocked;
		cancel.addEventListener('click', () => this.host.bubble.close(true));
		discard.addEventListener('click', () => {
			this.host.bubble.close(false);
			this.state = 'synced';
			this.store.setDialect(dialect);
		});
		apply.addEventListener('click', async () => {
			this.host.bubble.close(false);
			const ok = await this.apply();
			if (ok) this.store.setDialect(dialect);
		});
		row.append(cancel, discard, apply);
		content.append(row);
		if (blocked && this.result) content.append(h('p', { class: 'sf-bubble-note', text: plural(t.code.applyBlocked, this.result.issues.filter((i) => i.blocking).length) }));
		this.host.bubble.open(anchor, content, { label: t.code.switchTitle, key: 'dialect' });
	}

	private onEdit(value: string): void {
		const t = this.host.strings;
		if (this.state === 'edited' && value === this.generated && !this.diagramChanged) {
			clearTimeout(this.validateTimer);
			this.state = 'synced';
			this.detected = null;
			this.result = null;
			this.engine = { state: 'idle', result: null, abort: null, text: '' };
			queueMicrotask(() => this.editor?.setDiagnostics([]));
			this.render();
			return;
		}
		const previous = this.state === 'edited' ? null : this.generated;
		if (this.state !== 'edited') {
			if (value === this.generated) return;
			clearTimeout(this.regenerateTimer);
			this.state = 'edited';
			this.diagramChanged = this.regeneratePending;
			this.regeneratePending = false;
			this.host.live.say(t.code.editedLive);
		}
		this.importHint = false;
		if (previous !== null && value.length - previous.length > 40) {
			const guess = detectDialect(value);
			this.detected = guess && guess !== this.dialect ? guess : null;
		} else if (this.detected && detectDialect(value) !== this.detected) {
			this.detected = null;
		}
		this.engine = { state: 'idle', result: null, abort: null, text: '' };
		clearTimeout(this.validateTimer);
		this.validateTimer = setTimeout(() => void this.validate(), 300);
		this.render();
	}

	private async validate(): Promise<void> {
		if (this.state !== 'edited') return;
		const module = await this.parser();
		if (this.state !== 'edited') return;
		const text = this.text();
		this.result = module.parseCode(this.dialect, text);
		const t = this.host.strings;
		this.editor?.setDiagnostics(
			this.result.issues
				.filter((i) => i.code !== 'statement-preserved')
				.map((i) => ({ from: i.from, to: Math.max(i.to, i.from + 1), severity: i.severity === 'info' ? 'info' : i.blocking || i.severity === 'error' ? 'error' : 'warning', message: codeMessage(t.engine, this.host.lang, this.dialect, i) }))
		);
		this.render();
	}

	async apply(): Promise<boolean> {
		if (this.state !== 'edited') return true;
		const t = this.host.strings;
		clearTimeout(this.validateTimer);
		const text = this.text();
		if (text.length > LIMITS.code) {
			this.render();
			return false;
		}
		this.state = 'applying';
		this.render();
		const module = await this.parser();
		const result = module.parseCode(this.dialect, text);
		this.result = result;
		if (module.hasBlocking(result.issues)) {
			this.state = 'edited';
			await this.validate();
			return false;
		}
		const wasEmpty = this.store.schema.tables.length === 0;
		const merged = mergeImported(this.store.schema, { ...result.schema, name: this.store.schema.name, notes: this.store.schema.notes, areas: this.store.schema.areas }, this.dialect);
		this.state = 'synced';
		this.diagramChanged = false;
		this.detected = null;
		this.host.commit(merged, t.history.applyCode);
		this.regenerate();
		this.render();
		this.host.afterApply(wasEmpty);
		this.host.toasts.show(t.code.applied, { label: t.toast.undo, run: () => this.host.undo() });
		this.editor?.view.focus();
		return true;
	}

	discard(): void {
		const t = this.host.strings;
		const edited = this.text();
		this.state = 'synced';
		this.diagramChanged = false;
		this.detected = null;
		this.regenerate();
		this.render();
		this.host.toasts.show(t.code.discarded, {
			label: t.toast.undo,
			run: () => {
				this.editor?.setValue(edited);
				this.onEdit(edited);
			}
		});
		this.editor?.view.focus();
	}

	startImport(): void {
		void this.ensureEditor().then(() => {
			this.importHint = true;
			this.render();
			const view = this.editor?.view;
			if (view) {
				view.focus();
				view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
			}
		});
	}

	loadText(text: string, dialect?: DialectId): void {
		if (dialect && dialect !== this.dialect) {
			this.state = 'edited';
			this.store.setDialect(dialect);
		}
		void this.ensureEditor().then(() => {
			this.editor?.setValue(text);
			this.onEdit(text);
			if (!dialect) {
				const guess = detectDialect(text);
				this.detected = guess && guess !== this.dialect ? guess : null;
				this.render();
			}
		});
	}

	private async copy(): Promise<void> {
		const t = this.host.strings;
		const ok = await copyText(this.text());
		this.host.toasts.show(ok ? t.code.copied : t.copyFailed, undefined, ok ? 'info' : 'error');
	}

	private download(): void {
		const t = this.host.strings;
		const name = this.host.designName();
		const base = name ? name.replace(/[^\w.-]+/g, '_').slice(0, 60) : 'schema';
		const file = FILE_NAMES[this.dialect].replace(/^schema/, base);
		download(file, this.text(), this.dialect === 'mongodb' ? 'text/javascript;charset=utf-8' : 'application/sql;charset=utf-8');
		this.host.toasts.show(fill(t.code.downloaded, { file }));
	}

	private async testEngine(): Promise<void> {
		const t = this.host.strings;
		if (this.engine.state !== 'idle') {
			this.engine.abort?.abort();
			return;
		}
		const abort = new AbortController();
		const text = this.text();
		this.engine = { state: 'loading', result: null, abort, text };
		this.render();
		try {
			const { runPostgres } = await import('../validate/pglite');
			const result = await runPostgres(text, {
				signal: abort.signal,
				onRunning: () => {
					this.engine.state = 'running';
					this.render();
				}
			});
			this.engine = { state: 'idle', result, abort: null, text };
			if (!result.ok && result.position !== null) {
				const from = result.position - 1;
				this.editor?.setDiagnostics([{ from, to: from + 1, severity: 'error', message: fill(t.engine.codes.engine, { message: result.message }) }]);
			}
		} catch {
			this.engine = { state: 'idle', result: { ok: false, message: '', position: null, hint: null, code: null, failed: true }, abort: null, text };
		}
		this.render();
	}

	private issueButton(issue: CodeIssue, text: string): HTMLElement {
		const t = this.host.strings;
		const { line, column } = lineCol(text, issue.from);
		const item = h('button', { type: 'button', class: `sf-finding sf-finding-${issue.blocking ? 'error' : issue.severity}` });
		item.append(h('span', { class: 'sf-finding-pos', text: fill(t.code.position, { line, column }) }), h('span', { class: 'sf-finding-text', text: codeMessage(t.engine, this.host.lang, this.dialect, issue) }));
		item.addEventListener('click', () => this.editor?.reveal(issue.from, Math.max(issue.to, issue.from + 1)));
		return item;
	}

	render(): void {
		const t = this.host.strings;
		const state = this.state;
		this.queryPanel.refresh();
		this.chip.className = `sf-chip sf-chip-${state}`;
		this.chip.replaceChildren(h('span', { class: 'sf-chip-dot', 'aria-hidden': 'true' }), state === 'synced' ? t.code.synced : state === 'edited' ? t.code.edited : t.code.applying);
		this.chip.dataset.tip = state === 'edited' ? t.code.editedTip : t.code.syncedTip;
		this.hintLine.hidden = !this.importHint;
		this.findings.replaceChildren();
		const text = this.text();
		if (state !== 'synced' && this.detected) {
			const box = h('div', { class: 'sf-finding-box sf-detect' });
			const target = this.detected;
			const button = h('button', { type: 'button', class: 'sf-btn', text: fill(t.code.switchTo, { dialect: DIALECT_LABELS[target] }) });
			button.addEventListener('click', () => {
				this.detected = null;
				this.store.setDialect(target);
			});
			box.append(h('span', { text: fill(t.code.detected, { dialect: DIALECT_LABELS[target] }) }), button);
			this.findings.append(box);
		}
		if (state !== 'synced' && text.length > LIMITS.code) {
			this.findings.append(h('p', { class: 'sf-finding sf-finding-error', text: t.code.tooLarge }));
		}
		if (state !== 'synced' && this.result) {
			const blocking = this.result.issues.filter((i) => i.blocking);
			const others = this.result.issues.filter((i) => !i.blocking && i.code !== 'statement-preserved');
			const preserved = this.result.issues.filter((i) => i.code === 'statement-preserved');
			if (blocking.length > 0) {
				this.findings.append(h('p', { class: 'sf-finding-title', text: t.code.blockingTitle }));
				for (const issue of blocking.slice(0, 50)) this.findings.append(this.issueButton(issue, text));
			}
			if (others.length > 0) {
				this.findings.append(h('p', { class: 'sf-finding-title', text: t.code.findingsTitle }));
				for (const issue of others.slice(0, 50)) this.findings.append(this.issueButton(issue, text));
			}
			if (preserved.length > 0) {
				const lines = preserved.map((i) => lineCol(text, i.from).line);
				this.findings.append(h('p', { class: 'sf-finding sf-finding-info', text: plural(t.code.extras, preserved.length, { lines: lines.slice(0, 12).join(', ') }) }));
			}
		}
		const engine = this.engine;
		if (engine.state !== 'idle') {
			this.findings.append(h('p', { class: 'sf-finding sf-finding-progress', text: engine.state === 'loading' ? t.pg.loading : t.pg.running }));
		} else if (engine.result) {
			const r = engine.result;
			if (r.ok) this.findings.append(h('p', { class: 'sf-finding sf-finding-ok', text: plural(t.pg.ok, r.tables) }));
			else if (r.timeout) this.findings.append(h('p', { class: 'sf-finding sf-finding-error', text: t.pg.timeout }));
			else if (r.stopped) this.findings.append(h('p', { class: 'sf-finding sf-finding-info', text: t.pg.stopped }));
			else if (r.failed) this.findings.append(h('p', { class: 'sf-finding sf-finding-error', text: t.pg.failed }));
			else {
				const box = h('div', { class: 'sf-finding sf-finding-error sf-engine' });
				const position = r.position !== null ? lineCol(engine.text, r.position - 1) : null;
				box.append(h('span', { class: 'sf-finding-text', text: position ? fill(t.pg.error, position) : t.pg.errorNoPosition }), h('code', { class: 'sf-engine-message', text: r.message }));
				if (r.hint) box.append(h('span', { class: 'sf-finding-text', text: fill(t.pg.hint, { hint: r.hint }) }));
				this.findings.append(box);
			}
		}
		this.findings.hidden = this.findings.childElementCount === 0;
		this.actions.replaceChildren();
		if (state === 'synced') {
			this.actions.append(h('p', { class: 'sf-dock-hint', text: t.code.syncedHint }));
		} else {
			if (this.diagramChanged) this.actions.append(h('p', { class: 'sf-dock-warning', text: t.code.diagramChanged }));
			const blocking = this.result ? this.result.issues.filter((i) => i.blocking).length : 0;
			const tooLarge = text.length > LIMITS.code;
			const apply = h('button', { type: 'button', class: 'sf-btn sf-btn-primary', disabled: state === 'applying' || blocking > 0 || tooLarge ? true : null });
			apply.append(icon('check', 14), h('span', { text: t.code.apply }));
			apply.addEventListener('click', () => void this.apply());
			const discard = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.code.discard, disabled: state === 'applying' ? true : null });
			discard.addEventListener('click', () => this.discard());
			const row = h('div', { class: 'sf-dock-buttons' }, apply, discard);
			this.actions.append(row);
			if (blocking > 0) this.actions.append(h('p', { class: 'sf-dock-blocked', text: plural(t.code.applyBlocked, blocking) }));
		}
		if (this.dialect === 'postgres') {
			const running = engine.state !== 'idle';
			const test = h('button', { type: 'button', class: 'sf-btn sf-btn-test', 'data-tip': t.pg.testTip, disabled: !text.trim() && !running ? true : null });
			test.append(icon(running ? 'stop' : 'play', 13), h('span', { text: running ? t.pg.stop : t.pg.test }));
			test.addEventListener('click', () => void this.testEngine());
			this.actions.append(test);
		}
	}
}
