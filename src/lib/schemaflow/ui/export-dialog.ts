import { DIALECT_LABELS } from '../dialects';
import { FORMATS, formatInfo, type ExportFormat } from '../export';
import { SQL_DIALECTS, type DialectId, type Schema, type SqlDialectId } from '../model/types';
import { copyText, download, h, icon } from './dom';
import { fill, type Strings } from './strings';
import { createToolDialog, type ToolDialog } from './tool-dialog';

export interface ExportHost {
	schema(): Schema;
	dialect(): DialectId;
	fileBase(): string;
}

export class ExportDialog {
	private readonly frame: ToolDialog;
	private readonly chips: HTMLElement;
	private readonly select: HTMLSelectElement;
	private readonly note: HTMLElement;
	private readonly warning: HTMLElement;
	private readonly code: HTMLPreElement;
	private readonly status: HTMLElement;
	private readonly copyButton: HTMLButtonElement;
	private readonly downloadButton: HTMLButtonElement;
	private format: ExportFormat = 'prisma';
	private dialect: SqlDialectId = 'postgres';
	private statusTimer: ReturnType<typeof setTimeout> | undefined;
	private text = '';

	constructor(
		private readonly strings: Strings,
		private readonly host: ExportHost
	) {
		const t = strings.exportCode;
		this.chips = h('div', { class: 'sf-chips', role: 'group', 'aria-label': t.format });
		for (const info of FORMATS) {
			const chip = h('button', { type: 'button', class: 'sf-chip-btn', 'data-format': info.id, 'aria-pressed': 'false', text: info.label });
			chip.addEventListener('click', () => {
				this.format = info.id;
				this.render();
			});
			this.chips.append(chip);
		}
		this.select = h('select', { class: 'sf-select', id: 'sf-export-dialect', 'aria-label': t.dialect });
		for (const dialect of SQL_DIALECTS) this.select.append(h('option', { value: dialect, text: DIALECT_LABELS[dialect] }));
		this.select.addEventListener('change', () => {
			this.dialect = this.select.value as SqlDialectId;
			this.render();
		});
		const row = h('div', { class: 'sf-tool-row' }, this.chips, h('label', { class: 'sr-only', for: 'sf-export-dialect', text: t.dialect }), this.select);
		this.note = h('p', { class: 'sf-help' });
		this.warning = h('p', { class: 'sf-conflict', hidden: true });
		const tools = h('div', { class: 'sf-gallery-tools' }, row, this.note, this.warning);
		this.code = h('pre', { class: 'sf-outcode', tabindex: '0', 'aria-label': t.title });
		const scroller = h('div', { class: 'sf-gallery-scroll' }, this.code);
		this.status = h('span', { class: 'sf-tool-status', role: 'status' });
		this.copyButton = h('button', { type: 'button', class: 'sf-btn sf-btn-primary' });
		this.copyButton.append(icon('copy', 14), h('span', { text: t.copy }));
		this.copyButton.addEventListener('click', () => void this.copy());
		this.downloadButton = h('button', { type: 'button', class: 'sf-btn' });
		this.downloadButton.append(icon('download', 14), h('span', { class: 'sf-download-label' }));
		this.downloadButton.addEventListener('click', () => this.download());
		const foot = h('div', { class: 'sf-tool-foot' }, this.status, h('span', { class: 'sf-spacer' }), this.downloadButton, this.copyButton);
		this.frame = createToolDialog({ id: 'sf-export', title: t.title, closeLabel: strings.close, className: 'sf-export' }, tools, scroller, foot);
	}

	open(): void {
		const current = this.host.dialect();
		this.dialect = current === 'mongodb' ? 'postgres' : current;
		this.select.value = this.dialect;
		this.render();
		this.frame.open();
		this.chips.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
	}

	private render(): void {
		const t = this.strings.exportCode;
		const info = formatInfo(this.format);
		for (const chip of this.chips.querySelectorAll<HTMLButtonElement>('button')) chip.setAttribute('aria-pressed', String(chip.dataset.format === this.format));
		this.note.textContent = t.notes[this.format];
		const schema = this.host.schema();
		const supported = info.dialects.includes(this.dialect);
		const file = info.file(this.host.fileBase());
		this.warning.hidden = supported;
		this.warning.textContent = supported ? '' : fill(t.unsupported, { format: info.label, dialect: DIALECT_LABELS[this.dialect] });
		this.text = schema.tables.length === 0 || !supported ? '' : info.run(schema, this.dialect);
		this.code.textContent = this.text || (schema.tables.length === 0 ? t.empty : '');
		this.code.classList.toggle('is-empty', !this.text);
		const label = this.downloadButton.querySelector('.sf-download-label');
		if (label) label.textContent = fill(t.download, { file });
		this.downloadButton.disabled = !this.text;
		this.copyButton.disabled = !this.text;
		this.say('');
	}

	private say(text: string): void {
		clearTimeout(this.statusTimer);
		this.status.textContent = text;
		if (text) this.statusTimer = setTimeout(() => (this.status.textContent = ''), 2500);
	}

	private async copy(): Promise<void> {
		const t = this.strings;
		this.say((await copyText(this.text)) ? t.exportCode.copied : t.copyFailed);
	}

	private download(): void {
		const info = formatInfo(this.format);
		const file = info.file(this.host.fileBase());
		download(file, this.text, `${info.mime};charset=utf-8`);
		this.say(fill(this.strings.exportCode.downloaded, { file }));
	}
}
