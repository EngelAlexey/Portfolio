import { DIALECT_LABELS } from '../dialects';
import { buildMigration, migrationWarnings, renderMigration, type Migration, type Warning } from '../dialects/migrate';
import { diffSchemas, type SchemaDiff } from '../model/diff';
import { clearBase, loadBase, saveBase } from '../model/storage';
import { SQL_DIALECTS, type DialectId, type Schema, type SqlDialectId } from '../model/types';
import type { CodeIssue } from '../parse/issues';
import { describeChanges } from './changes';
import { copyText, download, h, icon } from './dom';
import { readFile } from './io';
import { codeMessage } from './messages';
import { fill, plural, type Strings } from './strings';
import { createToolDialog, type ToolDialog } from './tool-dialog';

export interface MigrationHost {
	schema(): Schema;
	dialect(): DialectId;
	fileBase(): string;
}

type Source = 'saved' | 'paste' | 'file';
type Direction = 'up' | 'down';

export class MigrationDialog {
	private readonly frame: ToolDialog;
	private readonly sourceChips: HTMLElement;
	private readonly panel: HTMLElement;
	private readonly select: HTMLSelectElement;
	private readonly transaction: HTMLInputElement;
	private readonly mongoNote: HTMLElement;
	private readonly result: HTMLElement;
	private source: Source = 'saved';
	private direction: Direction = 'up';
	private dialect: SqlDialectId = 'postgres';
	private baseline: Schema | null = null;
	private pasted = '';
	private notice: { kind: 'info' | 'error'; text: string } | null = null;
	private text = '';

	constructor(
		private readonly strings: Strings,
		private readonly lang: 'es' | 'en',
		private readonly host: MigrationHost
	) {
		const t = strings.migration;
		this.sourceChips = h('div', { class: 'sf-chips', role: 'group', 'aria-label': t.source });
		for (const source of ['saved', 'paste', 'file'] as const) {
			const chip = h('button', { type: 'button', class: 'sf-chip-btn', 'data-source': source, 'aria-pressed': 'false', text: t.sources[source] });
			chip.addEventListener('click', () => this.chooseSource(source));
			this.sourceChips.append(chip);
		}
		this.panel = h('div', { class: 'sf-tool-panel' });
		this.select = h('select', { class: 'sf-select', id: 'sf-migration-dialect', 'aria-label': t.dialect });
		for (const dialect of SQL_DIALECTS) this.select.append(h('option', { value: dialect, text: DIALECT_LABELS[dialect] }));
		this.select.addEventListener('change', () => {
			this.dialect = this.select.value as SqlDialectId;
			this.baselineFromText();
			this.render();
		});
		this.transaction = h('input', { type: 'checkbox', checked: true });
		this.transaction.addEventListener('change', () => this.renderResult());
		const check = h('label', { class: 'sf-check' }, this.transaction, h('span', { text: t.transaction }));
		const controls = h('div', { class: 'sf-tool-row' }, h('label', { class: 'sf-tool-label', for: 'sf-migration-dialect', text: t.dialect }), this.select, check);
		this.mongoNote = h('p', { class: 'sf-help', text: t.mongoNote, hidden: true });
		this.result = h('div', { class: 'sf-tool-result', 'aria-live': 'polite' });
		const intro = h('p', { class: 'sf-help', text: t.intro });
		const tools = h('div', { class: 'sf-gallery-tools' }, intro, h('p', { class: 'sf-tool-label', text: t.source }), this.sourceChips, this.panel, controls, this.mongoNote);
		const scroller = h('div', { class: 'sf-gallery-scroll' }, this.result);
		this.frame = createToolDialog({ id: 'sf-migration', title: t.title, closeLabel: strings.close, className: 'sf-migration' }, tools, scroller);
	}

	open(): void {
		const current = this.host.dialect();
		this.dialect = current === 'mongodb' ? 'postgres' : current;
		this.select.value = this.dialect;
		this.mongoNote.hidden = current !== 'mongodb';
		this.source = 'saved';
		this.notice = null;
		this.baseline = loadBase()?.schema ?? null;
		this.render();
		this.frame.open();
		this.sourceChips.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
	}

	private chooseSource(source: Source): void {
		this.source = source;
		this.notice = null;
		this.baseline = source === 'saved' ? (loadBase()?.schema ?? null) : null;
		this.render();
	}

	private render(): void {
		for (const chip of this.sourceChips.querySelectorAll<HTMLButtonElement>('button')) chip.setAttribute('aria-pressed', String(chip.dataset.source === this.source));
		this.renderPanel();
		this.renderResult();
	}

	private renderPanel(): void {
		const t = this.strings.migration;
		this.panel.replaceChildren();
		if (this.source === 'saved') this.renderSaved();
		else if (this.source === 'paste') {
			const area = h('textarea', { class: 'sf-input sf-mono', id: 'sf-migration-sql', rows: '7', spellcheck: 'false', placeholder: t.paste.placeholder }) as HTMLTextAreaElement;
			area.value = this.pasted;
			area.addEventListener('input', () => (this.pasted = area.value));
			const use = h('button', { type: 'button', class: 'sf-btn sf-btn-primary', text: t.paste.use });
			use.addEventListener('click', () => void this.usePasted());
			this.panel.append(h('label', { class: 'sf-tool-label', for: 'sf-migration-sql', text: fill(t.paste.label, { dialect: DIALECT_LABELS[this.dialect] }) }), area, h('div', { class: 'sf-tool-row' }, use));
		} else {
			const input = h('input', { type: 'file', accept: '.json,.sql,.ddl,.txt', hidden: true }) as HTMLInputElement;
			const choose = h('button', { type: 'button', class: 'sf-btn sf-btn-primary', text: t.file.choose });
			choose.addEventListener('click', () => input.click());
			input.addEventListener('change', () => {
				const file = input.files?.[0];
				input.value = '';
				if (file) void this.useFile(file);
			});
			this.panel.append(h('div', { class: 'sf-tool-row' }, choose, input), h('p', { class: 'sf-help', text: t.file.hint }));
		}
		if (this.notice) this.panel.append(h('p', { class: this.notice.kind === 'error' ? 'sf-conflict' : 'sf-help', role: 'status', text: this.notice.text }));
	}

	private renderSaved(): void {
		const t = this.strings.migration;
		const saved = loadBase();
		const current = this.host.schema();
		if (saved) {
			const date = new Date(saved.savedAt).toLocaleString(this.lang === 'es' ? 'es' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
			this.panel.append(h('p', { class: 'sf-help', text: fill(t.saved.info, { name: saved.schema.name.trim() || this.strings.bar.untitled, date, tables: plural(this.strings.count.tables, saved.schema.tables.length) }) }));
		} else this.panel.append(h('p', { class: 'sf-help', text: t.saved.none }));
		const save = h('button', { type: 'button', class: 'sf-btn sf-btn-primary', text: saved ? t.saved.replace : t.saved.save, disabled: current.tables.length === 0 ? true : null });
		save.addEventListener('click', () => {
			if (!saveBase(current, this.host.dialect())) {
				this.notice = { kind: 'error', text: this.strings.bar.saveFailed };
			} else {
				this.baseline = current;
				this.notice = { kind: 'info', text: t.saved.saveDone };
			}
			this.render();
		});
		const row = h('div', { class: 'sf-tool-row' }, save);
		if (saved) {
			const clear = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.saved.clear });
			clear.addEventListener('click', () => {
				clearBase();
				this.baseline = null;
				this.notice = { kind: 'info', text: t.saved.cleared };
				this.render();
			});
			row.append(clear);
		}
		this.panel.append(row);
	}

	private async parse(text: string): Promise<{ schema: Schema } | { issues: CodeIssue[] }> {
		const { parseCode, hasBlocking } = await import('../parse');
		const result = parseCode(this.dialect, text);
		if (hasBlocking(result.issues)) return { issues: result.issues.filter((i) => i.blocking) };
		return { schema: result.schema };
	}

	private failure(issues: CodeIssue[], fallback: string): void {
		const t = this.strings.migration;
		const first = issues[0];
		const detail = first ? codeMessage(this.strings.engine, this.lang, this.dialect, first) : '';
		this.baseline = null;
		this.notice = { kind: 'error', text: issues.length > 0 ? plural(t.paste.errors, issues.length, { first: detail }) : fallback };
	}

	private baselineFromText(): void {
		if (this.source === 'paste' && this.baseline) void this.usePasted();
	}

	private async usePasted(): Promise<void> {
		const t = this.strings.migration;
		if (!this.pasted.trim()) {
			this.baseline = null;
			this.notice = { kind: 'error', text: t.paste.empty };
			this.render();
			return;
		}
		const parsed = await this.parse(this.pasted);
		if ('schema' in parsed) {
			this.baseline = parsed.schema;
			this.notice = null;
		} else this.failure(parsed.issues, t.paste.empty);
		this.render();
	}

	private async useFile(file: File): Promise<void> {
		const t = this.strings.migration;
		const opened = await readFile(file);
		if (opened.kind === 'error') {
			this.baseline = null;
			this.notice = { kind: 'error', text: t.file.invalid };
		} else if (opened.kind === 'schema') {
			this.baseline = opened.schema;
			this.notice = { kind: 'info', text: fill(t.file.loaded, { name: file.name }) };
		} else if (opened.dialect) {
			this.baseline = null;
			this.notice = { kind: 'error', text: t.file.invalid };
		} else {
			const parsed = await this.parse(opened.text);
			if ('schema' in parsed) {
				this.baseline = parsed.schema;
				this.notice = { kind: 'info', text: fill(t.file.loaded, { name: file.name }) };
			} else this.failure(parsed.issues, t.file.sqlErrors);
		}
		this.render();
	}

	private describe(warning: Warning): string {
		const t = this.strings.migration;
		return `${t.level[warning.level]}: ${fill(t.warnings[warning.code], { table: warning.table, column: warning.column ?? '' })}`;
	}

	private build(diff: SchemaDiff, direction: Direction): Migration {
		return buildMigration(this.dialect, direction === 'up' ? diff : diffSchemas(diff.after, diff.before));
	}

	private renderResult(): void {
		const t = this.strings.migration;
		this.result.replaceChildren();
		const baseline = this.baseline;
		this.text = '';
		this.transaction.disabled = this.dialect === 'mysql';
		if (!baseline) return;
		const diff = diffSchemas(baseline, this.host.schema());
		const items = describeChanges(diff, this.strings);
		const migration = this.build(diff, this.direction);
		const text = renderMigration(migration, { transaction: this.transaction.checked && this.dialect !== 'mysql', describe: (w) => this.describe(w) });
		if (items.length === 0 || (!text && this.direction === 'up')) {
			this.result.append(h('p', { class: 'sf-help', text: t.summary.none }));
			return;
		}
		this.text = text;
		this.result.append(h('h3', { class: 'sf-props-title', text: `${t.changesTitle} · ${plural(t.summary.some, items.length)}` }));
		const list = h('ul', { class: 'sf-changes' });
		const marks = { add: '+', drop: '−', change: '~' } as const;
		for (const item of items) list.append(h('li', { class: `sf-change sf-change-${item.kind}` }, h('span', { class: 'sf-change-mark', 'aria-hidden': 'true', text: marks[item.kind] }), h('span', { text: item.text })));
		this.result.append(list);
		const renameLike = diff.tablesAdded.length > 0 && diff.tablesDropped.length > 0 ? true : diff.tables.some((d) => d.columnsAdded.length > 0 && d.columnsDropped.length > 0);
		if (this.source !== 'saved' && renameLike) this.result.append(h('p', { class: 'sf-help', text: t.renameNote }));

		const tabs = h('div', { class: 'sf-chips', role: 'group', 'aria-label': `${t.up} / ${t.down}` });
		for (const direction of ['up', 'down'] as const) {
			const chip = h('button', { type: 'button', class: 'sf-chip-btn', 'aria-pressed': String(direction === this.direction), text: t[direction] });
			chip.addEventListener('click', () => {
				this.direction = direction;
				this.renderResult();
			});
			tabs.append(chip);
		}
		this.result.append(tabs);

		const warnings = migrationWarnings(migration).sort((a, b) => (a.level === b.level ? 0 : a.level === 'danger' ? -1 : 1));
		const seen = new Set<string>();
		const warnList = h('ul', { class: 'sf-warns' });
		for (const warning of warnings) {
			const line = this.describe(warning);
			if (seen.has(line)) continue;
			seen.add(line);
			warnList.append(h('li', { class: `sf-warn sf-warn-${warning.level}` }, icon(warning.level === 'danger' ? 'error' : 'warning', 14), h('span', { text: line })));
		}
		if (seen.size > 0) this.result.append(h('h3', { class: 'sf-props-title', text: t.warningsTitle }), warnList);

		this.result.append(h('pre', { class: 'sf-outcode', tabindex: '0', 'aria-label': t[this.direction], text: text || t.summary.none }));
		if (this.direction === 'down') this.result.append(h('p', { class: 'sf-help', text: t.downNote }));
		if (this.dialect === 'mysql') this.result.append(h('p', { class: 'sf-help', text: t.transactionMysql }));
		if (this.dialect === 'sqlserver' && text.includes('\nGO\n')) this.result.append(h('p', { class: 'sf-help', text: t.transactionSqlServer }));

		const file = `${this.host.fileBase()}.${this.direction}.sql`;
		const status = h('span', { class: 'sf-tool-status', role: 'status' });
		const copy = h('button', { type: 'button', class: 'sf-btn sf-btn-primary' }, icon('copy', 14), h('span', { text: t.copy }));
		copy.addEventListener('click', async () => {
			status.textContent = (await copyText(this.text)) ? t.copied : this.strings.copyFailed;
		});
		const save = h('button', { type: 'button', class: 'sf-btn' }, icon('download', 14), h('span', { text: fill(t.download, { file }) }));
		save.addEventListener('click', () => {
			download(file, this.text, 'application/sql;charset=utf-8');
			status.textContent = fill(t.downloaded, { file });
		});
		this.result.append(h('div', { class: 'sf-tool-foot' }, status, h('span', { class: 'sf-spacer' }), save, copy));
	}
}
