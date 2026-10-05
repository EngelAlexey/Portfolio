import { h, icon, s } from './dom';
import { COLUMN_PRESETS, itemKey, matchesQuery, RELATION_KINDS, searchText, type PaletteItem } from './elements';
import type { RelationKind } from '../model/relate';
import { fill, plural, type Strings } from './strings';
import { choiceLabel, TYPE_BY_ID } from './types';

export type { ColumnPreset, PaletteItem } from './elements';

export const TIMESTAMP_COLUMNS = ['created_at', 'updated_at'] as const;

export interface PaletteHost {
	strings: Strings;
	drag(item: PaletteItem, event: PointerEvent): void;
	activate(item: PaletteItem): void;
	toggled(open: boolean): void;
}

interface Entry {
	item: PaletteItem;
	el: HTMLButtonElement;
	text: string;
}

function tableThumb(rows = 1): SVGSVGElement {
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
	private readonly entries: Entry[] = [];
	private readonly sections: HTMLElement[] = [];
	private input!: HTMLInputElement;
	private empty!: HTMLElement;
	private status!: HTMLElement;

	constructor(
		private readonly host: PaletteHost,
		private readonly el: HTMLElement,
		open: boolean,
		private readonly sheet = false
	) {
		this.open = sheet || open;
		this.build();
	}

	get isOpen(): boolean {
		return this.open;
	}

	focusSearch(): void {
		this.input.focus();
	}

	reset(): void {
		this.input.value = '';
		this.filter();
	}

	private build(): void {
		const t = this.host.strings.palette;
		const body = h('div', { class: 'sf-palette-body', id: this.sheet ? 'sf-elements-body' : 'sf-palette-body' });
		body.append(h('p', { class: 'sf-palette-hint', text: this.sheet ? t.sheetHint : t.hint }), this.searchBox());

		const tables = this.group(t.groups.tables, 'sf-palette-grid');
		tables.grid.append(this.item({ kind: 'table' }, [tableThumb(), h('span', { class: 'sf-palette-label', text: t.table.label })], t.table.label, t.table.tip, 'sf-palette-tile sf-palette-tile-wide', [t.table.label, t.groups.tables]));

		const columns = this.group(t.groups.columns, 'sf-palette-grid sf-palette-grid-2');
		for (const preset of COLUMN_PRESETS) {
			const name = preset === 'timestamps' ? t.columns.timestamps : choiceLabel(this.host.strings, preset);
			const hint = preset === 'timestamps' ? TIMESTAMP_COLUMNS.join(', ') : TYPE_BY_ID[preset].sql;
			columns.grid.append(
				this.item(
					{ kind: 'column', preset },
					[h('span', { class: 'sf-palette-label', text: name }), h('span', { class: 'sf-palette-type', text: hint })],
					fill(t.columnLabel, { name }),
					t.columnTip,
					preset === 'timestamps' ? 'sf-palette-chip sf-palette-wide' : 'sf-palette-chip',
					[name, hint, t.groups.columns]
				)
			);
		}

		const relations = this.group(t.groups.relations, 'sf-palette-grid sf-palette-grid-3');
		for (const relation of RELATION_KINDS) {
			const info = t.relations[relation];
			relations.grid.append(
				this.item({ kind: 'relation', relation }, [relationGlyph(relation), h('span', { class: 'sf-palette-label', text: info.label })], info.name, relation === 'manyToMany' ? t.manyTip : fill(t.relationTip, { name: info.name }), 'sf-palette-tile', [info.label, info.name, t.groups.relations])
			);
		}

		const notes = this.group(t.groups.notes, 'sf-palette-grid sf-palette-grid-2');
		const bar = this.host.strings.bar;
		notes.grid.append(
			this.item({ kind: 'note' }, [icon('note', 15), h('span', { class: 'sf-palette-label', text: bar.note })], bar.note, bar.noteTip, 'sf-palette-chip sf-palette-row', [bar.note, t.groups.notes]),
			this.item({ kind: 'area' }, [icon('area', 15), h('span', { class: 'sf-palette-label', text: bar.area })], bar.area, bar.areaTip, 'sf-palette-chip sf-palette-row', [bar.area, t.groups.notes])
		);

		this.empty = h('p', { class: 'sf-palette-empty', text: t.noResults, hidden: true });
		this.status = h('p', { class: 'sr-only', role: 'status' });
		body.append(...[tables, columns, relations, notes].map((group) => group.section), this.empty, this.status);

		if (this.sheet) {
			this.el.replaceChildren(body);
			return;
		}
		const toggle = h('button', { type: 'button', class: 'sf-palette-toggle', 'aria-expanded': String(this.open), 'aria-controls': 'sf-palette-body' });
		toggle.append(icon('shapes', 15), h('span', { class: 'sf-palette-title', text: t.title }), icon('chevron', 14));
		toggle.addEventListener('click', () => this.setOpen(!this.open));
		this.el.replaceChildren(toggle, body);
		this.sync();
	}

	private searchBox(): HTMLElement {
		const t = this.host.strings.palette;
		const id = this.sheet ? 'sf-elements-search' : 'sf-palette-search';
		const wrap = h('div', { class: 'sf-search sf-palette-search' });
		this.input = h('input', { type: 'search', class: 'sf-input', id, placeholder: t.search, autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'go' });
		wrap.append(h('label', { class: 'sr-only', for: id, text: t.search }), icon('search', 15), this.input);
		this.input.addEventListener('input', () => this.filter());
		this.input.addEventListener('keydown', (event) => {
			const first = this.entries.find((entry) => !entry.el.hidden);
			if (event.key === 'Enter' && first) {
				event.preventDefault();
				this.host.activate(first.item);
			} else if (event.key === 'ArrowDown' && first) {
				event.preventDefault();
				first.el.focus();
			} else if (event.key === 'Escape' && this.input.value) {
				event.preventDefault();
				event.stopPropagation();
				this.reset();
			}
		});
		return wrap;
	}

	private filter(): void {
		const t = this.host.strings;
		const query = this.input.value;
		let count = 0;
		for (const entry of this.entries) {
			const match = matchesQuery(query, entry.text);
			entry.el.hidden = !match;
			if (match) count++;
		}
		for (const section of this.sections) section.hidden = !section.querySelector('.sf-palette-item:not([hidden])');
		this.empty.hidden = count > 0;
		this.status.textContent = query.trim() && count > 0 ? plural(t.count.items, count) : '';
	}

	private group(title: string, gridClass: string): { section: HTMLElement; grid: HTMLElement } {
		const section = h('section', { class: 'sf-palette-group' });
		const grid = h('div', { class: gridClass, role: 'group', 'aria-label': title });
		section.append(h('h3', { class: 'sf-palette-group-title', text: title }), grid);
		this.sections.push(section);
		return { section, grid };
	}

	private item(item: PaletteItem, content: Node[], label: string, tip: string, className: string, words: string[]): HTMLButtonElement {
		const button = h('button', { type: 'button', class: `sf-palette-item ${className}`, 'aria-label': label, 'data-tip': tip, 'data-item': item.kind });
		button.append(...content);
		let dragged = false;
		if (!this.sheet) {
			button.addEventListener('pointerdown', (event) => {
				if (event.button !== 0 || event.pointerType === 'touch') return;
				event.preventDefault();
				dragged = true;
				window.addEventListener('pointerup', () => setTimeout(() => (dragged = false), 0), { once: true });
				this.host.drag(item, event);
			});
		}
		button.addEventListener('click', () => {
			if (dragged) {
				dragged = false;
				return;
			}
			this.host.activate(item);
		});
		this.entries.push({ item, el: button, text: searchText(itemKey(item), ...words) });
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
