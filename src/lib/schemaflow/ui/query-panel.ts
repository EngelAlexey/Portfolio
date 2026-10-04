import type { SQLNamespace } from '@codemirror/lang-sql';
import { quote } from '../dialects/names';
import type { Schema } from '../model/types';
import type { EngineResult, QueryOutput } from '../validate/pglite';
import type { QueryEditor } from './code-editor';
import { h, icon } from './dom';
import { buildSnippets, sampleScript, SNIPPET_GROUPS, type Snippet } from './query-snippets';
import type { SampleLang } from './sample-rows';
import type { Store } from './store';
import { fill, plural, type Strings } from './strings';

type Engine = typeof import('../validate/pglite');

const READY_MS = 100;
const SLOW_MS = 250;

function namespace(schema: Schema): SQLNamespace {
	return Object.fromEntries(schema.tables.map((table) => [table.name, table.columns.map((column) => column.name)]));
}

export class QueryPanel {
	private readonly root: HTMLDetailsElement;
	private readonly area: HTMLTextAreaElement;
	private readonly editorHost: HTMLElement;
	private readonly tableSelect: HTMLSelectElement;
	private readonly snippetSelect: HTMLSelectElement;
	private readonly run: HTMLButtonElement;
	private readonly output: HTMLElement;
	private abort: AbortController | null = null;
	private engine: Engine | null = null;
	private editor: QueryEditor | null = null;
	private upgrading = false;
	private marked = false;
	private snippets: Snippet[] = [];

	constructor(
		private readonly strings: Strings,
		private readonly store: Store,
		private readonly lang: SampleLang,
		private readonly getDdl: () => string
	) {
		const t = strings.pg.query;
		this.root = h('details', { class: 'sf-query', hidden: true }) as HTMLDetailsElement;
		this.root.addEventListener('toggle', () => {
			if (this.root.open) void this.upgrade();
			else this.engine?.releasePostgres();
		});
		this.area = h('textarea', { class: 'sf-input sf-mono', id: 'sf-query-text', rows: '4', spellcheck: 'false', 'aria-label': t.label }) as HTMLTextAreaElement;
		this.area.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				void this.execute();
			}
		});
		this.area.addEventListener('input', () => this.clearMarks());
		this.editorHost = h('div', { class: 'sf-query-editor' }, this.area);
		this.tableSelect = h('select', { class: 'sf-select', id: 'sf-query-table' }) as HTMLSelectElement;
		this.tableSelect.addEventListener('change', () => this.rebuild());
		this.snippetSelect = h('select', { class: 'sf-select', id: 'sf-query-snippet' }) as HTMLSelectElement;
		this.snippetSelect.addEventListener('change', () => this.choose());
		const tools = h('div', { class: 'sf-query-tools' }, this.field(t.tableLabel, this.tableSelect), this.field(t.snippetLabel, this.snippetSelect));
		this.run = h('button', { type: 'button', class: 'sf-btn sf-btn-test' });
		this.run.addEventListener('click', () => void this.execute());
		const clear = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.clear });
		clear.addEventListener('click', () => {
			this.put('');
			this.clearMarks();
			this.output.replaceChildren();
			this.focus();
		});
		this.output = h('div', { class: 'sf-query-output', 'aria-live': 'polite' });
		const body = h('div', { class: 'sf-query-body' }, h('p', { class: 'sf-help', text: t.help }), h('p', { class: 'sf-help', text: t.download }), tools, this.editorHost, h('div', { class: 'sf-tool-row' }, this.run, clear), this.output);
		this.root.append(h('summary', {}, h('span', { text: t.summary })), body);
		this.paintButton(false);
		store.on('schema', () => this.refresh());
		store.on('selection', () => this.follow());
		this.refresh();
	}

	get element(): HTMLElement {
		return this.root;
	}

	setVisible(visible: boolean): void {
		this.root.hidden = !visible;
		if (!visible) this.engine?.releasePostgres();
	}

	refresh(): void {
		const schema = this.store.schema;
		const selected = this.store.selection.tables;
		const wanted = selected.length === 1 ? selected[0] : this.tableSelect.value;
		this.tableSelect.replaceChildren(...schema.tables.map((table) => h('option', { value: table.id, text: table.name })));
		this.tableSelect.value = schema.tables.some((table) => table.id === wanted) ? (wanted ?? '') : (schema.tables[0]?.id ?? '');
		this.tableSelect.disabled = schema.tables.length === 0;
		this.rebuild();
		this.editor?.setSchema(namespace(schema));
	}

	private follow(): void {
		const selected = this.store.selection.tables;
		const id = selected.length === 1 ? selected[0] : undefined;
		if (id === undefined || id === this.tableSelect.value || !this.store.schema.tables.some((table) => table.id === id)) return;
		this.tableSelect.value = id;
		this.rebuild();
	}

	private field(label: string, control: HTMLElement): HTMLElement {
		return h('div', { class: 'sf-query-field' }, h('label', { class: 'sf-label', for: control.id, text: label }), control);
	}

	private rebuild(): void {
		const t = this.strings.pg.query;
		const schema = this.store.schema;
		this.snippets = buildSnippets(schema, this.tableSelect.value, t.snippets, this.lang);
		this.snippetSelect.replaceChildren(h('option', { value: '', text: this.snippets.length > 0 ? t.snippetPick : t.snippetNone }));
		for (const group of SNIPPET_GROUPS) {
			const items = this.snippets.filter((snippet) => snippet.group === group);
			if (items.length > 0) this.snippetSelect.append(h('optgroup', { label: t.snippets.groups[group] }, ...items.map((snippet) => h('option', { value: snippet.id, text: snippet.label }))));
		}
		this.snippetSelect.disabled = this.snippets.length === 0;
		this.snippetSelect.value = '';
		const table = schema.tables.find((candidate) => candidate.id === this.tableSelect.value);
		const hint = table ? `SELECT * FROM ${quote('postgres', table.name)};` : 'SELECT 1;';
		this.area.placeholder = hint;
		this.editor?.setPlaceholder(hint);
	}

	private choose(): void {
		const snippet = this.snippets.find((candidate) => candidate.id === this.snippetSelect.value);
		this.snippetSelect.value = '';
		if (!snippet) return;
		const current = this.text().replace(/\s+$/, '');
		this.put(current ? `${current}\n\n${snippet.sql}` : snippet.sql);
		this.clearMarks();
		this.focus();
	}

	private async upgrade(): Promise<void> {
		if (this.editor || this.upgrading) return;
		this.upgrading = true;
		try {
			const { createQueryEditor } = await import('./code-editor');
			this.editor = createQueryEditor(this.editorHost, {
				value: this.area.value,
				label: this.strings.pg.query.label,
				placeholder: this.area.placeholder,
				schema: namespace(this.store.schema),
				onChange: () => this.clearMarks(),
				onRun: () => void this.execute()
			});
			this.area.hidden = true;
		} catch {
			this.editor = null;
		} finally {
			this.upgrading = false;
		}
	}

	private text(): string {
		return this.editor ? this.editor.getValue() : this.area.value;
	}

	private put(text: string): void {
		if (this.editor) this.editor.setValue(text);
		else this.area.value = text;
	}

	private focus(): void {
		if (this.editor) this.editor.focus();
		else {
			this.area.focus();
			this.area.setSelectionRange(this.area.value.length, this.area.value.length);
		}
	}

	private clearMarks(): void {
		if (!this.marked) return;
		this.marked = false;
		this.editor?.setDiagnostics([]);
	}

	private mark(position: number | null, message: string): void {
		if (!this.editor || position === null) return;
		const text = this.text();
		const from = Math.max(0, Math.min(position - 1, text.length));
		let to = from;
		while (to < text.length && /[\w."$]/.test(text.charAt(to))) to++;
		this.editor.setDiagnostics([{ from, to: Math.max(to, from + 1), severity: 'error', message }]);
		this.marked = true;
	}

	private paintButton(running: boolean): void {
		const t = this.strings.pg.query;
		this.run.replaceChildren(icon(running ? 'stop' : 'play', 13), h('span', { text: running ? t.stop : t.run }));
	}

	private async execute(): Promise<void> {
		const t = this.strings.pg;
		if (this.abort) {
			this.abort.abort();
			return;
		}
		const query = this.text();
		if (!query.trim()) {
			this.say(t.query.empty, 'info');
			return;
		}
		this.clearMarks();
		const abort = new AbortController();
		this.abort = abort;
		this.paintButton(true);
		let slow: ReturnType<typeof setTimeout> | undefined;
		try {
			const engine = (this.engine ??= await import('../validate/pglite'));
			const warm = engine.isPostgresWarm();
			if (!warm) this.say(t.loading, 'progress');
			const result = await engine.runPostgres(this.getDdl(), {
				query,
				signal: abort.signal,
				onRunning: () => {
					if (warm) slow = setTimeout(() => this.say(t.running, 'progress'), SLOW_MS);
					else this.say(t.running, 'progress');
				}
			});
			this.show(result, query);
		} catch {
			this.say(t.failed, 'error');
		} finally {
			clearTimeout(slow);
			this.abort = null;
			this.paintButton(false);
		}
	}

	private say(text: string, kind: 'info' | 'progress' | 'error'): void {
		this.output.replaceChildren(h('p', { class: `sf-finding sf-finding-${kind}`, text }));
	}

	private show(result: EngineResult, query: string): void {
		const t = this.strings.pg;
		if (!result.ok) {
			if (result.timeout) this.say(t.timeout, 'error');
			else if (result.stopped) this.say(t.stopped, 'info');
			else if (result.failed) this.say(t.failed, 'error');
			else {
				const friendly = result.stage === 'query' && result.code ? (t.query.errors as Record<string, string>)[result.code] : undefined;
				const box = h('div', { class: 'sf-finding sf-finding-error sf-engine' });
				box.append(h('span', { class: 'sf-finding-text', text: friendly ?? (result.stage === 'query' ? t.query.queryError : t.query.schemaError) }), h('code', { class: 'sf-engine-message', text: result.message }));
				if (result.hint) box.append(h('span', { class: 'sf-finding-text', text: fill(t.hint, { hint: result.hint }) }));
				this.output.replaceChildren(box);
				if (result.stage === 'query') this.mark(result.position, friendly ?? result.message);
			}
			return;
		}
		const out = result.query;
		if (!out) return;
		const nodes: HTMLElement[] = [];
		if (result.timings) nodes.push(h('p', { class: 'sf-help', text: fill(result.timings.boot < READY_MS ? t.query.timingReady : t.query.timing, { ...result.timings }) }));
		nodes.push(out.fields.length > 0 ? this.table(out) : h('p', { class: 'sf-finding sf-finding-ok', text: plural(t.query.affected, out.affected) }));
		if (out.fields.length > 0 && out.total === 0 && !/\binsert\b/i.test(query) && this.store.schema.tables.length > 0) nodes.push(this.sampleHint());
		this.output.replaceChildren(...nodes);
	}

	private sampleHint(): HTMLElement {
		const t = this.strings.pg.query;
		const add = h('button', { type: 'button', class: 'sf-btn', text: t.snippets.sampleAll });
		add.addEventListener('click', () => {
			const script = sampleScript(this.store.schema, null, t.snippets.sampleAll, t.snippets, this.lang);
			this.put(`${script}\n\n${this.text()}`.trimEnd());
			void this.execute();
		});
		return h('div', { class: 'sf-finding sf-finding-info sf-engine' }, h('span', { class: 'sf-finding-text', text: t.noRows }), add);
	}

	private table(out: QueryOutput): HTMLElement {
		const t = this.strings.pg.query;
		const head = h('tr', {}, ...out.fields.map((name) => h('th', { scope: 'col', text: name })));
		const body = out.rows.map((row) => h('tr', {}, ...row.map((value) => (value === null ? h('td', { class: 'is-null', text: 'NULL' }) : h('td', { text: value })))));
		const table = h('table', { class: 'sf-resulttable' }, h('thead', {}, head), h('tbody', {}, ...body));
		const wrap = h('div', { class: 'sf-resultwrap', tabindex: '0', role: 'region', 'aria-label': plural(t.rows, out.total) }, table);
		const nodes: HTMLElement[] = [h('p', { class: 'sf-help', text: plural(t.rows, out.total) }), wrap];
		if (out.total > out.rows.length) nodes.push(h('p', { class: 'sf-help', text: fill(t.truncated, { n: out.rows.length }) }));
		return h('div', { class: 'sf-query-result' }, ...nodes);
	}
}
