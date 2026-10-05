import { searchSchema, type SearchHit } from '../model/search';
import type { Schema } from '../model/types';
import { h, icon } from './dom';
import { fill, plural, type Strings } from './strings';
import { displayType } from './types';

export interface FinderHost {
	schema(): Schema;
	jump(hit: SearchHit): void;
}

export class Finder {
	private readonly dialog: HTMLDialogElement;
	private readonly input: HTMLInputElement;
	private readonly list: HTMLElement;
	private readonly none: HTMLElement;
	private readonly status: HTMLElement;
	private hits: SearchHit[] = [];
	private active = 0;
	private returnFocus: HTMLElement | null = null;

	constructor(
		private readonly strings: Strings,
		private readonly host: FinderHost
	) {
		const t = strings.finder;
		this.dialog = h('dialog', { class: 'sf-finder', 'aria-label': t.title }) as HTMLDialogElement;
		this.input = h('input', { type: 'text', class: 'sf-finder-input', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'sf-finder-list', 'aria-autocomplete': 'list', 'aria-label': t.label, placeholder: t.placeholder, autocomplete: 'off', spellcheck: 'false' });
		const field = h('div', { class: 'sf-finder-field' }, icon('search', 16), this.input);
		this.list = h('ul', { class: 'sf-finder-list', id: 'sf-finder-list', role: 'listbox', 'aria-label': t.title });
		this.none = h('p', { class: 'sf-finder-none', hidden: true });
		this.status = h('p', { class: 'sr-only', role: 'status' });
		this.dialog.append(field, this.list, this.none, this.status, h('p', { class: 'sf-finder-hint', text: t.hint }));
		document.body.append(this.dialog);
		this.input.addEventListener('input', () => this.refresh());
		this.input.addEventListener('keydown', (event) => this.onKey(event));
		this.list.addEventListener('click', (event) => {
			const item = (event.target as Element).closest<HTMLElement>('.sf-finder-item');
			if (item) this.choose(Number(item.dataset.index));
		});
		this.list.addEventListener('pointermove', (event) => {
			const item = (event.target as Element).closest<HTMLElement>('.sf-finder-item');
			const index = item ? Number(item.dataset.index) : -1;
			if (index >= 0 && index !== this.active) this.activate(index, false);
		});
		this.dialog.addEventListener('click', (event) => {
			if (event.target === this.dialog) this.close();
		});
		this.dialog.addEventListener('close', () => {
			if (this.returnFocus?.isConnected) this.returnFocus.focus();
			this.returnFocus = null;
		});
	}

	open(): void {
		if (!this.dialog.open) {
			this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			this.input.value = '';
			this.refresh();
			this.dialog.showModal();
		}
		this.input.focus();
		this.input.select();
	}

	close(): void {
		if (this.dialog.open) this.dialog.close();
	}

	private onKey(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (this.hits.length === 0) return;
			this.activate((this.active + (event.key === 'ArrowDown' ? 1 : -1) + this.hits.length) % this.hits.length, true);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			this.choose(this.active);
		}
	}

	private choose(index: number): void {
		const hit = this.hits[index];
		if (!hit) return;
		this.returnFocus = null;
		this.close();
		this.host.jump(hit);
	}

	private activate(index: number, scroll: boolean): void {
		const items = [...this.list.children] as HTMLElement[];
		items[this.active]?.setAttribute('aria-selected', 'false');
		this.active = index;
		const item = items[index];
		item?.setAttribute('aria-selected', 'true');
		this.input.setAttribute('aria-activedescendant', item?.id ?? '');
		if (scroll) item?.scrollIntoView({ block: 'nearest' });
	}

	private refresh(): void {
		const t = this.strings;
		const schema = this.host.schema();
		const query = this.input.value.trim();
		this.hits = searchSchema(schema, query);
		this.active = 0;
		this.list.replaceChildren();
		this.hits.forEach((hit, index) => {
			const table = schema.tables.find((candidate) => candidate.id === hit.table);
			if (!table) return;
			const item = h('li', { class: 'sf-finder-item', role: 'option', id: `sf-finder-option-${index}`, 'data-index': String(index), 'aria-selected': String(index === 0) });
			if (hit.kind === 'table') {
				item.append(icon('table', 15), h('span', { class: 'sf-finder-name', text: table.name }), h('span', { class: 'sf-finder-meta', text: plural(t.count.columns, table.columns.length) }));
			} else {
				const column = table.columns.find((candidate) => candidate.id === hit.column);
				if (!column) return;
				item.append(icon('column', 15), h('span', { class: 'sf-finder-name' }, h('span', { class: 'sf-finder-table', text: `${table.name}.` }), column.name), h('span', { class: 'sf-finder-meta', text: displayType(column.type) }));
			}
			this.list.append(item);
		});
		this.input.setAttribute('aria-activedescendant', this.hits.length > 0 ? 'sf-finder-option-0' : '');
		const empty = this.hits.length === 0;
		this.none.hidden = !empty;
		this.none.textContent = empty ? (query ? fill(t.finder.none, { query }) : t.finder.empty) : '';
		this.status.textContent = empty ? '' : plural(t.finder.results, this.hits.length);
	}
}
