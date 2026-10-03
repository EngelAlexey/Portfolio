import { autoLayout } from '../model/layout';
import { bounds } from '../model/ops';
import { CARD_WIDTH, tableHeight, type Schema } from '../model/types';
import { parseSql } from '../parse/sql-parse';
import { loadTemplates, type TemplateEntry } from '../templates/template';
import { h, icon, s } from './dom';
import { fill, plural, type Strings } from './strings';

interface Prepared {
	entry: TemplateEntry;
	schema: Schema;
	search: string;
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function layoutTemplate(sql: string): Schema {
	const schema = parseSql('postgres', sql).schema;
	const positions = autoLayout(schema);
	return { ...schema, tables: schema.tables.map((t) => ({ ...t, ...(positions.get(t.id) ?? {}) })) };
}

function thumbnail(schema: Schema): SVGSVGElement {
	const box = bounds(schema) ?? { left: 0, top: 0, right: 100, bottom: 100 };
	const pad = 24;
	const svg = s('svg', { class: 'sf-thumb', viewBox: `${box.left - pad} ${box.top - pad} ${box.right - box.left + pad * 2} ${box.bottom - box.top + pad * 2}`, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
	const tables = new Map(schema.tables.map((t) => [t.id, t]));
	for (const r of schema.relations) {
		const a = tables.get(r.fromTable);
		const b = tables.get(r.toTable);
		if (!a || !b) continue;
		const ax = a.x + CARD_WIDTH / 2;
		const bx = b.x + CARD_WIDTH / 2;
		svg.append(s('line', { class: 'sf-thumb-edge', x1: ax < bx ? a.x + CARD_WIDTH : a.x, y1: a.y + 40, x2: ax < bx ? b.x : b.x + CARD_WIDTH, y2: b.y + 40 }));
	}
	for (const t of schema.tables) {
		const height = tableHeight(t);
		svg.append(s('rect', { class: 'sf-thumb-table', x: t.x, y: t.y, width: CARD_WIDTH, height, rx: 10 }));
		svg.append(s('rect', { class: 'sf-thumb-head', x: t.x, y: t.y, width: CARD_WIDTH, height: 44, rx: 10 }));
		for (let i = 0; i < Math.min(t.columns.length, 8); i++) {
			svg.append(s('rect', { class: 'sf-thumb-row', x: t.x + 20, y: t.y + 60 + i * 28, width: CARD_WIDTH * (0.35 + ((i * 37) % 40) / 100), height: 8, rx: 4 }));
		}
	}
	return svg;
}

export class Gallery {
	private dialog: HTMLDialogElement;
	private search: HTMLInputElement;
	private chips: HTMLElement;
	private grid: HTMLElement;
	private count: HTMLElement;
	private footer: HTMLElement;
	private prepared: Prepared[] | null = null;
	private tag = '';
	private returnFocus: HTMLElement | null = null;

	constructor(
		private readonly strings: Strings,
		private readonly lang: 'es' | 'en',
		private readonly onUse: (schema: Schema, name: string) => void,
		private readonly hasDesign: () => boolean
	) {
		const t = strings;
		this.dialog = h('dialog', { class: 'sf-gallery', 'aria-labelledby': 'sf-gallery-title' }) as HTMLDialogElement;
		const head = h('div', { class: 'sf-gallery-head' });
		const close = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': t.close, 'data-tip': t.close });
		close.append(icon('close', 16));
		close.addEventListener('click', () => this.close());
		head.append(h('h2', { id: 'sf-gallery-title', class: 'sf-gallery-title', text: t.gallery.title }), close);
		const tools = h('div', { class: 'sf-gallery-tools' });
		const searchWrap = h('div', { class: 'sf-search' });
		this.search = h('input', { type: 'search', class: 'sf-input', id: 'sf-gallery-search', placeholder: t.gallery.searchPlaceholder, autocomplete: 'off' });
		searchWrap.append(h('label', { class: 'sr-only', for: 'sf-gallery-search', text: t.gallery.search }), icon('search', 15), this.search);
		this.chips = h('div', { class: 'sf-chips', role: 'group', 'aria-label': t.gallery.filter });
		tools.append(searchWrap, this.chips);
		this.count = h('p', { class: 'sf-gallery-count', role: 'status' });
		this.grid = h('ul', { class: 'sf-gallery-grid', role: 'list' });
		const scroller = h('div', { class: 'sf-gallery-scroll' }, this.count, this.grid);
		this.footer = h('p', { class: 'sf-gallery-foot', text: t.gallery.replaceNote });
		this.dialog.append(head, tools, scroller, this.footer);
		document.body.append(this.dialog);
		this.search.addEventListener('input', () => this.renderGrid());
		this.search.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				this.cards()[0]?.focus();
			}
		});
		this.dialog.addEventListener('close', () => {
			if (this.returnFocus?.isConnected) this.returnFocus.focus();
		});
		this.dialog.addEventListener('click', (event) => {
			if (event.target === this.dialog) this.close();
		});
		this.grid.addEventListener('keydown', (event) => this.onGridKey(event));
	}

	private cards(): HTMLButtonElement[] {
		return [...this.grid.querySelectorAll<HTMLButtonElement>('.sf-template')];
	}

	async open(): Promise<void> {
		this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		this.footer.hidden = !this.hasDesign();
		if (!this.dialog.open) this.dialog.showModal();
		this.search.focus();
		if (!this.prepared) {
			this.count.textContent = this.strings.gallery.loading;
			try {
				const entries = await loadTemplates();
				this.prepared = entries.map((entry) => {
					const schema = layoutTemplate(entry.sql);
					const search = fold([entry.name[this.lang], entry.description[this.lang], ...entry.tags[this.lang], ...schema.tables.map((t) => t.name)].join(' '));
					return { entry, schema, search };
				});
			} catch {
				this.count.textContent = this.strings.gallery.failed;
				return;
			}
			this.renderChips();
		}
		this.renderGrid();
	}

	close(): void {
		if (this.dialog.open) this.dialog.close();
	}

	private renderChips(): void {
		const t = this.strings;
		const tags = [...new Set((this.prepared ?? []).flatMap((p) => p.entry.tags[this.lang]))].sort((a, b) => a.localeCompare(b, this.lang));
		this.chips.replaceChildren();
		for (const tag of ['', ...tags]) {
			const chip = h('button', { type: 'button', class: 'sf-chip-btn', 'aria-pressed': String(tag === this.tag), text: tag || t.gallery.all });
			chip.addEventListener('click', () => {
				this.tag = tag;
				for (const other of this.chips.querySelectorAll('button')) other.setAttribute('aria-pressed', String(other === chip));
				this.renderGrid();
			});
			this.chips.append(chip);
		}
	}

	private renderGrid(): void {
		const t = this.strings;
		const query = fold(this.search.value.trim());
		const list = (this.prepared ?? []).filter((p) => (!query || p.search.includes(query)) && (!this.tag || p.entry.tags[this.lang].includes(this.tag)));
		this.grid.replaceChildren();
		this.count.textContent = plural(t.count.templates, list.length);
		if (list.length === 0 && query) {
			const empty = h('li', { class: 'sf-gallery-empty' });
			const clear = h('button', { type: 'button', class: 'sf-btn', text: t.gallery.clear });
			clear.addEventListener('click', () => {
				this.search.value = '';
				this.renderGrid();
				this.search.focus();
			});
			empty.append(h('p', { text: fill(t.gallery.none, { q: this.search.value.trim() }) }), clear);
			this.grid.append(empty);
			return;
		}
		list.forEach((item, index) => {
			const counts = `${plural(t.count.tables, item.schema.tables.length)} · ${plural(t.count.relations, item.schema.relations.length)}`;
			const name = item.entry.name[this.lang];
			const description = item.entry.description[this.lang];
			const card = h('button', { type: 'button', class: 'sf-template', tabindex: index === 0 ? '0' : '-1', 'aria-label': fill(t.gallery.use, { name, description, counts }) });
			const preview = h('span', { class: 'sf-template-preview', 'aria-hidden': 'true' });
			preview.append(thumbnail(item.schema));
			const tags = h('span', { class: 'sf-template-tags', 'aria-hidden': 'true' });
			for (const tag of item.entry.tags[this.lang]) tags.append(h('span', { class: 'sf-tag', text: tag }));
			card.append(preview, h('span', { class: 'sf-template-name', text: name }), h('span', { class: 'sf-template-desc', text: description }), h('span', { class: 'sf-template-counts', text: counts }), tags);
			card.addEventListener('click', () => {
				this.close();
				this.onUse(item.schema, name);
			});
			this.grid.append(h('li', {}, card));
		});
	}

	private onGridKey(event: KeyboardEvent): void {
		const cards = this.cards();
		const at = cards.indexOf(document.activeElement as HTMLButtonElement);
		if (at === -1) return;
		const first = cards[0];
		const columns = first ? Math.max(1, Math.round(this.grid.clientWidth / (first.getBoundingClientRect().width + 12))) : 1;
		let next = at;
		if (event.key === 'ArrowRight') next = at + 1;
		else if (event.key === 'ArrowLeft') next = at - 1;
		else if (event.key === 'ArrowDown') next = at + columns;
		else if (event.key === 'ArrowUp') next = at - columns;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = cards.length - 1;
		else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
			this.search.focus();
			return;
		} else return;
		event.preventDefault();
		if (event.key === 'ArrowUp' && next < 0) {
			this.search.focus();
			return;
		}
		next = Math.max(0, Math.min(cards.length - 1, next));
		cards.forEach((card, i) => (card.tabIndex = i === next ? 0 : -1));
		cards[next]?.focus();
	}
}
