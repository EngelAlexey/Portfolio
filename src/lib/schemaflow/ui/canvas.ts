import {
	addArea,
	addColumn,
	addNote,
	addTable,
	bounds,
	connectColumns,
	connectWithNewColumns,
	createJunction,
	deleteColumn,
	deleteSelection,
	duplicateTable,
	emptySelection,
	findTable,
	isUnique,
	moveColumn,
	moveSelection,
	referencedKey,
	renameTable,
	sameType,
	setOneToOne,
	setPrimaryKey,
	toggleUnique,
	updateArea,
	updateColumn,
	updateNote,
	updateTable,
	type Selection
} from '../model/ops';
import { CARD_WIDTH, COLORS, HEADER_HEIGHT, LIMITS, ROW_HEIGHT, tableHeight, type Area, type Column, type Note, type Relation, type Schema, type Table } from '../model/types';
import type { Severity } from '../parse/issues';
import { DIALECT_LABELS } from '../dialects';
import { h, icon, isTextField, mod, modLabel, prefersReducedMotion, s } from './dom';
import { edgeGeometry, rowCentre } from './geometry';
import { TIMESTAMP_COLUMNS, type ColumnPreset, type PaletteItem, type RelationKind, type TablePreset } from './palette';
import type { Bubble, Live, MenuItem, Menus, Toasts } from './popups';
import { isEmptySelection, type Store } from './store';
import { fill, plural, type Strings } from './strings';
import { TypePicker } from './type-picker';
import { choiceLabel, COMMON_TYPES, displayType } from './types';

export interface CanvasHost {
	strings: Strings;
	bubble: Bubble;
	menus: Menus;
	toasts: Toasts;
	live: Live;
	overlay: HTMLElement;
	commit(next: Schema, label: string, options?: { coalesce?: string; select?: Selection }): void;
	undo(): void;
	openRelationBubble(relationId: string, at: { x: number; y: number } | Element): void;
	openRelate(tableId: string, columnId?: string): void;
	openProperties(): void;
	openGlossary(term: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE', anchor: HTMLElement): void;
	sheetInset(): number;
	leftInset(): number;
	bottomInset(): number;
	toastUndo(text: string): void;
	afterRename(oldName: string): void;
}

type Edit =
	| { kind: 'table'; table: string }
	| { kind: 'column'; table: string; column: string; field: 'name' | 'type'; fresh: boolean }
	| { kind: 'note'; note: string }
	| { kind: 'area'; area: string };

type Drag =
	| { kind: 'pending'; startX: number; startY: number; pointer: number; target: 'move' | 'marquee' | 'edge'; relation?: string; clickSelect?: Selection; focus?: { table: string; column: string } | null; additive?: boolean; touch?: boolean }
	| { kind: 'move'; startX: number; startY: number; pointer: number; dx: number; dy: number }
	| { kind: 'pan'; startX: number; startY: number; pointer: number; viewX: number; viewY: number; moved: boolean; clear: boolean; menu?: HTMLElement }
	| { kind: 'marquee'; pointer: number; anchor: { x: number; y: number }; box: HTMLElement; base: Selection }
	| { kind: 'connect'; pointer: number; table: string; column: string; fromX: number; fromY: number; outcome: Outcome | null }
	| { kind: 'resize-note'; pointer: number; note: string; startX: number; startY: number; w: number; h: number }
	| { kind: 'resize-area'; pointer: number; area: string; corner: string; startX: number; startY: number; box: { x: number; y: number; w: number; h: number }; last?: { x: number; y: number; w: number; h: number } }
	| { kind: 'reorder'; pointer: number; table: string; column: string; startY: number; index: number; line: HTMLElement }
	| { kind: 'insert'; pointer: number; item: PaletteItem; startX: number; startY: number; ghost: HTMLElement | null; target: { table: string; index: number } | null; line: HTMLElement | null };

interface Outcome {
	valid: boolean;
	text: string;
	warning?: string;
	run?: () => void;
	highlight?: HTMLElement;
	warn?: boolean;
}

const COLOUR_TOKEN: Record<string, string> = {
	slate: 'neutral',
	blue: 'fullstack',
	violet: 'ia',
	teal: 'datos',
	amber: 'movil',
	red: 'seguridad',
	green: 'infra'
};


export class Canvas {
	private readonly cards = new Map<string, { el: HTMLElement; sig: string }>();
	private readonly notes = new Map<string, { el: HTMLElement; sig: string }>();
	private readonly areas = new Map<string, { el: HTMLElement; sig: string }>();
	private edit: Edit | null = null;
	private drag: Drag | null = null;
	private spaceDown = false;
	private tag: HTMLElement;
	private preview: SVGPathElement;
	private edgeLayer: SVGGElement;
	private flashRelation: string | null = null;
	private hoverTable: string | null = null;
	private pointers = new Map<number, { x: number; y: number }>();
	private pinch: { distance: number; zoom: number; cx: number; cy: number; x: number; y: number } | null = null;
	private longPress: ReturnType<typeof setTimeout> | undefined;
	private menuGuard = 0;
	private link: { relation: RelationKind; source: string | null; outcome: Outcome | null } | null = null;
	private dropHints = 0;
	private cancelHints = 0;
	private autoPan: { dx: number; dy: number } = { dx: 0, dy: 0 };
	private autoPanFrame = 0;
	private lastPointer: PointerEvent | null = null;
	private tableLevels = new Map<string, Severity>();
	private errorRelations = new Set<string>();

	constructor(
		private readonly store: Store,
		private readonly host: CanvasHost,
		private readonly root: HTMLElement,
		private readonly world: HTMLElement,
		private readonly cardLayer: HTMLElement,
		private readonly noteLayer: HTMLElement,
		private readonly areaLayer: HTMLElement,
		private readonly edgeSvg: SVGSVGElement,
		private readonly emptyState: HTMLElement,
		private readonly pill: HTMLElement,
		private readonly zoomLabel: HTMLElement
	) {
		this.edgeLayer = s('g', { class: 'sf-edges-layer' });
		this.preview = s('path', { class: 'sf-edge-preview', d: '' });
		this.edgeSvg.append(this.edgeLayer, this.preview);
		this.tag = h('div', { class: 'sf-connect-tag', hidden: true, 'aria-hidden': 'true' });
		document.body.append(this.tag);
		this.bind();
	}

	private get strings(): Strings {
		return this.host.strings;
	}

	private label(template: string, params: Record<string, string | number> = {}): string {
		return fill(template, params);
	}

	setFindings(levels: Map<string, Severity>, errors: Set<string>): void {
		this.tableLevels = levels;
		this.errorRelations = errors;
	}

	render(schema: Schema = this.store.schema): void {
		const selection = this.store.selection;
		const linkSource = this.link?.source;
		if (linkSource && !schema.tables.some((x) => x.id === linkSource)) {
			this.link = null;
			this.root.classList.remove('is-linking');
			this.preview.setAttribute('d', '');
			this.tag.hidden = true;
		}
		const selectedTables = new Set(selection.tables);
		const tableMap = new Map(schema.tables.map((t) => [t.id, t]));
		const fkColumns = new Map<string, Relation>();
		for (const r of schema.relations) for (const id of r.fromColumns) fkColumns.set(id, r);
		const relationCount = new Map<string, number>();
		for (const r of schema.relations) {
			relationCount.set(r.fromTable, (relationCount.get(r.fromTable) ?? 0) + 1);
			if (r.toTable !== r.fromTable) relationCount.set(r.toTable, (relationCount.get(r.toTable) ?? 0) + 1);
		}

		const seenAreas = new Set<string>();
		for (const area of schema.areas) {
			seenAreas.add(area.id);
			const selected = selection.areas.includes(area.id);
			const sig = JSON.stringify([area.title, area.color, area.w, area.h, selected, this.edit?.kind === 'area' && this.edit.area === area.id]);
			let entry = this.areas.get(area.id);
			if (!entry || entry.sig !== sig) {
				if (this.edit?.kind === 'area' && this.edit.area === area.id && entry) {
					entry.sig = sig;
				} else {
					const el = this.buildArea(area, selected);
					if (entry) entry.el.replaceWith(el);
					else this.areaLayer.append(el);
					entry = { el, sig };
					this.areas.set(area.id, entry);
				}
			}
			entry.el.style.transform = `translate(${area.x}px, ${area.y}px)`;
			entry.el.style.width = `${area.w}px`;
			entry.el.style.height = `${area.h}px`;
		}
		for (const [id, entry] of this.areas) if (!seenAreas.has(id)) {
			entry.el.remove();
			this.areas.delete(id);
		}

		const seenTables = new Set<string>();
		for (const table of schema.tables) {
			seenTables.add(table.id);
			const selected = selectedTables.has(table.id);
			const level = this.tableLevels.get(table.id) ?? '';
			const fk = table.columns.map((c) => {
				const r = fkColumns.get(c.id);
				if (!r) return '';
				const target = tableMap.get(r.toTable);
				const at = r.fromColumns.indexOf(c.id);
				const targetColumn = target?.columns.find((col) => col.id === r.toColumns[at]);
				return `${target?.name ?? ''}.${targetColumn?.name ?? ''}`;
			});
			const sig = JSON.stringify([table.name, table.color, table.columns, table.primaryKey, table.uniques.map((u) => u.columns), fk, level, selected, relationCount.get(table.id) ?? 0, this.store.dialect]);
			let entry = this.cards.get(table.id);
			const editing = (this.edit?.kind === 'table' || this.edit?.kind === 'column') && this.edit.table === table.id;
			if (!entry || (entry.sig !== sig && !editing)) {
				const focusInside = entry?.el.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
				const focusRow = focusInside?.closest<HTMLElement>('.sf-row')?.dataset.column;
				const focusCard = focusInside?.classList.contains('sf-card');
				const el = this.buildCard(table, { selected, level, fk, relations: relationCount.get(table.id) ?? 0 });
				if (entry) entry.el.replaceWith(el);
				else this.cardLayer.append(el);
				entry = { el, sig };
				this.cards.set(table.id, entry);
				if (focusRow) el.querySelector<HTMLElement>(`.sf-row[data-column="${focusRow}"]`)?.focus();
				else if (focusCard) el.focus();
			}
			entry.el.style.transform = `translate(${table.x}px, ${table.y}px)`;
			entry.el.classList.toggle('is-link-source', this.link?.source === table.id);
		}
		for (const [id, entry] of this.cards) if (!seenTables.has(id)) {
			entry.el.remove();
			this.cards.delete(id);
		}

		const seenNotes = new Set<string>();
		for (const note of schema.notes) {
			seenNotes.add(note.id);
			const selected = selection.notes.includes(note.id);
			const sig = JSON.stringify([note.text, note.color, note.w, note.h, selected]);
			let entry = this.notes.get(note.id);
			const editing = this.edit?.kind === 'note' && this.edit.note === note.id;
			if (!entry || (entry.sig !== sig && !editing)) {
				const el = this.buildNote(note, selected);
				if (entry) entry.el.replaceWith(el);
				else this.noteLayer.append(el);
				entry = { el, sig };
				this.notes.set(note.id, entry);
			}
			entry.el.style.transform = `translate(${note.x}px, ${note.y}px)`;
			entry.el.style.width = `${note.w}px`;
			entry.el.style.height = `${note.h}px`;
		}
		for (const [id, entry] of this.notes) if (!seenNotes.has(id)) {
			entry.el.remove();
			this.notes.delete(id);
		}

		this.renderEdges(schema);
		const empty = schema.tables.length === 0 && schema.notes.length === 0 && schema.areas.length === 0;
		this.emptyState.hidden = !empty;
		this.root.classList.toggle('sf-is-empty', empty);
		this.updatePill(schema);
	}

	private renderEdges(schema: Schema): void {
		const tables = new Map(schema.tables.map((t) => [t.id, t]));
		const fragment = document.createDocumentFragment();
		const selected = new Set(this.store.selection.relations);
		for (const relation of schema.relations) {
			const geometry = edgeGeometry(schema, relation, tables);
			if (!geometry) continue;
			const classes = ['sf-edge'];
			if (selected.has(relation.id) || this.flashRelation === relation.id) classes.push('is-selected');
			if (this.errorRelations.has(relation.id)) classes.push('has-error');
			if (this.hoverTable && (relation.fromTable === this.hoverTable || relation.toTable === this.hoverTable)) classes.push('is-hot');
			const g = s('g', { class: classes.join(' '), 'data-relation': relation.id });
			g.append(
				s('path', { class: 'sf-edge-hit', d: geometry.path }),
				s('path', { class: 'sf-edge-line', d: geometry.path }),
				s('path', { class: 'sf-edge-end', d: geometry.childEnd }),
				s('path', { class: 'sf-edge-end', d: geometry.parentEnd })
			);
			if (this.errorRelations.has(relation.id)) {
				const marker = s('g', { class: 'sf-edge-error', transform: `translate(${geometry.midX} ${geometry.midY})` });
				marker.append(s('circle', { r: 7 }), s('path', { d: 'M 0 -3.5 L 0 0.8 M 0 3.2 L 0 3.3' }));
				g.append(marker);
			}
			fragment.append(g);
		}
		this.edgeLayer.replaceChildren(fragment);
		const box = bounds(schema);
		const width = box ? box.right + 400 : 1;
		const height = box ? box.bottom + 400 : 1;
		this.edgeSvg.setAttribute('width', String(Math.max(1, width)));
		this.edgeSvg.setAttribute('height', String(Math.max(1, height)));
	}

	private updatePill(schema: Schema): void {
		const selection = this.store.selection;
		const count = selection.tables.length + selection.notes.length + selection.areas.length;
		this.pill.classList.toggle('is-hint', Boolean(this.link) || this.drag?.kind === 'connect');
		if (this.link) {
			this.pill.textContent = this.linkText();
			return;
		}
		if (this.drag?.kind === 'connect') {
			this.pill.textContent = this.strings.connect.hint;
			return;
		}
		if (count > 1) {
			this.pill.textContent = this.label(this.strings.canvas.selected, { items: plural(this.strings.count.items, count) });
			return;
		}
		this.pill.textContent = `${plural(this.strings.count.tables, schema.tables.length)} · ${plural(this.strings.count.relations, schema.relations.length)}`;
	}

	private colourClass(colour: string | undefined): string {
		return colour && COLOUR_TOKEN[colour] ? `sf-colour-${COLOUR_TOKEN[colour]}` : '';
	}

	private buildCard(table: Table, info: { selected: boolean; level: string; fk: string[]; relations: number }): HTMLElement {
		const t = this.strings;
		const columns = plural(t.count.columns, table.columns.length);
		let label = this.label(t.canvas.card, { name: table.name, columns, relations: plural(t.count.relations, info.relations) });
		const levelIssues = info.level ? this.label(t.canvas.cardIssues, { issues: t.engine.severity[info.level as Severity] }) : '';
		label += levelIssues;
		const card = h('div', {
			class: `sf-card ${this.colourClass(table.color)}${info.selected ? ' is-selected' : ''}`,
			role: 'group',
			'aria-roledescription': t.canvas.table,
			'aria-label': label,
			tabindex: '0',
			'data-table': table.id
		});
		const head = h('div', { class: 'sf-card-head' });
		const name = h('span', { class: 'sf-card-name', text: table.name, title: table.name });
		head.append(name);
		if (info.level) head.append(h('span', { class: `sf-dot sf-dot-${info.level}`, 'aria-hidden': 'true' }));
		head.append(h('span', { class: 'sf-card-count', text: columns }));
		const menu = h('button', { type: 'button', class: 'sf-card-menu', 'aria-label': this.label(t.canvas.tableMenu, { name: table.name }), 'data-tip': this.label(t.canvas.tableMenu, { name: table.name }), tabindex: '-1' });
		menu.append(icon('more', 16));
		head.append(menu);
		card.append(head);
		const list = h('ul', { class: 'sf-rows', role: 'list' });
		const focus = this.store.focusColumn?.table === table.id ? this.store.focusColumn.column : null;
		table.columns.forEach((column, index) => {
			const isPk = table.primaryKey.includes(column.id);
			const isFk = Boolean(info.fk[index]);
			const unique = isUnique(table, column.id);
			const typeText = displayType(column.type);
			let rowLabel = `${column.name}, ${typeText}`;
			if (isPk) rowLabel += t.canvas.rowPk;
			if (isFk) rowLabel += this.label(t.canvas.rowFk, { target: info.fk[index] ?? '' });
			if (column.nullable && !isPk) rowLabel += t.canvas.rowNull;
			const row = h('li', { class: 'sf-row', role: 'listitem', tabindex: focus === column.id || (!focus && index === 0) ? '0' : '-1', 'data-column': column.id, 'aria-label': rowLabel });
			const grip = h('span', { class: 'sf-grip', 'aria-hidden': 'true', title: this.label(t.canvas.grip, { name: column.name }) });
			grip.append(icon('grip', 12));
			const slot = h('span', { class: 'sf-badge-slot' });
			const term = isPk ? 'PRIMARY_KEY' : isFk ? 'FOREIGN_KEY' : unique ? 'UNIQUE' : null;
			if (term) {
				const text = isPk ? 'PK' : isFk ? 'FK' : 'UQ';
				const badge = h('button', { type: 'button', class: `sf-badge sf-badge-${text.toLowerCase()}`, text, tabindex: '-1', 'aria-label': this.label(t.glossary.explain, { term: t.glossary[term].term }), 'data-term': term });
				slot.append(badge);
			}
			const nameEl = h('span', { class: 'sf-col-name', text: column.name, title: column.name });
			const typeEl = h('span', { class: `sf-col-type${column.type.kind === 'raw' ? ' is-raw' : ''}` });
			typeEl.append(typeText);
			if (column.type.kind === 'raw') typeEl.title = this.label(t.canvas.rawType, { dialect: column.type.dialect });
			if (column.nullable && !isPk) typeEl.append(h('span', { class: 'sf-null', text: '?', 'aria-hidden': 'true' }));
			row.append(grip, slot, nameEl, typeEl);
			row.append(h('span', { class: 'sf-conn sf-conn-l', 'data-connector': 'l', 'aria-hidden': 'true', title: t.canvas.connector }));
			row.append(h('span', { class: 'sf-conn sf-conn-r', 'data-connector': 'r', 'aria-hidden': 'true', title: t.canvas.connector }));
			list.append(row);
		});
		if (info.selected) {
			const add = h('li', { class: 'sf-row sf-add', role: 'listitem' });
			const button = h('button', { type: 'button', class: 'sf-add-btn', 'data-add-column': '', disabled: table.columns.length >= LIMITS.columns ? true : null, title: table.columns.length >= LIMITS.columns ? t.canvas.limitColumns : null });
			button.append(icon('plus', 14), h('span', { text: t.canvas.addColumn }));
			add.append(button);
			list.append(add);
		}
		card.append(list);
		return card;
	}

	private buildNote(note: Note, selected: boolean): HTMLElement {
		const el = h('div', {
			class: `sf-note ${this.colourClass(note.color)}${selected ? ' is-selected' : ''}`,
			role: 'group',
			'aria-roledescription': this.strings.canvas.note,
			'aria-label': note.text.slice(0, 40) || this.strings.canvas.notePlaceholder,
			tabindex: '0',
			'data-note': note.id
		});
		const text = h('div', { class: 'sf-note-text', text: note.text });
		if (!note.text) text.dataset.placeholder = this.strings.canvas.notePlaceholder;
		el.append(text, h('span', { class: 'sf-note-resize', 'data-resize-note': '', 'aria-hidden': 'true' }));
		return el;
	}

	private buildArea(area: Area, selected: boolean): HTMLElement {
		const el = h('div', {
			class: `sf-area ${this.colourClass(area.color) || 'sf-colour-fullstack'}${selected ? ' is-selected' : ''}`,
			role: 'group',
			'aria-roledescription': this.strings.canvas.area,
			'aria-label': area.title || this.strings.canvas.newArea,
			'data-area': area.id
		});
		const title = h('div', { class: 'sf-area-title', tabindex: '0', 'data-area-title': '' });
		title.append(h('span', { class: 'sf-area-name', text: area.title || this.strings.canvas.newArea }));
		el.append(title);
		if (selected) for (const corner of ['nw', 'ne', 'sw', 'se']) el.append(h('span', { class: `sf-area-handle sf-${corner}`, 'data-corner': corner, 'aria-hidden': 'true' }));
		return el;
	}

	applyView(): void {
		const { zoom, x, y } = this.store.view;
		this.world.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
		this.root.style.setProperty('--sf-zoom', String(zoom));
		this.root.style.backgroundPosition = `${x}px ${y}px`;
		this.root.style.backgroundSize = `${22 * zoom}px ${22 * zoom}px`;
		this.zoomLabel.textContent = this.label(this.strings.canvas.zoomValue, { n: Math.round(zoom * 100) });
		this.host.bubble.reposition();
	}

	visibleRect(): { left: number; top: number; width: number; height: number } {
		const rect = this.root.getBoundingClientRect();
		const left = Math.min(this.host.leftInset(), Math.max(0, rect.width - 240));
		return { left, top: 0, width: Math.max(120, rect.width - this.host.sheetInset() - left), height: Math.max(120, rect.height - this.host.bottomInset()) };
	}

	screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
		const rect = this.root.getBoundingClientRect();
		const { zoom, x, y } = this.store.view;
		return { x: (clientX - rect.left - x) / zoom, y: (clientY - rect.top - y) / zoom };
	}

	centreWorld(): { x: number; y: number } {
		const visible = this.visibleRect();
		const rect = this.root.getBoundingClientRect();
		return this.screenToWorld(rect.left + visible.left + visible.width / 2, rect.top + visible.height / 2);
	}

	setZoom(next: number, cx?: number, cy?: number): void {
		const visible = this.visibleRect();
		const px = cx ?? visible.left + visible.width / 2;
		const py = cy ?? visible.height / 2;
		const { zoom, x, y } = this.store.view;
		const z = Math.min(2, Math.max(0.25, next));
		this.store.setView({ zoom: z, x: px - ((px - x) * z) / zoom, y: py - ((py - y) * z) / zoom });
	}

	fit(target?: { left: number; top: number; right: number; bottom: number } | null, animate = false): void {
		const box = target ?? bounds(this.store.schema);
		if (!box) {
			this.store.setView({ zoom: 1, x: 60, y: 60 });
			return;
		}
		const visible = this.visibleRect();
		const pad = 48;
		const width = Math.max(1, box.right - box.left);
		const height = Math.max(1, box.bottom - box.top);
		const zoom = Math.min(1.1, Math.max(0.25, Math.min((visible.width - pad * 2) / width, (visible.height - pad * 2) / height)));
		const next = { zoom, x: visible.left + (visible.width - width * zoom) / 2 - box.left * zoom, y: (visible.height - height * zoom) / 2 - box.top * zoom };
		this.animateView(next, animate);
	}

	private animateView(next: { zoom: number; x: number; y: number }, animate: boolean): void {
		if (!animate || prefersReducedMotion()) {
			this.store.setView(next);
			return;
		}
		const from = { ...this.store.view };
		const started = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - started) / 240);
			const e = 1 - Math.pow(1 - t, 3);
			this.store.setView({ zoom: from.zoom + (next.zoom - from.zoom) * e, x: from.x + (next.x - from.x) * e, y: from.y + (next.y - from.y) * e });
			if (t < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	frame(kind: 'table' | 'relation', id: string): void {
		const schema = this.store.schema;
		let box: { left: number; top: number; right: number; bottom: number } | null = null;
		if (kind === 'table') {
			const table = findTable(schema, id);
			if (table) box = { left: table.x, top: table.y, right: table.x + CARD_WIDTH, bottom: table.y + tableHeight(table) };
		} else {
			const relation = schema.relations.find((r) => r.id === id);
			const a = relation ? findTable(schema, relation.fromTable) : undefined;
			const b = relation ? findTable(schema, relation.toTable) : undefined;
			if (a && b) box = { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x) + CARD_WIDTH, bottom: Math.max(a.y + tableHeight(a), b.y + tableHeight(b)) };
		}
		if (!box) return;
		const { zoom, x, y } = this.store.view;
		const visible = this.visibleRect();
		const inside = box.left * zoom + x >= visible.left && box.right * zoom + x <= visible.left + visible.width && box.top * zoom + y >= 0 && box.bottom * zoom + y <= visible.height;
		if (!inside) {
			const width = box.right - box.left;
			const height = box.bottom - box.top;
			const z = Math.min(zoom, Math.max(0.25, Math.min((visible.width - 96) / width, (visible.height - 96) / height)));
			this.animateView({ zoom: z, x: visible.left + (visible.width - width * z) / 2 - box.left * z, y: (visible.height - height * z) / 2 - box.top * z }, true);
		}
		const el = kind === 'table' ? this.cards.get(id)?.el : null;
		if (el && !prefersReducedMotion()) {
			el.classList.remove('is-pulsing');
			void el.offsetWidth;
			el.classList.add('is-pulsing');
		}
	}

	ensureVisible(tableId: string): void {
		const table = findTable(this.store.schema, tableId);
		if (!table) return;
		const { zoom, x, y } = this.store.view;
		const visible = this.visibleRect();
		const left = table.x * zoom + x;
		const right = (table.x + CARD_WIDTH) * zoom + x;
		const top = table.y * zoom + y;
		const bottom = (table.y + tableHeight(table)) * zoom + y;
		let dx = 0;
		let dy = 0;
		if (right > visible.left + visible.width - 24) dx = visible.left + visible.width - 24 - right;
		if (left + dx < visible.left + 24) dx = visible.left + 24 - left;
		if (bottom > visible.height - 24) dy = visible.height - 24 - bottom;
		if (top + dy < 24) dy = 24 - top;
		if (dx || dy) this.animateView({ zoom, x: x + dx, y: y + dy }, true);
	}

	flash(relationId: string): void {
		this.flashRelation = relationId;
		this.renderEdges(this.store.schema);
		setTimeout(() => {
			this.flashRelation = null;
			this.renderEdges(this.store.schema);
		}, 600);
	}

	focusTable(tableId: string): void {
		this.cards.get(tableId)?.el.focus();
	}

	cardElement(tableId: string): HTMLElement | undefined {
		return this.cards.get(tableId)?.el;
	}

	private freeSpot(x: number, y: number, w = CARD_WIDTH, hgt = 120): { x: number; y: number } {
		const schema = this.store.schema;
		let px = Math.round(x / 8) * 8;
		let py = Math.round(y / 8) * 8;
		for (let i = 0; i < 40; i++) {
			const hit = schema.tables.some((t) => px < t.x + CARD_WIDTH && t.x < px + w && py < t.y + tableHeight(t) && t.y < py + hgt);
			if (!hit) break;
			px += 32;
			py += 32;
		}
		return { x: px, y: py };
	}

	createTable(at?: { x: number; y: number }, centre = true, preset: TablePreset = 'basic'): string {
		const t = this.strings;
		if (this.store.schema.tables.length >= LIMITS.tables) {
			this.host.toasts.show(t.canvas.limitTables);
			return '';
		}
		const point = at ?? this.centreWorld();
		const spot = at && !centre ? { x: Math.round(point.x / 8) * 8, y: Math.round(point.y / 8) * 8 } : this.freeSpot(point.x - CARD_WIDTH / 2, point.y - 40);
		const result = addTable(this.store.schema, { name: t.canvas.newTable, x: spot.x, y: spot.y });
		const schema = this.applyTablePreset(result.schema, result.tableId, preset);
		const table = findTable(schema, result.tableId);
		this.host.commit(schema, this.label(t.history.createTable, { x: table?.name ?? '' }), { select: { ...emptySelection(), tables: [result.tableId] } });
		this.host.live.say(this.label(t.live.tableCreated, { x: table?.name ?? '' }));
		this.ensureVisible(result.tableId);
		this.startRename(result.tableId);
		return result.tableId;
	}

	createNote(at?: { x: number; y: number }): void {
		const point = at ?? this.centreWorld();
		const result = addNote(this.store.schema, { x: Math.round((point.x - 110) / 8) * 8, y: Math.round((point.y - 70) / 8) * 8, w: 220, h: 140, text: '', color: 'amber' });
		if (!result.noteId) return;
		this.host.commit(result.schema, this.strings.history.note, { select: { ...emptySelection(), notes: [result.noteId] } });
		this.startNoteEdit(result.noteId);
	}

	createArea(at?: { x: number; y: number }): void {
		const t = this.strings;
		const selected = this.store.selection.tables.map((id) => findTable(this.store.schema, id)).filter((x): x is Table => Boolean(x));
		let box: { x: number; y: number; w: number; h: number };
		if (selected.length > 0 && !at) {
			const left = Math.min(...selected.map((x) => x.x)) - 32;
			const top = Math.min(...selected.map((x) => x.y)) - 48;
			const right = Math.max(...selected.map((x) => x.x + CARD_WIDTH)) + 32;
			const bottom = Math.max(...selected.map((x) => x.y + tableHeight(x))) + 32;
			box = { x: left, y: top, w: right - left, h: bottom - top };
		} else {
			const point = at ?? this.centreWorld();
			box = { x: Math.round((point.x - 240) / 8) * 8, y: Math.round((point.y - 160) / 8) * 8, w: 480, h: 320 };
		}
		const result = addArea(this.store.schema, { ...box, title: t.canvas.newArea, color: 'blue' });
		if (!result.areaId) return;
		this.host.commit(result.schema, this.label(t.history.area, { x: t.canvas.newArea }), { select: { ...emptySelection(), areas: [result.areaId] } });
		this.startAreaEdit(result.areaId);
	}

	startRename(tableId: string): void {
		const entry = this.cards.get(tableId);
		const table = findTable(this.store.schema, tableId);
		if (!entry || !table) return;
		const nameEl = entry.el.querySelector<HTMLElement>('.sf-card-name');
		if (!nameEl) return;
		this.edit = { kind: 'table', table: tableId };
		const input = h('input', { class: 'sf-inline sf-inline-name', value: table.name, maxlength: String(LIMITS.name), 'aria-label': this.strings.props.name, spellcheck: 'false', autocomplete: 'off' });
		const message = h('span', { class: 'sf-inline-msg', role: 'status' });
		nameEl.replaceWith(input);
		entry.el.querySelector('.sf-card-head')?.append(message);
		input.focus();
		input.select();
		const original = table.name;
		const check = () => {
			const value = input.value.trim();
			const taken = value && this.store.schema.tables.some((x) => x.id !== tableId && x.name.toLowerCase() === value.toLowerCase());
			input.classList.toggle('is-invalid', Boolean(taken));
			message.textContent = taken ? this.label(this.strings.canvas.nameTaken, { name: value }) : '';
		};
		input.addEventListener('input', check);
		let done = false;
		const finish = (mode: 'commit' | 'cancel', next?: 'add' | 'first') => {
			if (done) return;
			done = true;
			this.edit = null;
			const value = input.value.trim();
			if (mode === 'commit' && !value) {
				this.host.toasts.show(this.strings.canvas.nameEmpty);
			}
			if (mode === 'commit' && value && value !== original) {
				this.host.commit(renameTable(this.store.schema, tableId, value), this.label(this.strings.history.rename, { x: original }));
				this.host.afterRename(original);
			} else {
				this.rebuild(tableId);
			}
			if (next === 'add') this.cards.get(tableId)?.el.querySelector<HTMLElement>('[data-add-column]')?.focus();
			else if (next === 'first') {
				const first = findTable(this.store.schema, tableId)?.columns[0];
				if (first) this.startColumnEdit(tableId, first.id, 'name', 'existing');
			} else if (mode === 'cancel') this.cards.get(tableId)?.el.focus();
		};
		input.addEventListener('keydown', (event) => {
			event.stopPropagation();
			if (event.key === 'Enter') {
				event.preventDefault();
				finish('commit', 'add');
			} else if (event.key === 'Tab' && !event.shiftKey) {
				event.preventDefault();
				finish('commit', 'first');
			} else if (event.key === 'Escape') {
				event.preventDefault();
				finish('cancel');
			}
		});
		input.addEventListener('blur', () => finish('commit'));
	}

	private rebuild(tableId: string): void {
		const entry = this.cards.get(tableId);
		if (entry) entry.sig = '';
		this.render();
	}

	startColumnEdit(tableId: string, columnId: string, field: 'name' | 'type', origin: 'existing' | 'quick' | 'insert'): void {
		const fresh = origin !== 'existing';
		const entry = this.cards.get(tableId);
		const table = findTable(this.store.schema, tableId);
		const column = table?.columns.find((c) => c.id === columnId);
		const row = entry?.el.querySelector<HTMLElement>(`.sf-row[data-column="${columnId}"]`);
		if (!entry || !table || !column || !row) return;
		this.edit = { kind: 'column', table: tableId, column: columnId, field, fresh };
		const t = this.strings;
		let done = false;
		const target = row.querySelector<HTMLElement>(field === 'name' ? '.sf-col-name' : '.sf-col-type');
		if (!target) return;
		const input = h('input', {
			class: `sf-inline ${field === 'name' ? 'sf-inline-col' : 'sf-inline-type'}`,
			value: field === 'name' ? column.name : displayType(column.type),
			maxlength: String(LIMITS.name),
			'aria-label': field === 'name' ? t.props.name : t.types.label,
			spellcheck: 'false',
			autocomplete: 'off'
		});
		target.replaceWith(input);
		input.focus();
		input.select();
		const picker = field === 'type' ? new TypePicker({ input, strings: t, overlay: this.host.overlay, dialect: () => this.store.dialect, onPick: () => finish('commit') }) : null;
		picker?.open();
		const finish = (mode: 'commit' | 'cancel', next?: 'type' | 'name' | 'next' | 'nextExisting', blurred = false) => {
			if (done) return;
			done = true;
			picker?.close();
			this.edit = null;
			const current = findTable(this.store.schema, tableId)?.columns.find((c) => c.id === columnId);
			if (!current) {
				this.render();
				return;
			}
			if (mode === 'cancel') {
				if (fresh && this.isDefaultName(current)) this.dropColumn(tableId, columnId);
				else this.rebuild(tableId);
				this.cards.get(tableId)?.el.focus();
				return;
			}
			const raw = input.value.trim();
			let changed = false;
			if (field === 'name') {
				if (!raw) this.host.toasts.show(t.canvas.nameEmpty);
				else if (raw !== current.name) {
					const taken = findTable(this.store.schema, tableId)?.columns.some((c) => c.id !== columnId && c.name.toLowerCase() === raw.toLowerCase());
					if (taken) this.host.toasts.show(this.label(t.canvas.columnTaken, { name: raw }));
					this.host.commit(updateColumn(this.store.schema, tableId, columnId, { name: raw }), this.label(t.history.rename, { x: current.name }));
					changed = true;
				}
			} else {
				const type = picker?.resolve(blurred ? 'blur' : 'enter') ?? null;
				if (!type) this.host.toasts.show(this.label(t.types.invalid, { dialect: DIALECT_LABELS[this.store.dialect] }));
				else if (!sameType(type, current.type)) {
					this.host.commit(updateColumn(this.store.schema, tableId, columnId, { type }), this.label(t.history.changeType, { x: current.name }));
					changed = true;
				}
			}
			if (!changed) this.rebuild(tableId);
			const after = findTable(this.store.schema, tableId)?.columns.find((c) => c.id === columnId);
			if (origin === 'quick' && next !== 'type' && next !== 'name' && after && this.isPlaceholder(after)) {
				this.dropColumn(tableId, columnId);
				if (!blurred) this.cards.get(tableId)?.el.querySelector<HTMLElement>('[data-add-column]')?.focus();
				return;
			}
			const columns = findTable(this.store.schema, tableId)?.columns ?? [];
			const index = columns.findIndex((c) => c.id === columnId);
			if (next === 'type') this.startColumnEdit(tableId, columnId, 'type', origin);
			else if (next === 'name') this.startColumnEdit(tableId, columnId, 'name', origin);
			else if (next === 'next') this.addColumnAndEdit(tableId);
			else if (next === 'nextExisting') {
				const following = columns[index + 1];
				if (following) this.startColumnEdit(tableId, following.id, 'name', 'existing');
				else this.cards.get(tableId)?.el.querySelector<HTMLElement>('[data-add-column]')?.focus();
			} else if (!blurred) this.cards.get(tableId)?.el.querySelector<HTMLElement>(`.sf-row[data-column="${columnId}"]`)?.focus();
		};
		input.addEventListener('keydown', (event) => {
			event.stopPropagation();
			if (picker?.handleKey(event)) return;
			if (event.key === 'Enter') {
				event.preventDefault();
				if (field === 'name') finish('commit', origin === 'quick' ? 'type' : undefined);
				else finish('commit', origin === 'quick' ? 'next' : undefined);
			} else if (event.key === 'Tab') {
				event.preventDefault();
				if (field === 'name') finish('commit', event.shiftKey ? undefined : 'type');
				else finish('commit', event.shiftKey ? 'name' : 'nextExisting');
			} else if (event.key === 'Escape') {
				event.preventDefault();
				finish('cancel');
			}
		});
		input.addEventListener('blur', () => setTimeout(() => finish('commit', undefined, true), 0));
	}

	private isDefaultName(column: Column): boolean {
		return new RegExp(`^${this.strings.canvas.newColumn}(_\\d+)?$`).test(column.name);
	}

	private isPlaceholder(column: Column): boolean {
		return this.isDefaultName(column) && column.type.kind === 'text';
	}

	private dropColumn(tableId: string, columnId: string): void {
		const name = findTable(this.store.schema, tableId)?.columns.find((c) => c.id === columnId)?.name ?? '';
		const without = deleteColumn(this.store.schema, tableId, columnId);
		const expected = JSON.stringify(without);
		if (this.store.discard((before) => JSON.stringify(before) === expected)) return;
		this.host.commit(without, this.label(this.strings.history.deleteColumn, { x: name }));
	}

	addColumnAndEdit(tableId: string): void {
		const table = findTable(this.store.schema, tableId);
		if (!table) return;
		if (table.columns.length >= LIMITS.columns) {
			this.host.toasts.show(this.strings.canvas.limitColumns);
			return;
		}
		const result = addColumn(this.store.schema, tableId, { name: this.strings.canvas.newColumn });
		if (!result.columnId) return;
		const name = findTable(result.schema, tableId)?.columns.find((c) => c.id === result.columnId)?.name ?? '';
		this.host.commit(result.schema, this.label(this.strings.history.addColumn, { x: name }), { select: { ...emptySelection(), tables: [tableId] } });
		this.host.live.say(this.label(this.strings.live.columnAdded, { x: name, t: table.name }));
		this.startColumnEdit(tableId, result.columnId, 'name', 'quick');
	}

	addPresetColumn(tableId: string, preset: ColumnPreset, index?: number): void {
		const t = this.strings;
		const table = findTable(this.store.schema, tableId);
		if (!table) return;
		if (preset === 'timestamps') {
			const result = this.withTimestamps(this.store.schema, tableId, index);
			if (result.names.length === 0) {
				this.host.toasts.show(this.label(t.palette.timestampsExist, { table: table.name }));
				return;
			}
			const names = result.names.join(', ');
			this.host.commit(result.schema, this.label(t.history.addColumn, { x: names }), { select: { ...emptySelection(), tables: [tableId] } });
			this.host.live.say(this.label(t.live.columnAdded, { x: names, t: table.name }));
			this.ensureVisible(tableId);
			return;
		}
		if (table.columns.length >= LIMITS.columns) {
			this.host.toasts.show(t.canvas.limitColumns);
			return;
		}
		const options = index === undefined ? { name: t.canvas.newColumn, type: COMMON_TYPES[preset] } : { name: t.canvas.newColumn, type: COMMON_TYPES[preset], index };
		const result = addColumn(this.store.schema, tableId, options);
		if (!result.columnId) return;
		const name = findTable(result.schema, tableId)?.columns.find((c) => c.id === result.columnId)?.name ?? '';
		this.host.commit(result.schema, this.label(t.history.addColumn, { x: name }), { select: { ...emptySelection(), tables: [tableId] } });
		this.host.live.say(this.label(t.live.columnAdded, { x: name, t: table.name }));
		this.ensureVisible(tableId);
		this.startColumnEdit(tableId, result.columnId, 'name', 'insert');
	}

	private withTimestamps(schema: Schema, tableId: string, index?: number): { schema: Schema; names: string[] } {
		let next = schema;
		const names: string[] = [];
		for (const name of TIMESTAMP_COLUMNS) {
			const table = findTable(next, tableId);
			if (!table || table.columns.some((c) => c.name.toLowerCase() === name)) continue;
			const options = index === undefined ? { name, type: { kind: 'timestamptz' } as const } : { name, type: { kind: 'timestamptz' } as const, index: index + names.length };
			const result = addColumn(next, tableId, options);
			if (!result.columnId) break;
			next = updateColumn(result.schema, tableId, result.columnId, { default: { kind: 'now' } });
			names.push(name);
		}
		return { schema: next, names };
	}

	private applyTablePreset(schema: Schema, tableId: string, preset: TablePreset): Schema {
		if (preset === 'timestamps') return this.withTimestamps(schema, tableId).schema;
		if (preset === 'lookup') {
			const result = addColumn(schema, tableId, { name: this.strings.palette.nameColumn, type: { kind: 'varchar', length: 100 } });
			return result.columnId ? toggleUnique(result.schema, tableId, result.columnId) : schema;
		}
		return schema;
	}

	activateItem(item: PaletteItem, keyboard: boolean): void {
		const t = this.strings;
		if (item.kind === 'table') this.createTable(undefined, true, item.preset);
		else if (item.kind === 'note') this.createNote();
		else if (item.kind === 'area') this.createArea();
		else if (item.kind === 'column') {
			const tableId = this.singleTable();
			if (tableId) this.addPresetColumn(tableId, item.preset);
			else this.host.toasts.show(t.palette.selectTable);
		} else if (keyboard) {
			const tableId = this.singleTable();
			if (tableId) this.host.openRelate(tableId);
			else this.host.toasts.show(t.palette.selectTableRelation);
		} else this.startLink(item.relation, null);
	}

	private singleTable(): string | null {
		const tables = this.store.selection.tables;
		return tables.length === 1 ? (tables[0] ?? null) : null;
	}

	startLink(relation: RelationKind, source: string | null): void {
		this.cancelLink();
		this.host.bubble.close(false);
		this.link = { relation, source, outcome: null };
		this.root.classList.add('is-linking');
		this.root.focus({ preventScroll: true });
		this.render();
		if (this.lastPointer) this.linkMove(this.lastPointer);
		this.host.live.say(this.linkText());
	}

	cancelLink(): void {
		if (!this.link) return;
		this.link = null;
		this.root.classList.remove('is-linking');
		this.preview.setAttribute('d', '');
		this.tag.hidden = true;
		this.clearDropTargets();
		this.render();
	}

	private linkText(): string {
		const t = this.strings.palette;
		const link = this.link;
		if (!link) return '';
		if (link.source) return t.pickTarget;
		return link.relation === 'manyToMany' ? t.pickFirst : t.pickSource;
	}

	private linkMove(e: PointerEvent): void {
		const link = this.link;
		if (!link) return;
		this.clearDropTargets();
		const schema = this.store.schema;
		const under = document.elementFromPoint(e.clientX, e.clientY);
		const card = under && this.root.contains(under) ? under.closest<HTMLElement>('.sf-card') : null;
		const target = card?.dataset.table ? findTable(schema, card.dataset.table) : undefined;
		const source = link.source ? findTable(schema, link.source) : undefined;
		link.outcome = null;
		if (!source) {
			this.preview.setAttribute('d', '');
			this.tag.hidden = true;
			if (target) card?.querySelector('.sf-card-head')?.classList.add('is-drop-head');
			return;
		}
		const point = this.screenToWorld(e.clientX, e.clientY);
		let endX = point.x;
		let endY = point.y;
		if (target && target.id !== source.id) {
			link.outcome = this.linkOutcome(link.relation, source, target);
			if (link.outcome.valid) card?.querySelector('.sf-card-head')?.classList.add('is-drop-head');
			endX = point.x < target.x + CARD_WIDTH / 2 ? target.x : target.x + CARD_WIDTH;
			endY = target.y + HEADER_HEIGHT / 2;
		} else if (target) {
			link.outcome = { valid: false, text: this.strings.palette.sameTable };
		}
		const fromRight = endX > source.x + CARD_WIDTH / 2;
		const fromX = fromRight ? source.x + CARD_WIDTH : source.x;
		const fromY = source.y + HEADER_HEIGHT / 2;
		const bend = fromRight ? 60 : -60;
		this.preview.setAttribute('d', `M ${fromX} ${fromY} C ${fromX + bend} ${fromY}, ${endX - bend} ${endY}, ${endX} ${endY}`);
		this.showTag(e, link.outcome);
	}

	private linkOutcome(relation: RelationKind, source: Table, target: Table): Outcome {
		const t = this.strings;
		if (relation === 'manyToMany') {
			const name = `${source.name}_${target.name}`;
			return {
				valid: true,
				text: this.label(t.connect.junction, { name }),
				run: () => {
					const result = createJunction(this.store.schema, source.id, target.id);
					if (!result.tableId) return;
					const created = findTable(result.schema, result.tableId);
					this.host.commit(result.schema, this.label(t.history.junction, { x: created?.name ?? name }), { select: { ...emptySelection(), tables: [result.tableId] } });
					this.host.live.say(this.label(t.live.junctionCreated, { x: created?.name ?? name }));
				}
			};
		}
		const key = referencedKey(target);
		const keyColumn = target.columns.find((c) => c.id === key[0]);
		if (key.length === 0 || !keyColumn) return { valid: false, text: this.label(t.palette.noKey, { table: target.name }) };
		const column = `${target.name}_${keyColumn.name}`;
		const text = this.label(t.connect.createColumn, { table: source.name, column, target: `${target.name}.${keyColumn.name}` });
		return {
			valid: true,
			text: relation === 'oneToOne' ? this.label(t.palette.oneToOneTag, { text }) : text,
			run: () => {
				const result = connectWithNewColumns(this.store.schema, source.id, target.id);
				if (!result.relationId) return;
				const schema = relation === 'oneToOne' ? setOneToOne(result.schema, result.relationId, true) : result.schema;
				const created = findTable(schema, source.id)?.columns.find((c) => c.id === result.columnIds[0])?.name ?? column;
				const label = `${source.name}.${created} → ${target.name}.${keyColumn.name}`;
				this.host.commit(schema, this.label(t.history.createRelation, { x: label }));
				this.host.live.say(this.label(t.live.relationCreated, { x: label }));
				this.flash(result.relationId);
			}
		};
	}

	private linkClick(e: PointerEvent, target: HTMLElement): void {
		const link = this.link;
		if (!link) return;
		const tableId = target.closest<HTMLElement>('.sf-card')?.dataset.table;
		if (!tableId) {
			this.cancelLink();
			return;
		}
		if (!link.source) {
			link.source = tableId;
			this.render();
			this.linkMove(e);
			this.host.live.say(this.linkText());
			return;
		}
		if (tableId === link.source) return;
		this.linkMove(e);
		const outcome = link.outcome;
		this.cancelLink();
		if (outcome?.valid && outcome.run) outcome.run();
		else if (outcome) this.host.toasts.show(outcome.text);
	}

	private showTag(e: PointerEvent, outcome: Outcome | null): void {
		if (!outcome) {
			this.tag.hidden = true;
			return;
		}
		this.tag.hidden = false;
		this.tag.className = `sf-connect-tag${outcome.warning || !outcome.valid ? ' is-warning' : ''}`;
		this.tag.replaceChildren(h('span', { class: 'sf-connect-main', text: outcome.text }));
		if (outcome.warning) this.tag.append(h('span', { class: 'sf-connect-warn', text: outcome.warning }));
		const width = this.tag.offsetWidth;
		const height = this.tag.offsetHeight;
		this.tag.style.left = `${Math.min(e.clientX + 14, window.innerWidth - width - 8)}px`;
		this.tag.style.top = `${Math.min(e.clientY + 18, window.innerHeight - height - 8)}px`;
	}

	startNoteEdit(noteId: string): void {
		const entry = this.notes.get(noteId);
		const note = this.store.schema.notes.find((n) => n.id === noteId);
		if (!entry || !note) return;
		this.edit = { kind: 'note', note: noteId };
		const area = h('textarea', { class: 'sf-note-input', 'aria-label': this.strings.props.text, placeholder: this.strings.canvas.notePlaceholder, maxlength: String(LIMITS.noteText) });
		area.value = note.text;
		entry.el.querySelector('.sf-note-text')?.replaceWith(area);
		area.focus();
		let done = false;
		const finish = (save: boolean) => {
			if (done) return;
			done = true;
			this.edit = null;
			if (save && area.value !== note.text) this.host.commit(updateNote(this.store.schema, noteId, { text: area.value }), this.strings.history.editNote);
			else {
				const current = this.notes.get(noteId);
				if (current) current.sig = '';
				this.render();
			}
			this.notes.get(noteId)?.el.focus();
		};
		area.addEventListener('keydown', (event) => {
			event.stopPropagation();
			if (event.key === 'Escape') {
				event.preventDefault();
				finish(true);
			} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				finish(true);
			}
		});
		area.addEventListener('blur', () => finish(true));
	}

	startAreaEdit(areaId: string): void {
		const entry = this.areas.get(areaId);
		const area = this.store.schema.areas.find((a) => a.id === areaId);
		if (!entry || !area) return;
		this.edit = { kind: 'area', area: areaId };
		const input = h('input', { class: 'sf-inline sf-inline-area', value: area.title, maxlength: String(LIMITS.name), 'aria-label': this.strings.props.title });
		entry.el.querySelector('.sf-area-name')?.replaceWith(input);
		input.focus();
		input.select();
		let done = false;
		const finish = (save: boolean) => {
			if (done) return;
			done = true;
			this.edit = null;
			const value = input.value.trim();
			if (save && value && value !== area.title) this.host.commit(updateArea(this.store.schema, areaId, { title: value }), this.fillTitle(area.title));
			else {
				const current = this.areas.get(areaId);
				if (current) current.sig = '';
				this.render();
			}
		};
		input.addEventListener('keydown', (event) => {
			event.stopPropagation();
			if (event.key === 'Enter') {
				event.preventDefault();
				finish(true);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				finish(false);
			}
		});
		input.addEventListener('blur', () => finish(true));
	}

	private fillTitle(title: string): string {
		return this.label(this.strings.history.editArea, { x: title });
	}

	beginInsert(item: PaletteItem, event: PointerEvent): void {
		this.cancelLink();
		this.drag = { kind: 'insert', pointer: event.pointerId, item, startX: event.clientX, startY: event.clientY, ghost: null, target: null, line: null };
		this.holdSelection(true);
		const move = (e: PointerEvent) => this.insertMove(e);
		const up = (e: PointerEvent) => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			window.removeEventListener('pointercancel', up);
			this.insertUp(e, e.type === 'pointercancel');
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', up);
	}

	private insideCanvas(x: number, y: number): boolean {
		const el = document.elementFromPoint(x, y);
		return Boolean(el && this.root.contains(el) && !el.closest('.sf-palette, .sf-zoom, .sf-sheet, .sf-banner'));
	}

	private ghostFor(item: PaletteItem): HTMLElement {
		const t = this.strings;
		const zoom = this.store.view.zoom;
		if (item.kind === 'table') {
			const ghost = h('div', { class: 'sf-ghost sf-ghost-table', 'aria-hidden': 'true' });
			const rows = ['PK  id  bigint'];
			if (item.preset === 'timestamps') rows.push(...TIMESTAMP_COLUMNS.map((name) => `    ${name}  timestamptz`));
			if (item.preset === 'lookup') rows.push(`UQ  ${t.palette.nameColumn}  varchar(100)`);
			ghost.append(h('div', { class: 'sf-ghost-head', text: t.canvas.newTable }), ...rows.map((text) => h('div', { class: 'sf-ghost-row', text })));
			ghost.style.width = `${CARD_WIDTH * zoom}px`;
			return ghost;
		}
		if (item.kind === 'note' || item.kind === 'area') {
			const ghost = h('div', { class: `sf-ghost sf-ghost-${item.kind}`, 'aria-hidden': 'true' });
			ghost.style.width = `${(item.kind === 'note' ? 220 : 480) * zoom}px`;
			ghost.style.height = `${(item.kind === 'note' ? 140 : 320) * zoom}px`;
			return ghost;
		}
		const text = item.kind === 'column' ? (item.preset === 'timestamps' ? t.palette.columns.timestamps : choiceLabel(t, item.preset)) : t.palette.relations[item.relation].name;
		return h('div', { class: 'sf-ghost sf-ghost-chip', 'aria-hidden': 'true', text });
	}

	private clearInsertTarget(drag: Extract<Drag, { kind: 'insert' }>): void {
		drag.line?.remove();
		drag.line = null;
		drag.target = null;
		for (const el of this.root.querySelectorAll('.is-drop-target')) el.classList.remove('is-drop-target');
	}

	private insertMove(e: PointerEvent): void {
		const drag = this.drag;
		if (drag?.kind !== 'insert') return;
		if (!drag.ghost && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 5) return;
		if (!drag.ghost) {
			drag.ghost = this.ghostFor(drag.item);
			document.body.append(drag.ghost);
		}
		const inside = this.insideCanvas(e.clientX, e.clientY);
		this.clearInsertTarget(drag);
		const item = drag.item;
		let valid = inside;
		if (item.kind === 'column' || item.kind === 'relation') {
			const card = inside ? (document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('.sf-card') ?? null) : null;
			const tableId = card?.dataset.table;
			valid = Boolean(card && tableId);
			if (card && tableId) {
				card.classList.add('is-drop-target');
				if (item.kind === 'column') {
					const rows = [...card.querySelectorAll<HTMLElement>('.sf-row[data-column]')];
					const headBottom = card.querySelector('.sf-card-head')?.getBoundingClientRect().bottom ?? 0;
					let index = rows.findIndex((row) => {
						const box = row.getBoundingClientRect();
						return e.clientY < box.top + box.height / 2;
					});
					if (index === -1 || e.clientY <= headBottom) index = rows.length;
					const zoom = this.store.view.zoom;
					const cardTop = card.getBoundingClientRect().top;
					const edge = rows[index]?.getBoundingClientRect().top ?? rows[rows.length - 1]?.getBoundingClientRect().bottom ?? cardTop + HEADER_HEIGHT * zoom;
					const line = h('div', { class: 'sf-reorder-line', 'aria-hidden': 'true' });
					line.style.top = `${Math.round((edge - cardTop) / zoom) - 1}px`;
					card.append(line);
					drag.line = line;
					drag.target = { table: tableId, index };
				} else drag.target = { table: tableId, index: -1 };
			}
			drag.ghost.classList.toggle('is-invalid', !valid);
			drag.ghost.style.left = `${e.clientX + 14}px`;
			drag.ghost.style.top = `${e.clientY + 12}px`;
		} else {
			drag.ghost.hidden = !inside;
			drag.ghost.style.left = `${e.clientX - 20}px`;
			drag.ghost.style.top = `${e.clientY - 16}px`;
		}
		document.body.style.cursor = valid ? 'copy' : 'no-drop';
	}

	private insertUp(e: PointerEvent, cancelled: boolean): void {
		const drag = this.drag;
		this.drag = null;
		this.holdSelection(false);
		document.body.style.cursor = '';
		if (drag?.kind !== 'insert') return;
		drag.ghost?.remove();
		const target = drag.target;
		this.clearInsertTarget(drag);
		if (cancelled) return;
		const item = drag.item;
		if (!drag.ghost) {
			this.activateItem(item, false);
			return;
		}
		if (!this.insideCanvas(e.clientX, e.clientY)) return;
		const t = this.strings;
		const point = this.screenToWorld(e.clientX - 20, e.clientY - 16);
		if (item.kind === 'table') this.createTable(point, false, item.preset);
		else if (item.kind === 'note') this.createNote({ x: point.x + 110, y: point.y + 70 });
		else if (item.kind === 'area') this.createArea({ x: point.x + 240, y: point.y + 160 });
		else if (!target) this.dropHint(item.kind === 'column' ? t.palette.dropColumn : t.palette.dropRelation);
		else if (item.kind === 'column') this.addPresetColumn(target.table, item.preset, target.index);
		else this.startLink(item.relation, target.table);
	}

	private dropHint(text: string): void {
		if (this.dropHints >= 3) return;
		this.dropHints++;
		this.host.toasts.show(text);
	}

	private bind(): void {
		const root = this.root;
		root.addEventListener('pointerdown', (e) => this.onPointerDown(e));
		root.addEventListener('pointermove', (e) => this.onPointerMove(e));
		root.addEventListener('pointerup', (e) => this.onPointerUp(e));
		root.addEventListener('pointercancel', (e) => this.onPointerUp(e, true));
		root.addEventListener('dblclick', (e) => this.onDoubleClick(e));
		root.addEventListener('contextmenu', (e) => this.onContextMenu(e));
		root.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
		root.addEventListener('keydown', (e) => this.onKeyDown(e));
		root.addEventListener('click', (e) => this.onClick(e));
		root.addEventListener('pointerover', (e) => {
			const card = (e.target as Element).closest<HTMLElement>('.sf-card');
			const id = card?.dataset.table ?? null;
			if (id !== this.hoverTable && !this.drag) {
				this.hoverTable = id;
				for (const g of this.edgeLayer.querySelectorAll<SVGGElement>('.sf-edge')) {
					const relation = this.store.schema.relations.find((r) => r.id === g.dataset.relation);
					g.classList.toggle('is-hot', Boolean(id && relation && (relation.fromTable === id || relation.toTable === id)));
				}
			}
		});
		root.addEventListener('focusin', (e) => {
			const card = (e.target as Element).closest<HTMLElement>('.sf-card');
			const row = (e.target as Element).closest<HTMLElement>('.sf-row[data-column]');
			if (card && row) {
				for (const other of card.querySelectorAll<HTMLElement>('.sf-row[data-column]')) other.tabIndex = other === row ? 0 : -1;
			}
		});
		window.addEventListener('keydown', (e) => {
			if (e.code === 'Space' && !isTextField(e.target) && this.root.contains(document.activeElement)) {
				this.spaceDown = true;
				this.root.classList.add('is-space');
			}
		});
		window.addEventListener('keyup', (e) => {
			if (e.code === 'Space') {
				this.spaceDown = false;
				this.root.classList.remove('is-space');
			}
			if (e.key === 'Alt' && this.drag?.kind === 'connect' && this.lastPointer) this.updateConnect(this.lastPointer, false);
		});
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Alt' && this.drag?.kind === 'connect' && this.lastPointer) this.updateConnect(this.lastPointer, true);
			if (e.key === 'Escape' && this.drag?.kind === 'connect') this.cancelConnect(true);
			if (e.key === 'Escape' && this.link) this.cancelLink();
		});
	}

	private onClick(e: MouseEvent): void {
		const target = e.target as HTMLElement;
		const badge = target.closest<HTMLElement>('.sf-badge');
		if (badge?.dataset.term) {
			e.stopPropagation();
			this.host.openGlossary(badge.dataset.term as 'PRIMARY_KEY', badge);
			return;
		}
		const addButton = target.closest<HTMLElement>('[data-add-column]');
		if (addButton) {
			const tableId = addButton.closest<HTMLElement>('.sf-card')?.dataset.table;
			if (tableId) this.addColumnAndEdit(tableId);
			return;
		}
		const menu = target.closest<HTMLElement>('.sf-card-menu');
		if (menu) {
			const tableId = menu.closest<HTMLElement>('.sf-card')?.dataset.table;
			if (tableId) this.host.menus.open(menu, this.tableMenu(tableId), { label: this.label(this.strings.canvas.tableMenu, { name: findTable(this.store.schema, tableId)?.name ?? '' }), returnFocus: menu });
		}
	}

	private onPointerDown(e: PointerEvent): void {
		const target = e.target as HTMLElement;
		this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (this.pointers.size === 2) {
			const [a, b] = [...this.pointers.values()];
			if (a && b) {
				this.drag = null;
				const rect = this.root.getBoundingClientRect();
				this.pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.store.view.zoom, cx: (a.x + b.x) / 2 - rect.left, cy: (a.y + b.y) / 2 - rect.top, x: this.store.view.x, y: this.store.view.y };
			}
			return;
		}
		if (target.closest('input, textarea, select, .sf-add-btn, .sf-card-menu, .sf-zoom, .sf-sheet, .sf-banner, .sf-empty-actions, .sf-pill-wrap, .sf-palette')) return;
		if (target.closest('.sf-badge')) return;
		if (this.link && e.button === 0 && !this.spaceDown) {
			e.preventDefault();
			this.linkClick(e, target);
			return;
		}
		if (e.button === 2) {
			if (e.pointerType !== 'mouse') return;
			e.preventDefault();
			this.startPan(e, false, target);
			return;
		}
		if (e.button !== 0 && e.button !== 1) return;
		if (this.spaceDown || e.button === 1) {
			e.preventDefault();
			this.startPan(e, false);
			return;
		}
		if (e.pointerType === 'touch') {
			clearTimeout(this.longPress);
			const x = e.clientX;
			const y = e.clientY;
			this.longPress = setTimeout(() => {
				this.drag = null;
				this.onContextMenu(new MouseEvent('contextmenu', { clientX: x, clientY: y, bubbles: true }), target);
			}, 520);
		}
		const connector = target.closest<HTMLElement>('[data-connector]');
		if (connector && e.pointerType !== 'touch') {
			const row = connector.closest<HTMLElement>('.sf-row');
			const card = connector.closest<HTMLElement>('.sf-card');
			if (row?.dataset.column && card?.dataset.table) {
				e.preventDefault();
				this.startConnect(e, card.dataset.table, row.dataset.column, connector);
				return;
			}
		}
		if (target.closest('[data-resize-note]')) {
			const noteEl = target.closest<HTMLElement>('.sf-note');
			const note = this.store.schema.notes.find((n) => n.id === noteEl?.dataset.note);
			if (note) {
				e.preventDefault();
				this.root.setPointerCapture(e.pointerId);
				this.drag = { kind: 'resize-note', pointer: e.pointerId, note: note.id, startX: e.clientX, startY: e.clientY, w: note.w, h: note.h };
				this.holdSelection(true);
			}
			return;
		}
		const handle = target.closest<HTMLElement>('.sf-area-handle');
		if (handle) {
			const area = this.store.schema.areas.find((a) => a.id === handle.closest<HTMLElement>('.sf-area')?.dataset.area);
			if (area) {
				e.preventDefault();
				this.root.setPointerCapture(e.pointerId);
				this.drag = { kind: 'resize-area', pointer: e.pointerId, area: area.id, corner: handle.dataset.corner ?? 'se', startX: e.clientX, startY: e.clientY, box: { x: area.x, y: area.y, w: area.w, h: area.h } };
				this.holdSelection(true);
			}
			return;
		}
		const grip = target.closest<HTMLElement>('.sf-grip');
		if (grip && e.pointerType !== 'touch') {
			const row = grip.closest<HTMLElement>('.sf-row');
			const card = grip.closest<HTMLElement>('.sf-card');
			const table = card?.dataset.table ? findTable(this.store.schema, card.dataset.table) : undefined;
			const index = table?.columns.findIndex((c) => c.id === row?.dataset.column) ?? -1;
			if (table && row?.dataset.column && index >= 0) {
				e.preventDefault();
				this.root.setPointerCapture(e.pointerId);
				const line = h('div', { class: 'sf-reorder-line', 'aria-hidden': 'true' });
				card?.append(line);
				this.drag = { kind: 'reorder', pointer: e.pointerId, table: table.id, column: row.dataset.column, startY: e.clientY, index, line };
				this.holdSelection(true);
				return;
			}
		}
		const card = target.closest<HTMLElement>('.sf-card');
		const noteEl = target.closest<HTMLElement>('.sf-note');
		const areaTitle = target.closest<HTMLElement>('.sf-area-title');
		const edge = target.closest<SVGGElement>('.sf-edge');
		if (card || noteEl || areaTitle) {
			const current = this.store.selection;
			let next: Selection;
			let focus: { table: string; column: string } | null = null;
			let clickSelect: Selection | undefined;
			if (card?.dataset.table) {
				const id = card.dataset.table;
				const row = target.closest<HTMLElement>('.sf-row[data-column]');
				if (row?.dataset.column) focus = { table: id, column: row.dataset.column };
				next = this.toggleIn(current, 'tables', id, e.shiftKey, (sel) => (clickSelect = sel));
			} else if (noteEl?.dataset.note) {
				next = this.toggleIn(current, 'notes', noteEl.dataset.note, e.shiftKey, (sel) => (clickSelect = sel));
			} else {
				const id = areaTitle?.closest<HTMLElement>('.sf-area')?.dataset.area ?? '';
				next = this.toggleIn(current, 'areas', id, e.shiftKey, (sel) => (clickSelect = sel));
			}
			this.store.select(next, focus ?? (card ? null : this.store.focusColumn));
			this.root.setPointerCapture(e.pointerId);
			this.drag = { kind: 'pending', startX: e.clientX, startY: e.clientY, pointer: e.pointerId, target: 'move', clickSelect, focus };
			this.holdSelection(true);
			return;
		}
		const touch = e.pointerType === 'touch';
		const additive = e.shiftKey || mod(e);
		if (edge?.dataset.relation) {
			this.root.setPointerCapture(e.pointerId);
			this.drag = { kind: 'pending', startX: e.clientX, startY: e.clientY, pointer: e.pointerId, target: 'edge', relation: edge.dataset.relation, additive, touch };
			this.holdSelection(true);
			return;
		}
		this.root.focus({ preventScroll: true });
		if (touch) {
			this.startPan(e, true);
			return;
		}
		e.preventDefault();
		this.root.setPointerCapture(e.pointerId);
		this.drag = { kind: 'pending', startX: e.clientX, startY: e.clientY, pointer: e.pointerId, target: 'marquee', additive };
		this.holdSelection(true);
	}

	private holdSelection(on: boolean): void {
		document.documentElement.classList.toggle('sf-dragging', on);
		if (on) window.getSelection()?.removeAllRanges();
	}

	private toggleIn(current: Selection, key: keyof Selection, id: string, additive: boolean, setClick: (s: Selection) => void): Selection {
		const has = current[key].includes(id);
		if (additive) {
			const list = has ? current[key].filter((x) => x !== id) : [...current[key], id];
			return { ...current, relations: [], [key]: list };
		}
		const alone: Selection = { ...emptySelection(), [key]: [id] };
		if (has) {
			setClick(alone);
			return { ...current, relations: [] };
		}
		return alone;
	}

	private startPan(e: PointerEvent, clear: boolean, menu?: HTMLElement): void {
		if (!this.root.hasPointerCapture(e.pointerId)) this.root.setPointerCapture(e.pointerId);
		this.drag = { kind: 'pan', startX: e.clientX, startY: e.clientY, pointer: e.pointerId, viewX: this.store.view.x, viewY: this.store.view.y, moved: false, clear, menu };
		if (!menu) this.root.classList.add('is-panning');
		this.holdSelection(true);
	}

	private startMarquee(e: PointerEvent, startX: number, startY: number, additive: boolean): void {
		if (!this.root.hasPointerCapture(e.pointerId)) this.root.setPointerCapture(e.pointerId);
		const box = h('div', { class: 'sf-marquee', 'aria-hidden': 'true' });
		this.root.append(box);
		this.host.bubble.close(false);
		this.drag = { kind: 'marquee', pointer: e.pointerId, anchor: this.screenToWorld(startX, startY), box, base: additive ? this.store.selection : emptySelection() };
		this.onPointerMove(e);
	}

	private onPointerMove(e: PointerEvent): void {
		if (this.drag?.kind === 'insert') return;
		this.lastPointer = e;
		if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (this.pinch && this.pointers.size === 2) {
			const [a, b] = [...this.pointers.values()];
			if (!a || !b) return;
			const rect = this.root.getBoundingClientRect();
			const distance = Math.hypot(a.x - b.x, a.y - b.y);
			const zoom = Math.min(2, Math.max(0.25, (this.pinch.zoom * distance) / Math.max(1, this.pinch.distance)));
			const cx = (a.x + b.x) / 2 - rect.left;
			const cy = (a.y + b.y) / 2 - rect.top;
			const worldX = (this.pinch.cx - this.pinch.x) / this.pinch.zoom;
			const worldY = (this.pinch.cy - this.pinch.y) / this.pinch.zoom;
			this.store.setView({ zoom, x: cx - worldX * zoom, y: cy - worldY * zoom });
			return;
		}
		const drag = this.drag;
		if (!drag) {
			if (this.link) this.linkMove(e);
			return;
		}
		if ('pointer' in drag && drag.pointer !== e.pointerId) return;
		if (Math.hypot(e.clientX - ('startX' in drag ? drag.startX : e.clientX), e.clientY - ('startY' in drag ? drag.startY : e.clientY)) > 6) clearTimeout(this.longPress);
		const zoom = this.store.view.zoom;
		switch (drag.kind) {
			case 'pending': {
				if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 4) return;
				if (drag.target === 'move') {
					this.drag = { kind: 'move', startX: drag.startX, startY: drag.startY, pointer: drag.pointer, dx: 0, dy: 0 };
					this.root.classList.add('is-moving');
					this.onPointerMove(e);
				} else if (drag.touch) {
					this.startPan(e, false);
				} else {
					this.startMarquee(e, drag.startX, drag.startY, drag.additive ?? false);
				}
				return;
			}
			case 'move': {
				drag.dx = Math.round((e.clientX - drag.startX) / zoom);
				drag.dy = Math.round((e.clientY - drag.startY) / zoom);
				this.render(moveSelection(this.store.schema, this.store.selection, drag.dx, drag.dy));
				this.edgePan(e);
				return;
			}
			case 'pan': {
				const dx = e.clientX - drag.startX;
				const dy = e.clientY - drag.startY;
				if (!drag.moved && Math.hypot(dx, dy) > 3) {
					drag.moved = true;
					this.root.classList.add('is-panning');
				}
				this.store.setView({ ...this.store.view, x: drag.viewX + dx, y: drag.viewY + dy });
				return;
			}
			case 'marquee': {
				const rect = this.root.getBoundingClientRect();
				const view = this.store.view;
				const ax = drag.anchor.x * view.zoom + view.x;
				const ay = drag.anchor.y * view.zoom + view.y;
				const px = e.clientX - rect.left;
				const py = e.clientY - rect.top;
				Object.assign(drag.box.style, { left: `${Math.min(ax, px)}px`, top: `${Math.min(ay, py)}px`, width: `${Math.abs(px - ax)}px`, height: `${Math.abs(py - ay)}px` });
				const point = this.screenToWorld(e.clientX, e.clientY);
				const a = { x: Math.min(drag.anchor.x, point.x), y: Math.min(drag.anchor.y, point.y) };
				const b = { x: Math.max(drag.anchor.x, point.x), y: Math.max(drag.anchor.y, point.y) };
				const touches = (x: number, y: number, w: number, hh: number) => x < b.x && x + w > a.x && y < b.y && y + hh > a.y;
				const inside = (x: number, y: number, w: number, hh: number) => x >= a.x && x + w <= b.x && y >= a.y && y + hh <= b.y;
				const schema = this.store.schema;
				const union = (base: string[], add: string[]) => [...new Set([...base, ...add])];
				const next: Selection = {
					tables: union(drag.base.tables, schema.tables.filter((t) => touches(t.x, t.y, CARD_WIDTH, tableHeight(t))).map((t) => t.id)),
					notes: union(drag.base.notes, schema.notes.filter((n) => touches(n.x, n.y, n.w, n.h)).map((n) => n.id)),
					areas: union(drag.base.areas, schema.areas.filter((x) => inside(x.x, x.y, x.w, x.h)).map((x) => x.id)),
					relations: []
				};
				const current = this.store.selection;
				const same = (k: keyof Selection) => current[k].length === next[k].length && current[k].every((id, i) => id === next[k][i]);
				if (!(same('tables') && same('notes') && same('areas') && current.relations.length === 0)) this.store.select(next);
				this.edgePan(e);
				return;
			}
			case 'connect':
				this.updateConnect(e, e.altKey);
				this.edgePan(e);
				return;
			case 'resize-note': {
				const note = this.store.schema.notes.find((n) => n.id === drag.note);
				if (!note) return;
				const w = Math.max(120, Math.round(drag.w + (e.clientX - drag.startX) / zoom));
				const hh = Math.max(60, Math.round(drag.h + (e.clientY - drag.startY) / zoom));
				this.render({ ...this.store.schema, notes: this.store.schema.notes.map((n) => (n.id === note.id ? { ...n, w, h: hh } : n)) });
				return;
			}
			case 'resize-area': {
				const dx = (e.clientX - drag.startX) / zoom;
				const dy = (e.clientY - drag.startY) / zoom;
				const box = { ...drag.box };
				if (drag.corner.includes('e')) box.w = Math.max(160, drag.box.w + dx);
				if (drag.corner.includes('s')) box.h = Math.max(100, drag.box.h + dy);
				if (drag.corner.includes('w')) {
					box.w = Math.max(160, drag.box.w - dx);
					box.x = drag.box.x + drag.box.w - box.w;
				}
				if (drag.corner.includes('n')) {
					box.h = Math.max(100, drag.box.h - dy);
					box.y = drag.box.y + drag.box.h - box.h;
				}
				const rounded = { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) };
				drag.last = rounded;
				this.render({ ...this.store.schema, areas: this.store.schema.areas.map((a) => (a.id === drag.area ? { ...a, ...rounded } : a)) });
				return;
			}
			case 'reorder': {
				const table = findTable(this.store.schema, drag.table);
				if (!table) return;
				const offset = Math.round((e.clientY - drag.startY) / (ROW_HEIGHT * zoom));
				const index = Math.max(0, Math.min(table.columns.length - 1, drag.index + offset));
				drag.line.style.top = `${rowCentre({ ...table, y: 0 }, index) + (offset > 0 ? ROW_HEIGHT / 2 : -ROW_HEIGHT / 2)}px`;
				drag.line.dataset.index = String(index);
				return;
			}
			default:
				return;
		}
	}

	private onPointerUp(e: PointerEvent, cancelled = false): void {
		if (this.drag?.kind === 'insert') return;
		clearTimeout(this.longPress);
		this.pointers.delete(e.pointerId);
		if (this.pinch) {
			if (this.pointers.size < 2) this.pinch = null;
			return;
		}
		const drag = this.drag;
		if (!drag || ('pointer' in drag && drag.pointer !== e.pointerId)) return;
		this.drag = null;
		this.holdSelection(false);
		this.stopEdgePan();
		this.root.classList.remove('is-panning', 'is-moving');
		if (this.root.hasPointerCapture(e.pointerId)) this.root.releasePointerCapture(e.pointerId);
		const t = this.strings;
		switch (drag.kind) {
			case 'pending':
				if (cancelled) return;
				if (drag.target === 'edge' && drag.relation) {
					this.store.select({ ...emptySelection(), relations: [drag.relation] });
					this.render();
					this.host.openRelationBubble(drag.relation, { x: e.clientX, y: e.clientY });
				} else if (drag.target === 'marquee') {
					this.host.bubble.close(false);
					if (!drag.additive && !isEmptySelection(this.store.selection)) this.store.select(emptySelection());
				} else if (drag.clickSelect) {
					this.store.select(drag.clickSelect, drag.focus ?? null);
				}
				return;
			case 'move': {
				if (cancelled || (drag.dx === 0 && drag.dy === 0)) {
					this.render();
					return;
				}
				const sel = this.store.selection;
				const count = sel.tables.length + sel.notes.length + sel.areas.length;
				this.host.commit(moveSelection(this.store.schema, sel, drag.dx, drag.dy), this.label(t.history.move, { items: plural(t.count.items, count) }));
				return;
			}
			case 'pan':
				if (drag.menu) {
					this.menuGuard = performance.now() + 600;
					if (!drag.moved && !cancelled) this.onContextMenu(new MouseEvent('contextmenu', { clientX: e.clientX, clientY: e.clientY }), drag.menu);
					return;
				}
				if (!drag.moved && drag.clear && !cancelled) {
					this.host.bubble.close(false);
					if (!isEmptySelection(this.store.selection)) this.store.select(emptySelection());
				}
				return;
			case 'marquee':
				drag.box.remove();
				return;
			case 'connect':
				this.finishConnect();
				if (!cancelled) this.onPointerUpConnect(drag.outcome);
				return;
			case 'resize-note': {
				if (cancelled) return this.render();
				const zoom = this.store.view.zoom;
				const w = Math.max(120, Math.round(drag.w + (e.clientX - drag.startX) / zoom));
				const hh = Math.max(60, Math.round(drag.h + (e.clientY - drag.startY) / zoom));
				this.host.commit(updateNote(this.store.schema, drag.note, { w, h: hh }), t.history.editNote);
				return;
			}
			case 'resize-area': {
				if (cancelled) return this.render();
				const area = this.store.schema.areas.find((a) => a.id === drag.area);
				if (!area || !drag.last) return this.render();
				this.host.commit(updateArea(this.store.schema, drag.area, drag.last), this.fillTitle(area.title));
				return;
			}
			case 'reorder': {
				drag.line.remove();
				const index = Number(drag.line.dataset.index ?? drag.index);
				if (cancelled || index === drag.index) return;
				const name = findTable(this.store.schema, drag.table)?.columns.find((c) => c.id === drag.column)?.name ?? '';
				this.host.commit(moveColumn(this.store.schema, drag.table, drag.column, index), this.label(t.history.moveColumn, { x: name }));
				return;
			}
			default:
				return;
		}
	}

	private edgePan(e: PointerEvent): void {
		const rect = this.root.getBoundingClientRect();
		const visible = this.visibleRect();
		const margin = 40;
		const speed = (d: number) => Math.max(-12, Math.min(12, d));
		let dx = 0;
		let dy = 0;
		if (e.clientX < rect.left + visible.left + margin) dx = speed((rect.left + visible.left + margin - e.clientX) / 3);
		else if (e.clientX > rect.left + visible.left + visible.width - margin) dx = -speed((e.clientX - (rect.left + visible.left + visible.width - margin)) / 3);
		if (e.clientY < rect.top + margin) dy = speed((rect.top + margin - e.clientY) / 3);
		else if (e.clientY > rect.top + visible.height - margin) dy = -speed((e.clientY - (rect.top + visible.height - margin)) / 3);
		this.autoPan = { dx, dy };
		if ((dx || dy) && !this.autoPanFrame) {
			const step = () => {
				if (!this.drag || (!this.autoPan.dx && !this.autoPan.dy)) {
					this.autoPanFrame = 0;
					return;
				}
				const view = this.store.view;
				this.store.setView({ ...view, x: view.x + this.autoPan.dx, y: view.y + this.autoPan.dy });
				const drag = this.drag;
				if (drag.kind === 'move') {
					drag.startX += this.autoPan.dx;
					drag.startY += this.autoPan.dy;
					if (this.lastPointer) this.onPointerMove(this.lastPointer);
				} else if (drag.kind === 'marquee' && this.lastPointer) {
					this.onPointerMove(this.lastPointer);
				}
				this.autoPanFrame = requestAnimationFrame(step);
			};
			this.autoPanFrame = requestAnimationFrame(step);
		}
	}

	private stopEdgePan(): void {
		this.autoPan = { dx: 0, dy: 0 };
		if (this.autoPanFrame) cancelAnimationFrame(this.autoPanFrame);
		this.autoPanFrame = 0;
	}

	private startConnect(e: PointerEvent, tableId: string, columnId: string, connector: HTMLElement): void {
		const table = findTable(this.store.schema, tableId);
		const index = table?.columns.findIndex((c) => c.id === columnId) ?? -1;
		if (!table || index < 0) return;
		this.root.setPointerCapture(e.pointerId);
		const side = connector.dataset.connector === 'l' ? 0 : CARD_WIDTH;
		this.drag = { kind: 'connect', pointer: e.pointerId, table: tableId, column: columnId, fromX: table.x + side, fromY: rowCentre(table, index), outcome: null };
		this.cards.get(tableId)?.el.querySelector(`.sf-row[data-column="${columnId}"]`)?.classList.add('is-source');
		this.root.classList.add('is-connecting');
		this.holdSelection(true);
		this.updatePill(this.store.schema);
		this.updateConnect(e, e.altKey);
	}

	private clearDropTargets(): void {
		for (const el of this.root.querySelectorAll('.is-drop, .is-drop-warn, .is-drop-head')) el.classList.remove('is-drop', 'is-drop-warn', 'is-drop-head');
	}

	private updateConnect(e: PointerEvent, alt: boolean): void {
		const drag = this.drag;
		if (drag?.kind !== 'connect') return;
		const point = this.screenToWorld(e.clientX, e.clientY);
		this.clearDropTargets();
		const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
		const row = under?.closest<HTMLElement>('.sf-row[data-column]');
		const head = under?.closest<HTMLElement>('.sf-card-head');
		const card = under?.closest<HTMLElement>('.sf-card');
		const schema = this.store.schema;
		const source = findTable(schema, drag.table);
		const sourceColumn = source?.columns.find((c) => c.id === drag.column);
		let outcome: Outcome | null = null;
		let endX = point.x;
		let endY = point.y;
		const t = this.strings;
		if (source && sourceColumn && card?.dataset.table) {
			const target = findTable(schema, card.dataset.table);
			if (target && alt && target.id !== source.id) {
				const name = `${source.name}_${target.name}`;
				outcome = {
					valid: true,
					text: this.label(t.connect.junction, { name }),
					highlight: head ?? row ?? undefined,
					run: () => {
						const result = createJunction(this.store.schema, source.id, target.id);
						if (!result.tableId) return;
						const created = findTable(result.schema, result.tableId);
						this.host.commit(result.schema, this.label(t.history.junction, { x: created?.name ?? name }), { select: { ...emptySelection(), tables: [result.tableId] } });
						this.host.live.say(this.label(t.live.junctionCreated, { x: created?.name ?? name }));
					}
				};
			} else if (target && row?.dataset.column) {
				const targetColumn = target.columns.find((c) => c.id === row.dataset.column);
				if (targetColumn) outcome = this.columnOutcome(source, sourceColumn, target, targetColumn, row);
				const index = target.columns.findIndex((c) => c.id === targetColumn?.id);
				if (outcome?.valid && index >= 0) {
					endY = rowCentre(target, index);
					endX = point.x < target.x + CARD_WIDTH / 2 ? target.x : target.x + CARD_WIDTH;
				}
			} else if (target && head && target.id !== source.id) {
				const key = referencedKey(target);
				const keyColumn = target.columns.find((c) => c.id === key[0]);
				if (key.length === 0 || !keyColumn) {
					outcome = { valid: false, text: this.label(t.connect.notKey, { column: target.name }) };
				} else {
					const column = `${target.name}_${keyColumn.name}`;
					outcome = {
						valid: true,
						text: this.label(t.connect.createColumn, { table: source.name, column, target: `${target.name}.${keyColumn.name}` }),
						highlight: head,
						run: () => {
							const result = connectWithNewColumns(this.store.schema, source.id, target.id);
							if (!result.relationId) return;
							const label = `${source.name}.${findTable(result.schema, source.id)?.columns.find((c) => c.id === result.columnIds[0])?.name ?? column} → ${target.name}.${keyColumn.name}`;
							this.host.commit(result.schema, this.label(t.history.createRelation, { x: label }));
							this.host.live.say(this.label(t.live.relationCreated, { x: label }));
							this.flash(result.relationId);
						}
					};
				}
			} else if (target && target.id === source.id && head) {
				outcome = { valid: false, text: t.connect.sameColumn };
			}
		}
		drag.outcome = outcome;
		this.preview.setAttribute('d', `M ${drag.fromX} ${drag.fromY} C ${drag.fromX + (endX > drag.fromX ? 60 : -60)} ${drag.fromY}, ${endX + (endX > drag.fromX ? -60 : 60)} ${endY}, ${endX} ${endY}`);
		if (outcome?.highlight) outcome.highlight.classList.add(outcome.highlight.classList.contains('sf-card-head') ? 'is-drop-head' : outcome.warn ? 'is-drop-warn' : 'is-drop');
		this.showTag(e, outcome);
	}

	private columnOutcome(source: Table, sourceColumn: Column, target: Table, targetColumn: Column, row: HTMLElement): Outcome {
		const t = this.strings;
		if (source.id === target.id && sourceColumn.id === targetColumn.id) return { valid: false, text: t.connect.sameColumn };
		const isKey = (table: Table, column: Column) => (table.primaryKey.length === 1 && table.primaryKey[0] === column.id) || isUnique(table, column.id);
		let child = { table: source, column: sourceColumn };
		let parent = { table: target, column: targetColumn };
		if (isKey(source, sourceColumn) && !isKey(target, targetColumn)) {
			child = { table: target, column: targetColumn };
			parent = { table: source, column: sourceColumn };
		}
		const label = `${child.table.name}.${child.column.name} → ${parent.table.name}.${parent.column.name}`;
		const schema = this.store.schema;
		const exists = schema.relations.some((r) => r.fromTable === child.table.id && r.toTable === parent.table.id && r.fromColumns.length === 1 && r.fromColumns[0] === child.column.id && r.toColumns[0] === parent.column.id);
		if (exists) return { valid: false, text: t.connect.exists, highlight: row, warn: true };
		const replaced = schema.relations.find((r) => r.fromTable === child.table.id && r.fromColumns.length === 1 && r.fromColumns[0] === child.column.id);
		const warnings: string[] = [];
		if (!sameType(child.column.type, parent.column.type)) warnings.push(this.label(t.connect.typeMismatch, { a: displayType(child.column.type), b: displayType(parent.column.type) }));
		if (!isKey(parent.table, parent.column)) warnings.push(this.label(t.connect.notKey, { column: `${parent.table.name}.${parent.column.name}` }));
		if (replaced) {
			const replacedTarget = findTable(schema, replaced.toTable);
			const replacedColumn = replacedTarget?.columns.find((c) => c.id === replaced.toColumns[0]);
			warnings.push(this.label(t.connect.replaces, { target: `${replacedTarget?.name ?? ''}.${replacedColumn?.name ?? ''}` }));
		}
		return {
			valid: true,
			text: label,
			warning: warnings.join(' ') || undefined,
			warn: warnings.length > 0,
			highlight: row,
			run: () => {
				let next = this.store.schema;
				if (replaced) next = { ...next, relations: next.relations.filter((r) => r.id !== replaced.id) };
				const result = connectColumns(next, { fromTable: child.table.id, fromColumns: [child.column.id], toTable: parent.table.id, toColumns: [parent.column.id] });
				if (!result.relationId) return;
				this.host.commit(result.schema, this.label(t.history.createRelation, { x: label }));
				this.host.live.say(this.label(t.live.relationCreated, { x: label }));
				this.flash(result.relationId);
			}
		};
	}

	private finishConnect(): void {
		this.preview.setAttribute('d', '');
		this.tag.hidden = true;
		this.clearDropTargets();
		this.root.classList.remove('is-connecting');
		for (const el of this.root.querySelectorAll('.is-source')) el.classList.remove('is-source');
		this.updatePill(this.store.schema);
	}

	private cancelConnect(explain: boolean): void {
		const drag = this.drag;
		if (drag?.kind !== 'connect') return;
		this.drag = null;
		this.holdSelection(false);
		this.finishConnect();
		if (explain && this.cancelHints < 2) {
			this.cancelHints++;
			this.host.toasts.show(this.strings.connect.cancelled);
		}
	}

	private onPointerUpConnect(outcome: Outcome | null): void {
		if (outcome?.valid && outcome.run) outcome.run();
		else if (this.cancelHints < 2) {
			this.cancelHints++;
			this.host.toasts.show(this.strings.connect.cancelled);
		}
	}

	private onDoubleClick(e: MouseEvent): void {
		const hit = document.elementFromPoint(e.clientX, e.clientY);
		const target = (hit instanceof Element && this.root.contains(hit) ? hit : e.target) as HTMLElement;
		if (!this.root.contains(target)) return;
		if (target.closest('input, textarea, button, .sf-zoom, .sf-sheet, .sf-empty, .sf-palette')) return;
		const card = target.closest<HTMLElement>('.sf-card');
		if (card?.dataset.table) {
			const row = target.closest<HTMLElement>('.sf-row[data-column]');
			if (row?.dataset.column) {
				const field = target.closest('.sf-col-type') ? 'type' : 'name';
				this.startColumnEdit(card.dataset.table, row.dataset.column, field, 'existing');
			} else if (target.closest('.sf-card-head')) this.startRename(card.dataset.table);
			return;
		}
		const note = target.closest<HTMLElement>('.sf-note');
		if (note?.dataset.note) {
			this.startNoteEdit(note.dataset.note);
			return;
		}
		const areaTitle = target.closest<HTMLElement>('.sf-area-title');
		const area = areaTitle?.closest<HTMLElement>('.sf-area');
		if (area?.dataset.area) {
			this.startAreaEdit(area.dataset.area);
			return;
		}
		if (target.closest('.sf-edge')) return;
		this.createTable(this.screenToWorld(e.clientX, e.clientY));
	}

	private onContextMenu(e: MouseEvent, origin?: HTMLElement): void {
		const target = origin ?? (e.target as HTMLElement);
		if (target.closest('input, textarea, .sf-sheet, .sf-zoom, .sf-banner')) return;
		e.preventDefault();
		if (target.closest('.sf-palette')) return;
		if (!origin && e.button === 2 && ((this.drag?.kind === 'pan' && this.drag.menu) || performance.now() < this.menuGuard)) return;
		const at = { x: e.clientX, y: e.clientY };
		const t = this.strings;
		const card = target.closest<HTMLElement>('.sf-card');
		const row = target.closest<HTMLElement>('.sf-row[data-column]');
		if (card?.dataset.table && row?.dataset.column) {
			this.store.select({ ...emptySelection(), tables: [card.dataset.table] }, { table: card.dataset.table, column: row.dataset.column });
			this.host.menus.open(at, this.rowMenu(card.dataset.table, row.dataset.column), { label: row.getAttribute('aria-label') ?? '', returnFocus: row });
			return;
		}
		if (card?.dataset.table) {
			if (!this.store.selection.tables.includes(card.dataset.table)) this.store.select({ ...emptySelection(), tables: [card.dataset.table] });
			this.host.menus.open(at, this.tableMenu(card.dataset.table), { label: this.label(t.canvas.tableMenu, { name: findTable(this.store.schema, card.dataset.table)?.name ?? '' }), returnFocus: card });
			return;
		}
		const edge = target.closest<SVGGElement>('.sf-edge');
		if (edge?.dataset.relation) {
			const id = edge.dataset.relation;
			this.store.select({ ...emptySelection(), relations: [id] });
			this.render();
			this.host.menus.open(at, [
				{ label: t.ctx.editRelation, action: () => this.host.openRelationBubble(id, at) },
				{ kind: 'separator' },
				{ label: t.ctx.delete, danger: true, shortcut: t.shortcuts.keys.del, action: () => this.deleteRelationWithToast(id) }
			], { label: t.ctx.editRelation });
			return;
		}
		const note = target.closest<HTMLElement>('.sf-note');
		if (note?.dataset.note) {
			const id = note.dataset.note;
			this.store.select({ ...emptySelection(), notes: [id] });
			this.host.menus.open(at, [...this.colourItems('note', id), { kind: 'separator' }, { label: t.ctx.delete, danger: true, action: () => this.deleteSelectionWithToast() }], { label: t.canvas.note, returnFocus: note });
			return;
		}
		const area = target.closest<HTMLElement>('.sf-area');
		if (area?.dataset.area && target.closest('.sf-area-title')) {
			const id = area.dataset.area;
			this.store.select({ ...emptySelection(), areas: [id] });
			this.host.menus.open(at, [{ label: t.ctx.rename, action: () => this.startAreaEdit(id) }, ...this.colourItems('area', id), { kind: 'separator' }, { label: t.ctx.delete, danger: true, action: () => this.deleteSelectionWithToast() }], { label: t.canvas.area });
			return;
		}
		const point = this.screenToWorld(e.clientX, e.clientY);
		this.host.menus.open(at, [
			{ label: t.ctx.createTableHere, icon: 'table', shortcut: 'T', action: () => this.createTable(point) },
			{ label: t.ctx.createNoteHere, icon: 'note', shortcut: 'N', action: () => this.createNote(point) },
			{ label: t.ctx.createAreaHere, icon: 'area', shortcut: 'Z', action: () => this.createArea(point) }
		], { label: t.canvas.label });
	}

	private colourItems(kind: 'table' | 'note' | 'area', id: string): MenuItem[] {
		const t = this.strings;
		const current = kind === 'table' ? findTable(this.store.schema, id)?.color : kind === 'note' ? this.store.schema.notes.find((n) => n.id === id)?.color : this.store.schema.areas.find((a) => a.id === id)?.color;
		const items: MenuItem[] = [{ kind: 'separator' }];
		const colours: (string | undefined)[] = kind === 'table' ? [undefined, ...COLORS] : [...COLORS];
		for (const colour of colours) {
			items.push({
				kind: 'radio',
				label: `${t.ctx.colour}: ${t.colours[(colour ?? 'none') as keyof typeof t.colours]}`,
				checked: current === colour,
				swatch: colour ? COLOUR_TOKEN[colour] : 'none',
				action: () => {
					const schema = this.store.schema;
					if (kind === 'table') this.host.commit(updateTable(schema, id, { color: colour }), this.label(t.history.editTable, { x: findTable(schema, id)?.name ?? '' }));
					else if (kind === 'note') this.host.commit(updateNote(schema, id, { color: colour ?? 'amber' }), t.history.editNote);
					else this.host.commit(updateArea(schema, id, { color: colour ?? 'blue' }), this.label(t.history.editArea, { x: schema.areas.find((a) => a.id === id)?.title ?? '' }));
				}
			});
		}
		return items;
	}

	tableMenu(tableId: string): MenuItem[] {
		const t = this.strings;
		const table = findTable(this.store.schema, tableId);
		return [
			{ label: t.ctx.rename, shortcut: 'F2', action: () => this.startRename(tableId) },
			{ label: t.ctx.addColumn, shortcut: 'C', disabled: (table?.columns.length ?? 0) >= LIMITS.columns, action: () => this.addColumnAndEdit(tableId) },
			{ label: t.ctx.relate, shortcut: 'R', action: () => this.host.openRelate(tableId) },
			{ label: t.ctx.properties, shortcut: 'Alt+Enter', action: () => this.host.openProperties() },
			...this.colourItems('table', tableId),
			{ kind: 'separator' },
			{ label: t.ctx.duplicate, shortcut: `${modLabel}+D`, action: () => this.duplicateSelected() },
			{ label: t.ctx.delete, danger: true, shortcut: t.shortcuts.keys.del, action: () => this.deleteSelectionWithToast() }
		];
	}

	rowMenu(tableId: string, columnId: string): MenuItem[] {
		const t = this.strings;
		const table = findTable(this.store.schema, tableId);
		const column = table?.columns.find((c) => c.id === columnId);
		if (!table || !column) return [];
		const isPk = table.primaryKey.includes(columnId);
		return [
			{ label: t.ctx.rename, shortcut: 'F2', action: () => this.startColumnEdit(tableId, columnId, 'name', 'existing') },
			{ label: t.ctx.changeType, action: () => this.startColumnEdit(tableId, columnId, 'type', 'existing') },
			{ kind: 'separator' },
			{
				kind: 'check',
				label: t.ctx.primaryKey,
				checked: isPk,
				action: () => {
					const next = isPk ? table.primaryKey.filter((id) => id !== columnId) : [...table.primaryKey, columnId];
					this.host.commit(setPrimaryKey(this.store.schema, tableId, next), this.label(t.history.editColumn, { x: column.name }));
				}
			},
			{
				kind: 'check',
				label: t.ctx.allowsNull,
				checked: column.nullable && !isPk,
				disabled: isPk,
				action: () => this.host.commit(updateColumn(this.store.schema, tableId, columnId, { nullable: !column.nullable }), this.label(t.history.editColumn, { x: column.name }))
			},
			{
				kind: 'check',
				label: t.ctx.unique,
				checked: isUnique(table, columnId),
				action: () => this.host.commit(toggleUnique(this.store.schema, tableId, columnId), this.label(t.history.editColumn, { x: column.name }))
			},
			{ kind: 'separator' },
			{ label: t.ctx.relate, shortcut: 'R', action: () => this.host.openRelate(tableId, columnId) },
			{ label: t.ctx.deleteColumn, danger: true, shortcut: t.shortcuts.keys.del, action: () => this.deleteColumnWithToast(tableId, columnId) }
		];
	}

	deleteColumnWithToast(tableId: string, columnId: string): void {
		const t = this.strings;
		const schema = this.store.schema;
		const column = findTable(schema, tableId)?.columns.find((c) => c.id === columnId);
		if (!column) return;
		const relations = schema.relations.filter((r) => (r.fromTable === tableId && r.fromColumns.includes(columnId)) || (r.toTable === tableId && r.toColumns.includes(columnId))).length;
		const columns = findTable(schema, tableId)?.columns ?? [];
		const index = columns.findIndex((c) => c.id === columnId);
		this.host.commit(deleteColumn(schema, tableId, columnId), this.label(t.history.deleteColumn, { x: column.name }));
		const message = relations > 0 ? this.label(t.toast.columnAndRelations, { name: column.name, relations: plural(t.count.relations, relations) }) : this.label(t.toast.columnDeleted, { name: column.name });
		this.host.toastUndo(message);
		const next = findTable(this.store.schema, tableId)?.columns[Math.min(index, columns.length - 2)];
		if (next) this.cards.get(tableId)?.el.querySelector<HTMLElement>(`.sf-row[data-column="${next.id}"]`)?.focus();
		else this.cards.get(tableId)?.el.focus();
	}

	deleteRelationWithToast(relationId: string): void {
		const t = this.strings;
		const relation = this.store.schema.relations.find((r) => r.id === relationId);
		if (!relation) return;
		this.host.bubble.close(false);
		const label = this.relationLabel(relation);
		this.host.commit({ ...this.store.schema, relations: this.store.schema.relations.filter((r) => r.id !== relationId) }, this.label(t.history.deleteRelation, { x: label }));
		this.host.toastUndo(t.toast.relationDeleted);
		this.root.focus({ preventScroll: true });
	}

	relationLabel(relation: Relation): string {
		const schema = this.store.schema;
		const from = findTable(schema, relation.fromTable);
		const to = findTable(schema, relation.toTable);
		const fromCols = relation.fromColumns.map((id) => from?.columns.find((c) => c.id === id)?.name ?? '').join(', ');
		const toCols = relation.toColumns.map((id) => to?.columns.find((c) => c.id === id)?.name ?? '').join(', ');
		return `${from?.name ?? ''}.${fromCols} → ${to?.name ?? ''}.${toCols}`;
	}

	deleteSelectionWithToast(): void {
		const t = this.strings;
		const sel = this.store.selection;
		if (sel.relations.length === 1 && sel.tables.length + sel.notes.length + sel.areas.length === 0) {
			const id = sel.relations[0];
			if (id) this.deleteRelationWithToast(id);
			return;
		}
		const count = sel.tables.length + sel.notes.length + sel.areas.length;
		if (count === 0) return;
		const order = this.store.schema.tables.map((x) => x.id);
		const firstIndex = order.findIndex((id) => sel.tables.includes(id));
		const single = sel.tables.length === 1 && count === 1 ? findTable(this.store.schema, sel.tables[0] ?? '') : undefined;
		const label = single ? this.label(t.history.deleteTable, { x: single.name }) : this.label(t.history.deleteMany, { items: plural(t.count.items, count) });
		this.host.commit(deleteSelection(this.store.schema, sel), label, { select: emptySelection() });
		this.host.toastUndo(single ? this.label(t.toast.tableDeleted, { name: single.name }) : this.label(t.toast.itemsDeleted, { items: plural(t.count.items, count) }));
		if (single) this.host.live.say(this.label(t.live.tableDeleted, { x: single.name }));
		const next = this.store.schema.tables[Math.max(0, Math.min(firstIndex, this.store.schema.tables.length - 1))];
		if (next) this.cards.get(next.id)?.el.focus();
		else this.root.focus({ preventScroll: true });
	}

	duplicateSelected(): void {
		const t = this.strings;
		let schema = this.store.schema;
		const created: string[] = [];
		for (const id of this.store.selection.tables) {
			const result = duplicateTable(schema, id);
			if (result.tableId) {
				schema = result.schema;
				created.push(result.tableId);
			}
		}
		if (created.length === 0) return;
		this.host.commit(schema, this.label(t.history.duplicate, { items: plural(t.count.items, created.length) }), { select: { ...emptySelection(), tables: created } });
	}

	private onWheel(e: WheelEvent): void {
		if ((e.target as Element).closest('.sf-sheet, .sf-bubble, .sf-menu, textarea, .sf-typelist, .sf-palette')) return;
		e.preventDefault();
		const rect = this.root.getBoundingClientRect();
		if (e.ctrlKey || e.metaKey) {
			const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025));
			this.setZoom(this.store.view.zoom * factor, e.clientX - rect.left, e.clientY - rect.top);
			return;
		}
		const scale = e.deltaMode === 1 ? 16 : 1;
		const view = this.store.view;
		const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * scale;
		const dy = (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * scale;
		this.store.setView({ ...view, x: view.x - dx, y: view.y - dy });
	}

	private onKeyDown(e: KeyboardEvent): void {
		if (isTextField(e.target) || e.defaultPrevented) return;
		if ((e.target as Element).closest?.('.sf-palette')) return;
		if (this.host.menus.isOpen) return;
		const t = this.strings;
		const active = document.activeElement as HTMLElement | null;
		const card = active?.closest<HTMLElement>('.sf-card');
		const row = active?.closest<HTMLElement>('.sf-row[data-column]');
		const tableId = card?.dataset.table;
		const columnId = row?.dataset.column;
		const key = e.key;
		const ctrl = mod(e);
		if (key === 'Escape') {
			if (this.drag?.kind === 'connect') {
				this.cancelConnect(false);
				return;
			}
			if (row && card) {
				card.focus();
				return;
			}
			if (!isEmptySelection(this.store.selection)) {
				e.preventDefault();
				this.store.select(emptySelection());
				this.root.focus({ preventScroll: true });
			}
			return;
		}
		if (ctrl && (key === 'a' || key === 'A')) {
			e.preventDefault();
			const s0 = this.store.schema;
			this.store.select({ tables: s0.tables.map((x) => x.id), notes: s0.notes.map((n) => n.id), areas: s0.areas.map((a) => a.id), relations: [] });
			return;
		}
		if (ctrl && (key === 'd' || key === 'D')) {
			e.preventDefault();
			this.duplicateSelected();
			return;
		}
		if (ctrl || e.metaKey) return;
		if (row && tableId && columnId) {
			const table = findTable(this.store.schema, tableId);
			const index = table?.columns.findIndex((c) => c.id === columnId) ?? -1;
			if (key === 'ArrowDown' || key === 'ArrowUp') {
				e.preventDefault();
				if (e.altKey && table) {
					const to = index + (key === 'ArrowDown' ? 1 : -1);
					if (to >= 0 && to < table.columns.length) {
						const name = table.columns[index]?.name ?? '';
						this.store.focusColumn = { table: tableId, column: columnId };
						this.host.commit(moveColumn(this.store.schema, tableId, columnId, to), this.label(t.history.moveColumn, { x: name }));
						this.cards.get(tableId)?.el.querySelector<HTMLElement>(`.sf-row[data-column="${columnId}"]`)?.focus();
					}
					return;
				}
				const rows = [...(card?.querySelectorAll<HTMLElement>('.sf-row[data-column]') ?? [])];
				const at = rows.indexOf(row);
				const target = rows[at + (key === 'ArrowDown' ? 1 : -1)];
				if (target) target.focus();
				else if (key === 'ArrowDown') card?.querySelector<HTMLElement>('[data-add-column]')?.focus();
				return;
			}
			if (key === 'Enter' || key === 'F2') {
				e.preventDefault();
				this.startColumnEdit(tableId, columnId, 'name', 'existing');
				return;
			}
			if (key === 'Delete' || key === 'Backspace') {
				e.preventDefault();
				this.deleteColumnWithToast(tableId, columnId);
				return;
			}
			if (key === 'r' || key === 'R') {
				e.preventDefault();
				this.host.openRelate(tableId, columnId);
				return;
			}
			if (key === 'ContextMenu' || (key === 'F10' && e.shiftKey)) {
				e.preventDefault();
				const rect = row.getBoundingClientRect();
				this.host.menus.open({ x: rect.left + 24, y: rect.bottom }, this.rowMenu(tableId, columnId), { label: row.getAttribute('aria-label') ?? '', returnFocus: row });
				return;
			}
		}
		const note = active?.closest<HTMLElement>('.sf-note');
		const areaTitle = active?.closest<HTMLElement>('[data-area-title]');
		if ((key === 'Enter' || key === 'F2') && !e.altKey) {
			if (card && tableId && active === card) {
				e.preventDefault();
				this.startRename(tableId);
				return;
			}
			if (note?.dataset.note) {
				e.preventDefault();
				this.startNoteEdit(note.dataset.note);
				return;
			}
			const areaId = areaTitle?.closest<HTMLElement>('.sf-area')?.dataset.area;
			if (areaId) {
				e.preventDefault();
				this.startAreaEdit(areaId);
				return;
			}
		}
		if (key === 'ContextMenu' || (key === 'F10' && e.shiftKey)) {
			if (card && tableId) {
				e.preventDefault();
				const rect = card.getBoundingClientRect();
				this.host.menus.open({ x: rect.left + 24, y: rect.top + 40 }, this.tableMenu(tableId), { label: card.getAttribute('aria-label') ?? '', returnFocus: card });
			}
			return;
		}
		if (key.startsWith('Arrow')) {
			if (!card && !note && !areaTitle) return;
			e.preventDefault();
			const step = e.shiftKey ? 32 : 8;
			const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
			const dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
			let sel = this.store.selection;
			if (card && tableId && !sel.tables.includes(tableId)) sel = { ...emptySelection(), tables: [tableId] };
			if (note?.dataset.note && !sel.notes.includes(note.dataset.note)) sel = { ...emptySelection(), notes: [note.dataset.note] };
			const count = sel.tables.length + sel.notes.length + sel.areas.length;
			this.store.select(sel);
			this.host.commit(moveSelection(this.store.schema, sel, dx, dy), this.label(t.history.move, { items: plural(t.count.items, count) }), { coalesce: `nudge:${sel.tables.join()}${sel.notes.join()}${sel.areas.join()}` });
			return;
		}
		if (key === 'Delete' || key === 'Backspace') {
			if (card && tableId && !this.store.selection.tables.includes(tableId)) this.store.select({ ...emptySelection(), tables: [tableId] });
			if (!isEmptySelection(this.store.selection)) {
				e.preventDefault();
				this.deleteSelectionWithToast();
			}
			return;
		}
		if (e.altKey) return;
		const lower = key.toLowerCase();
		if (lower === 't') {
			e.preventDefault();
			this.createTable();
		} else if (lower === 'n') {
			e.preventDefault();
			this.createNote();
		} else if (lower === 'z') {
			e.preventDefault();
			this.createArea();
		} else if (lower === 'c' && tableId) {
			e.preventDefault();
			this.addColumnAndEdit(tableId);
		} else if (lower === 'r' && tableId) {
			e.preventDefault();
			this.host.openRelate(tableId);
		} else if (lower === 'f') {
			e.preventDefault();
			this.fit(null, true);
		} else if (key === '+' || key === '=') {
			e.preventDefault();
			this.setZoom(this.store.view.zoom * 1.2);
		} else if (key === '-' || key === '_') {
			e.preventDefault();
			this.setZoom(this.store.view.zoom / 1.2);
		} else if (key === '0') {
			e.preventDefault();
			this.setZoom(1);
		}
	}

}

export { COLOUR_TOKEN };
