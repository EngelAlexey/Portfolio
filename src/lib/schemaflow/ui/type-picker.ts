import { sameType } from '../model/ops';
import type { DialectId, LogicalType } from '../model/types';
import { clearChildren, h } from './dom';
import { fill, type Strings } from './strings';
import { choiceLabel, parseTypeText, renderType, searchTypes, TYPE_CHOICES, type TypeChoice } from './types';

export interface TypePickerOptions {
	input: HTMLInputElement;
	strings: Strings;
	overlay: HTMLElement;
	dialect: () => DialectId;
	onPick?: () => void;
}

type Entry = { kind: 'typed'; type: LogicalType; text: string } | { kind: 'choice'; choice: TypeChoice } | { kind: 'more' };

export class TypePicker {
	private list: HTMLElement | null = null;
	private entries: Entry[] = [];
	private active = -1;
	private dirty = false;
	private expanded = false;
	private picked: LogicalType | null = null;
	private readonly listId = `sf-types-${Math.random().toString(36).slice(2, 8)}`;
	private readonly follow = () => this.place();

	constructor(private readonly options: TypePickerOptions) {
		options.input.addEventListener('input', () => {
			this.dirty = true;
			this.active = -1;
			this.picked = null;
			this.open();
		});
	}

	get isOpen(): boolean {
		return this.list !== null;
	}

	open(): void {
		const { input, overlay, strings } = this.options;
		if (!this.list) {
			this.list = h('div', { class: 'sf-typelist', role: 'listbox', id: this.listId, 'aria-label': strings.types.label });
			this.list.addEventListener('pointerdown', (event) => event.preventDefault());
			overlay.append(this.list);
			input.setAttribute('role', 'combobox');
			input.setAttribute('aria-controls', this.listId);
			input.setAttribute('aria-autocomplete', 'list');
			document.addEventListener('scroll', this.follow, true);
			window.addEventListener('resize', this.follow);
		}
		input.setAttribute('aria-expanded', 'true');
		this.render();
	}

	close(): void {
		if (!this.list) return;
		this.list.remove();
		this.list = null;
		document.removeEventListener('scroll', this.follow, true);
		window.removeEventListener('resize', this.follow);
		this.options.input.setAttribute('aria-expanded', 'false');
		this.options.input.removeAttribute('aria-activedescendant');
	}

	handleKey(event: KeyboardEvent): boolean {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!this.list) this.open();
			const count = this.entries.length;
			if (count === 0) return true;
			const next = event.key === 'ArrowDown' ? this.active + 1 : this.active < 0 ? count - 1 : this.active - 1;
			this.active = (next + count) % count;
			this.render();
			this.list?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
			return true;
		}
		if (event.key === 'Enter' && this.list && this.entries[this.active]?.kind === 'more') {
			event.preventDefault();
			this.toggle();
			return true;
		}
		return false;
	}

	resolve(mode: 'enter' | 'blur'): LogicalType | null {
		if (this.picked) return this.picked;
		const entry = this.entries[this.active];
		if (entry?.kind === 'typed') return entry.type;
		if (entry?.kind === 'choice') return entry.choice.type;
		const { input, strings } = this.options;
		const dialect = this.options.dialect();
		const raw = input.value.trim();
		if (!raw) return null;
		const typed = parseTypeText(raw, dialect);
		const matches = searchTypes(raw, (id) => choiceLabel(strings, id), dialect);
		if (typed && (typed.kind !== 'raw' || matches.length === 0)) return typed;
		return mode === 'enter' ? (matches[0]?.type ?? null) : null;
	}

	private query(): string {
		return this.dirty ? this.options.input.value.trim() : '';
	}

	private build(): Entry[] {
		const { strings } = this.options;
		const dialect = this.options.dialect();
		const query = this.query();
		const entries: Entry[] = [];
		if (!query) {
			for (const choice of TYPE_CHOICES) {
				if (choice.common || this.expanded) entries.push({ kind: 'choice', choice });
			}
			entries.push({ kind: 'more' });
			return entries;
		}
		const matches = searchTypes(query, (id) => choiceLabel(strings, id), dialect);
		const typed = parseTypeText(query, dialect);
		if (typed && (typed.kind !== 'raw' || matches.length === 0) && !matches.some((choice) => sameType(choice.type, typed))) {
			entries.push({ kind: 'typed', type: typed, text: query });
		}
		for (const choice of matches) entries.push({ kind: 'choice', choice });
		return entries;
	}

	private toggle(): void {
		this.expanded = !this.expanded;
		this.entries = this.build();
		this.active = this.entries.findIndex((entry) => entry.kind === 'more');
		this.render();
	}

	private pick(type: LogicalType): void {
		this.picked = type;
		this.options.onPick?.();
	}

	private render(): void {
		const list = this.list;
		if (!list) return;
		const t = this.options.strings.types;
		this.entries = this.build();
		if (this.active >= this.entries.length) this.active = -1;
		clearChildren(list);
		if (this.entries.length === 0) list.append(h('div', { class: 'sf-typelist-empty', role: 'presentation', text: fill(t.none, { q: this.query() }) }));
		const grouped = this.expanded && !this.query();
		let group = '';
		this.entries.forEach((entry, index) => {
			if (grouped && entry.kind === 'choice' && !entry.choice.common && entry.choice.group !== group) {
				group = entry.choice.group;
				list.append(h('div', { class: 'sf-typelist-group', role: 'presentation', text: t.groups[entry.choice.group] }));
			}
			list.append(this.row(entry, index));
		});
		const input = this.options.input;
		if (this.active >= 0) input.setAttribute('aria-activedescendant', `${this.listId}-${this.active}`);
		else input.removeAttribute('aria-activedescendant');
		this.place();
	}

	private row(entry: Entry, index: number): HTMLElement {
		const { strings } = this.options;
		const t = strings.types;
		const active = index === this.active;
		const attrs = { class: `sf-typelist-item${active ? ' is-active' : ''}`, role: 'option', id: `${this.listId}-${index}`, 'aria-selected': active ? 'true' : 'false' };
		if (entry.kind === 'more') {
			const more = h('div', { ...attrs, class: `${attrs.class} sf-typelist-more`, 'aria-expanded': String(this.expanded) }, h('span', { text: this.expanded ? t.less : t.more }));
			more.addEventListener('pointerdown', (event) => {
				event.preventDefault();
				this.toggle();
			});
			return more;
		}
		const type = entry.kind === 'typed' ? entry.type : entry.choice.type;
		const name = entry.kind === 'typed' ? fill(t.use, { text: entry.text }) : choiceLabel(strings, entry.choice.id);
		const hint = entry.kind === 'choice' ? t.choices[entry.choice.id].hint : '';
		const main = h('span', { class: 'sf-typelist-main' }, h('span', { class: 'sf-typelist-name', text: name }), hint ? h('span', { class: 'sf-typelist-hint', text: hint }) : null);
		const row = h('div', attrs, main, h('span', { class: 'sf-typelist-native', text: renderType(type, this.options.dialect()) }));
		row.addEventListener('pointerdown', (event) => {
			event.preventDefault();
			this.pick(type);
		});
		return row;
	}

	private place(): void {
		const list = this.list;
		if (!list) return;
		const rect = this.options.input.getBoundingClientRect();
		list.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - list.offsetWidth - 8))}px`;
		const height = list.offsetHeight;
		const below = rect.bottom + 4 + height <= window.innerHeight - 8;
		list.style.top = `${below ? rect.bottom + 4 : Math.max(8, rect.top - height - 4)}px`;
	}
}
