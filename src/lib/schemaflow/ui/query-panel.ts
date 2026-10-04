import type { EngineResult, QueryOutput } from '../validate/pglite';
import { h, icon } from './dom';
import { fill, plural, type Strings } from './strings';

type Engine = typeof import('../validate/pglite');

const READY_MS = 100;
const SLOW_MS = 250;

export class QueryPanel {
	private readonly root: HTMLDetailsElement;
	private readonly area: HTMLTextAreaElement;
	private readonly run: HTMLButtonElement;
	private readonly output: HTMLElement;
	private abort: AbortController | null = null;
	private engine: Engine | null = null;

	constructor(
		private readonly strings: Strings,
		private readonly getDdl: () => string
	) {
		const t = strings.pg.query;
		this.root = h('details', { class: 'sf-query', hidden: true }) as HTMLDetailsElement;
		this.root.addEventListener('toggle', () => {
			if (!this.root.open) this.engine?.releasePostgres();
		});
		this.area = h('textarea', { class: 'sf-input sf-mono', id: 'sf-query-text', rows: '4', spellcheck: 'false', placeholder: t.placeholder }) as HTMLTextAreaElement;
		this.area.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				void this.execute();
			}
		});
		this.run = h('button', { type: 'button', class: 'sf-btn sf-btn-test' });
		this.run.addEventListener('click', () => void this.execute());
		this.output = h('div', { class: 'sf-query-output', 'aria-live': 'polite' });
		const body = h('div', { class: 'sf-query-body' }, h('p', { class: 'sf-help', text: t.help }), h('p', { class: 'sf-help', text: t.download }), h('label', { class: 'sr-only', for: 'sf-query-text', text: t.label }), this.area, h('div', { class: 'sf-tool-row' }, this.run), this.output);
		this.root.append(h('summary', {}, h('span', { text: t.summary })), body);
		this.paintButton(false);
	}

	get element(): HTMLElement {
		return this.root;
	}

	setVisible(visible: boolean): void {
		this.root.hidden = !visible;
		if (!visible) this.engine?.releasePostgres();
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
		const query = this.area.value;
		if (!query.trim()) {
			this.say(t.query.empty, 'info');
			return;
		}
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
			this.show(result);
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

	private show(result: EngineResult): void {
		const t = this.strings.pg;
		if (!result.ok) {
			if (result.timeout) this.say(t.timeout, 'error');
			else if (result.stopped) this.say(t.stopped, 'info');
			else if (result.failed) this.say(t.failed, 'error');
			else {
				const box = h('div', { class: 'sf-finding sf-finding-error sf-engine' });
				box.append(h('span', { class: 'sf-finding-text', text: result.stage === 'query' ? t.query.queryError : t.query.schemaError }), h('code', { class: 'sf-engine-message', text: result.message }));
				if (result.hint) box.append(h('span', { class: 'sf-finding-text', text: fill(t.hint, { hint: result.hint }) }));
				this.output.replaceChildren(box);
			}
			return;
		}
		const out = result.query;
		if (!out) return;
		const nodes: HTMLElement[] = [];
		if (result.timings) nodes.push(h('p', { class: 'sf-help', text: fill(result.timings.boot < READY_MS ? t.query.timingReady : t.query.timing, { ...result.timings }) }));
		nodes.push(out.fields.length > 0 ? this.table(out) : h('p', { class: 'sf-finding sf-finding-ok', text: plural(t.query.affected, out.affected) }));
		this.output.replaceChildren(...nodes);
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
