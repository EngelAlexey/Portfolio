import { h, icon, s } from './dom';
import { fill, type Strings } from './strings';
import { choiceLabel, TYPE_BY_ID, type CommonTypeId } from './types';

export type TablePreset = 'basic' | 'timestamps' | 'lookup';
export type ColumnPreset = CommonTypeId | 'timestamps';
export type RelationKind = 'oneToMany' | 'oneToOne' | 'manyToMany';

export type PaletteItem =
	| { kind: 'table'; preset: TablePreset }
	| { kind: 'column'; preset: ColumnPreset }
	| { kind: 'relation'; relation: RelationKind }
	| { kind: 'note' }
	| { kind: 'area' };

export const TIMESTAMP_COLUMNS = ['created_at', 'updated_at'] as const;

const TABLE_ROWS: Record<TablePreset, number> = { basic: 1, timestamps: 3, lookup: 2 };

export interface PaletteHost {
	strings: Strings;
	drag(item: PaletteItem, event: PointerEvent): void;
	activate(item: PaletteItem, keyboard: boolean): void;
	toggled(open: boolean): void;
}

function tableThumb(rows: number): SVGSVGElement {
	const height = 12 + rows * 7 + 3;
	const svg = s('svg', { class: 'sf-palette-thumb', width: 46, height, viewBox: `0 0 46 ${height}`, 'aria-hidden': 'true' });
	svg.append(s('rect', { class: 'sf-thumb-card', x: 0.5, y: 0.5, width: 45, height: height - 1, rx: 3 }), s('rect', { class: 'sf-thumb-head', x: 0.5, y: 0.5, width: 45, height: 10, rx: 3 }));
	for (let i = 0; i < rows; i++) {
		const y = 16 + i * 7;
		svg.append(s('path', { class: i === 0 ? 'sf-thumb-key' : 'sf-thumb-row', d: `M 6 ${y} H ${i === 0 ? 16 : 26} M 30 ${y} H 40` }));
	}
	return svg;
}

function relationGlyph(kind: RelationKind): SVGSVGElement {
	const svg = s('svg', { class: 'sf-palette-glyph', width: 46, height: 16, viewBox: '0 0 46 16', 'aria-hidden': 'true' });
	const one = (x: number) => `M ${x} 3 V 13 M ${x + 4} 3 V 13`;
	const many = (x: number, dir: 1 | -1) => `M ${x} 8 L ${x + 8 * dir} 2 M ${x} 8 L ${x + 8 * dir} 14 M ${x + 8 * dir - 2 * dir} 3 V 13`;
	const ends = {
		oneToMany: [one(5), many(41, -1)],
		oneToOne: [one(5), one(37)],
		manyToMany: [many(5, 1), many(41, -1)]
	}[kind];
	svg.append(s('path', { class: 'sf-glyph-line', d: 'M 4 8 H 42' }), ...ends.map((d) => s('path', { class: 'sf-glyph-end', d })));
	return svg;
}

export class Palette {
	private open: boolean;

	constructor(
		private readonly host: PaletteHost,
		private readonly el: HTMLElement,
		open: boolean
	) {
		this.open = open;
		this.build();
	}

	get isOpen(): boolean {
		return this.open;
	}

	private build(): void {
		const t = this.host.strings.palette;
		const toggle = h('button', { type: 'button', class: 'sf-palette-toggle', 'aria-expanded': String(this.open), 'aria-controls': 'sf-palette-body' });
		toggle.append(icon('shapes', 15), h('span', { class: 'sf-palette-title', text: t.title }), icon('chevron', 14));
		toggle.addEventListener('click', () => this.setOpen(!this.open));
		const body = h('div', { class: 'sf-palette-body', id: 'sf-palette-body' });
		body.append(h('p', { class: 'sf-palette-hint', text: t.hint }));

		const tables = this.group(t.groups.tables, 'sf-palette-grid sf-palette-grid-3');
		for (const preset of ['basic', 'timestamps', 'lookup'] as const) {
			const label = t.tables[preset];
			tables.append(this.item({ kind: 'table', preset }, [tableThumb(TABLE_ROWS[preset]), h('span', { class: 'sf-palette-label', text: label.label })], label.label, label.tip, 'sf-palette-tile'));
		}

		const columns = this.group(t.groups.columns, 'sf-palette-grid sf-palette-grid-2');
		for (const preset of ['text', 'longText', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'uuid', 'json', 'timestamps'] as const) {
			const name = preset === 'timestamps' ? t.columns.timestamps : choiceLabel(this.host.strings, preset);
			const hint = preset === 'timestamps' ? TIMESTAMP_COLUMNS.join(', ') : TYPE_BY_ID[preset].sql;
			columns.append(
				this.item(
					{ kind: 'column', preset },
					[h('span', { class: 'sf-palette-label', text: name }), h('span', { class: 'sf-palette-type', text: hint })],
					fill(t.columnLabel, { name }),
					t.columnTip,
					preset === 'timestamps' ? 'sf-palette-chip sf-palette-wide' : 'sf-palette-chip'
				)
			);
		}

		const relations = this.group(t.groups.relations, 'sf-palette-grid sf-palette-grid-3');
		for (const relation of ['oneToMany', 'oneToOne', 'manyToMany'] as const) {
			const info = t.relations[relation];
			relations.append(
				this.item({ kind: 'relation', relation }, [relationGlyph(relation), h('span', { class: 'sf-palette-label', text: info.label })], info.name, relation === 'manyToMany' ? t.manyTip : fill(t.relationTip, { name: info.name }), 'sf-palette-tile')
			);
		}

		const notes = this.group(t.groups.notes, 'sf-palette-grid sf-palette-grid-2');
		const bar = this.host.strings.bar;
		notes.append(
			this.item({ kind: 'note' }, [icon('note', 15), h('span', { class: 'sf-palette-label', text: bar.note })], bar.note, bar.noteTip, 'sf-palette-chip sf-palette-row'),
			this.item({ kind: 'area' }, [icon('area', 15), h('span', { class: 'sf-palette-label', text: bar.area })], bar.area, bar.areaTip, 'sf-palette-chip sf-palette-row')
		);

		for (const grid of [tables, columns, relations, notes]) body.append(grid.parentElement as HTMLElement);
		this.el.replaceChildren(toggle, body);
		this.sync();
	}

	private group(title: string, gridClass: string): HTMLElement {
		const section = h('section', { class: 'sf-palette-group' });
		const grid = h('div', { class: gridClass, role: 'group', 'aria-label': title });
		section.append(h('h3', { class: 'sf-palette-group-title', text: title }), grid);
		return grid;
	}

	private item(item: PaletteItem, content: Node[], label: string, tip: string, className: string): HTMLButtonElement {
		const button = h('button', { type: 'button', class: `sf-palette-item ${className}`, 'aria-label': label, 'data-tip': tip, 'data-item': item.kind });
		button.append(...content);
		let dragged = false;
		button.addEventListener('pointerdown', (event) => {
			if (event.button !== 0 || event.pointerType === 'touch') return;
			event.preventDefault();
			dragged = true;
			window.addEventListener('pointerup', () => setTimeout(() => (dragged = false), 0), { once: true });
			this.host.drag(item, event);
		});
		button.addEventListener('click', (event) => {
			if (dragged) {
				dragged = false;
				return;
			}
			this.host.activate(item, event.detail === 0);
		});
		return button as HTMLButtonElement;
	}

	setOpen(open: boolean): void {
		if (open === this.open) return;
		this.open = open;
		this.sync();
		this.host.toggled(open);
	}

	private sync(): void {
		const t = this.host.strings.palette;
		this.el.classList.toggle('is-collapsed', !this.open);
		const toggle = this.el.querySelector<HTMLButtonElement>('.sf-palette-toggle');
		toggle?.setAttribute('aria-expanded', String(this.open));
		if (toggle) toggle.dataset.tip = this.open ? t.hide : t.show;
		const body = this.el.querySelector<HTMLElement>('.sf-palette-body');
		if (body) body.hidden = !this.open;
	}
}
