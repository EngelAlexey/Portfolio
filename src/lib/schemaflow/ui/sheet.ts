import { DIALECT_LABELS } from '../dialects';
import {
	addIndex,
	deleteIndex,
	emptySelection,
	findTable,
	isUnique,
	sameType,
	setPrimaryKey,
	toggleUnique,
	updateArea,
	updateColumn,
	updateIndex,
	updateNote,
	updateTable,
	renameTable
} from '../model/ops';
import { COLORS, LIMITS, type Column, type DefaultValue, type LogicalType, type Table } from '../model/types';
import type { Severity } from '../parse/issues';
import { applyFix } from '../validate/fixes';
import type { DesignIssue } from '../validate/rules';
import { relationControls, type BubbleHost, type RelateRequest } from './bubbles';
import { COLOUR_TOKEN } from './canvas';
import { h, icon } from './dom';
import { ruleMessage } from './messages';
import type { Anchor } from './popups';
import type { Store } from './store';
import { fill, plural, summarize } from './strings';
import { TypePicker } from './type-picker';
import { displayType } from './types';

export type SheetTab = 'properties' | 'review';

export interface SheetHost extends BubbleHost {
	overlay: HTMLElement;
	toasts: { show(text: string): void };
	openRelate(request: RelateRequest, anchor?: Anchor): void;
	openRelationBubble(relationId: string, at: Element): void;
	frame(kind: 'table' | 'relation', id: string): void;
	createArea(): void;
	duplicateSelected(): void;
	deleteSelected(): void;
	addColumn(tableId: string): void;
	deleteColumn(tableId: string, columnId: string): void;
	onClose(): void;
	onTab(tab: SheetTab): void;
	scoreInfo(anchor: HTMLElement): void;
}

const ONLY: Partial<Record<DesignIssue['rule'], string>> = {
	'fk-cascade-paths': 'sqlserver',
	'fk-restrict': 'sqlserver',
	'autoincrement-not-key': 'mysql',
	'mysql-timestamp-range': 'mysql',
	'mongo-actions': 'mongodb',
	'mongo-defaults': 'mongodb',
	'mongo-composite-pk': 'mongodb'
};

export class Sheet {
	tab: SheetTab = 'properties';
	open = false;
	private body: HTMLElement;
	private tabs: Record<SheetTab, HTMLButtonElement>;
	private expanded = new Set<string>();
	private indexDraft: string | null = null;

	constructor(
		private readonly store: Store,
		private readonly host: SheetHost,
		private readonly root: HTMLElement
	) {
		const t = host.strings;
		const head = h('div', { class: 'sf-sheet-head' });
		const tablist = h('div', { class: 'sf-sheet-tabs', role: 'tablist', 'aria-label': t.props.sheet });
		this.tabs = {
			properties: h('button', { type: 'button', role: 'tab', class: 'sf-sheet-tab', id: 'sf-sheet-properties', 'aria-controls': 'sf-sheet-body', text: t.props.tab }),
			review: h('button', { type: 'button', role: 'tab', class: 'sf-sheet-tab', id: 'sf-sheet-review', 'aria-controls': 'sf-sheet-body', text: t.review.tab })
		};
		for (const key of ['properties', 'review'] as const) {
			this.tabs[key].addEventListener('click', () => this.show(key));
			this.tabs[key].addEventListener('keydown', (event) => {
				if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
					event.preventDefault();
					const next = key === 'properties' ? 'review' : 'properties';
					this.show(next);
					this.tabs[next].focus();
				}
			});
			tablist.append(this.tabs[key]);
		}
		const close = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': t.props.close, 'data-tip': t.props.close });
		close.append(icon('close', 16));
		close.addEventListener('click', () => this.close());
		head.append(tablist, close);
		this.body = h('div', { class: 'sf-sheet-body', id: 'sf-sheet-body', role: 'tabpanel' });
		root.append(head, this.body);
		root.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && !(event.target as HTMLElement).closest('input, textarea, select')) {
				event.stopPropagation();
				this.close();
			}
		});
		store.on('schema', () => this.render());
		store.on('selection', () => {
			if (this.tab === 'properties') this.render();
		});
		store.on('dialect', () => this.render());
	}

	show(tab: SheetTab, focus = false): void {
		this.tab = tab;
		this.open = true;
		this.root.hidden = false;
		this.host.onTab(tab);
		this.render();
		if (focus) this.tabs[tab].focus();
	}

	close(): void {
		if (!this.open) return;
		this.open = false;
		this.root.hidden = true;
		this.host.onClose();
	}

	toggle(tab: SheetTab): void {
		if (this.open && this.tab === tab) this.close();
		else this.show(tab, true);
	}

	render(): void {
		if (!this.open) return;
		for (const key of ['properties', 'review'] as const) {
			const active = key === this.tab;
			this.tabs[key].setAttribute('aria-selected', String(active));
			this.tabs[key].tabIndex = active ? 0 : -1;
		}
		this.body.setAttribute('aria-labelledby', `sf-sheet-${this.tab}`);
		const active = document.activeElement as HTMLElement | null;
		const key = this.body.contains(active) ? active?.dataset.key : undefined;
		const selStart = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.selectionStart : null;
		const scroll = this.body.scrollTop;
		this.body.replaceChildren(this.tab === 'review' ? this.review() : this.properties());
		this.body.scrollTop = scroll;
		if (key) {
			const next = this.body.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
			next?.focus();
			if (next && selStart !== null && (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement)) next.setSelectionRange(selStart, selStart);
		}
	}

	private review(): HTMLElement {
		const t = this.host.strings;
		const schema = this.store.schema;
		const dialect = DIALECT_LABELS[this.store.dialect];
		const box = h('div', { class: 'sf-review' });
		const score = this.store.score();
		const head = h('div', { class: 'sf-review-head' });
		const value = h('span', { class: 'sf-review-score' });
		value.append(h('span', { class: 'sf-score-dot', 'data-level': score === null ? '' : score >= 90 ? 'ok' : score >= 70 ? 'medium' : score >= 50 ? 'high' : 'critical', 'aria-hidden': 'true' }), score === null ? t.bar.scoreEmpty : fill(t.bar.score, { n: score }));
		const info = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': t.review.scoreInfoLabel, 'data-tip': t.review.scoreInfoLabel });
		info.append(icon('info', 15));
		info.addEventListener('click', () => this.host.scoreInfo(info));
		head.append(value, info);
		box.append(head);
		if (schema.tables.length === 0) {
			box.append(h('p', { class: 'sf-empty-note', text: t.review.noTables }));
			return box;
		}
		const issues = this.store.issues();
		const counts = { error: 0, warning: 0, info: 0 };
		for (const i of issues) counts[i.severity]++;
		if (issues.length === 0) {
			box.append(h('p', { class: 'sf-empty-note', text: fill(t.review.none, { dialect }) }));
			return box;
		}
		box.append(h('p', { class: 'sf-review-summary', text: fill(t.review.summary, { summary: summarize(t, counts), dialect }) }));
		const groups: [Severity, string][] = [
			['error', t.review.errors],
			['warning', t.review.warnings],
			['info', t.review.suggestions]
		];
		for (const [level, title] of groups) {
			const list = issues.filter((i) => i.severity === level);
			if (list.length === 0) continue;
			box.append(h('h3', { class: 'sf-review-group', text: `${title} (${list.length})` }));
			const ul = h('ul', { class: 'sf-review-list', role: 'list' });
			for (const item of list) ul.append(this.reviewItem(item));
			box.append(ul);
		}
		return box;
	}

	private reviewItem(item: DesignIssue): HTMLElement {
		const t = this.host.strings;
		const message = ruleMessage(t.engine, this.store.dialect, item);
		const li = h('li', { class: `sf-review-item sf-level-${item.severity}` });
		const button = h('button', { type: 'button', class: 'sf-review-main', 'data-key': `review:${item.key}` });
		const only = ONLY[item.rule];
		const meta = h('span', { class: 'sf-review-meta' });
		meta.append(h('span', { class: 'sf-review-level', text: t.engine.severity[item.severity] }));
		if (only) meta.append(h('span', { class: 'sf-tag', text: `${DIALECT_LABELS[only as keyof typeof DIALECT_LABELS]}` }));
		button.append(meta, h('span', { class: 'sf-review-title', text: message.title }), h('span', { class: 'sf-review-body', text: message.body }));
		button.addEventListener('click', () => {
			if (item.relation) {
				this.store.select({ ...emptySelection(), relations: [item.relation] });
				this.host.frame('relation', item.relation);
			} else if (item.table) {
				this.store.select({ ...emptySelection(), tables: [item.table] }, item.column ? { table: item.table, column: item.column } : null);
				this.host.frame('table', item.table);
			}
		});
		li.append(button);
		if (message.fix && item.fix) {
			const fix = h('button', { type: 'button', class: 'sf-btn sf-btn-small', 'data-key': `fix:${item.key}` });
			fix.append(icon('check', 13), h('span', { text: message.fix }));
			fix.addEventListener('click', () => {
				this.host.commit(applyFix(this.store.schema, item), fill(t.history.fix, { x: message.fix ?? '' }));
				this.host.toasts.show(fill(t.review.fixed, { fix: message.fix ?? '' }));
			});
			li.append(fix);
		}
		return li;
	}

	private properties(): HTMLElement {
		const t = this.host.strings;
		const schema = this.store.schema;
		const sel = this.store.selection;
		const count = sel.tables.length + sel.notes.length + sel.areas.length;
		if (sel.relations.length === 1 && count === 0) {
			const id = sel.relations[0] ?? '';
			return relationControls(this.store, this.host, id, () => this.render());
		}
		if (count > 1) return this.several(count);
		if (sel.tables.length === 1) {
			const table = findTable(schema, sel.tables[0] ?? '');
			if (table) return this.tableForm(table);
		}
		if (sel.notes.length === 1) {
			const note = schema.notes.find((n) => n.id === sel.notes[0]);
			if (note) {
				const box = h('div', { class: 'sf-props' });
				const area = h('textarea', { class: 'sf-input', rows: 6, maxlength: String(LIMITS.noteText), 'data-key': `note:${note.id}`, id: 'sf-note-text' });
				area.value = note.text;
				area.addEventListener('input', () => this.host.commit(updateNote(this.store.schema, note.id, { text: area.value }), t.history.editNote, { coalesce: `note:${note.id}` }));
				box.append(this.field(t.props.text, area, 'sf-note-text'), this.colours(note.color, (c) => this.host.commit(updateNote(this.store.schema, note.id, { color: c ?? 'amber' }), t.history.editNote), false));
				return box;
			}
		}
		if (sel.areas.length === 1) {
			const area = schema.areas.find((a) => a.id === sel.areas[0]);
			if (area) {
				const box = h('div', { class: 'sf-props' });
				const input = h('input', { class: 'sf-input', value: area.title, maxlength: String(LIMITS.name), 'data-key': `area:${area.id}`, id: 'sf-area-title' });
				input.addEventListener('input', () => this.host.commit(updateArea(this.store.schema, area.id, { title: input.value }), fill(t.history.editArea, { x: area.title }), { coalesce: `area:${area.id}` }));
				box.append(this.field(t.props.title, input, 'sf-area-title'), this.colours(area.color, (c) => this.host.commit(updateArea(this.store.schema, area.id, { color: c ?? 'blue' }), fill(t.history.editArea, { x: area.title })), false));
				return box;
			}
		}
		const box = h('div', { class: 'sf-props' });
		box.append(h('p', { class: 'sf-empty-note', text: t.props.empty }));
		box.append(h('h3', { class: 'sf-props-title', text: t.props.summary }));
		const dl = h('dl', { class: 'sf-summary' });
		const add = (k: string, v: string) => dl.append(h('dt', { text: k }), h('dd', { text: v }));
		add(t.bar.designName, schema.name || t.bar.untitled);
		add(t.props.columns, `${plural(t.count.tables, schema.tables.length)} · ${plural(t.count.relations, schema.relations.length)}`);
		add(t.props.dialect, DIALECT_LABELS[this.store.dialect]);
		const extras = new Map<string, number>();
		for (const e of schema.extras) extras.set(e.dialect, (extras.get(e.dialect) ?? 0) + 1);
		if (extras.size > 0) add(t.props.extras, [...extras].map(([d, n]) => plural(t.props.extrasCount, n, { dialect: DIALECT_LABELS[d as keyof typeof DIALECT_LABELS] })).join(' · '));
		box.append(dl);
		return box;
	}

	private several(count: number): HTMLElement {
		const t = this.host.strings;
		const box = h('div', { class: 'sf-props' });
		box.append(h('p', { class: 'sf-props-title', text: fill(t.props.several, { items: plural(t.count.items, count) }) }));
		const row = h('div', { class: 'sf-props-actions' });
		const wrap = h('button', { type: 'button', class: 'sf-btn', text: t.ctx.wrapInArea });
		wrap.addEventListener('click', () => this.host.createArea());
		const duplicate = h('button', { type: 'button', class: 'sf-btn', text: t.ctx.duplicate });
		duplicate.addEventListener('click', () => this.host.duplicateSelected());
		const remove = h('button', { type: 'button', class: 'sf-btn sf-btn-danger', text: t.ctx.delete });
		remove.addEventListener('click', () => this.host.deleteSelected());
		row.append(wrap, duplicate, remove);
		box.append(row);
		return box;
	}

	private field(label: string, control: HTMLElement, id: string): HTMLElement {
		const f = h('div', { class: 'sf-field' });
		f.append(h('label', { class: 'sf-label', for: id, text: label }), control);
		return f;
	}

	private colours(current: string | undefined, apply: (colour: string | undefined) => void, allowNone: boolean): HTMLElement {
		const t = this.host.strings;
		const group = h('div', { class: 'sf-field' });
		group.append(h('span', { class: 'sf-label', id: 'sf-colour-label', text: t.props.colour }));
		const row = h('div', { class: 'sf-swatches', role: 'radiogroup', 'aria-labelledby': 'sf-colour-label' });
		const options: (string | undefined)[] = allowNone ? [undefined, ...COLORS] : [...COLORS];
		for (const colour of options) {
			const name = t.colours[(colour ?? 'none') as keyof typeof t.colours];
			const button = h('button', { type: 'button', role: 'radio', class: `sf-swatch-btn sf-swatch-${colour ? COLOUR_TOKEN[colour] : 'none'}`, 'aria-checked': String(current === colour), 'aria-label': name, 'data-tip': name, 'data-key': `colour:${colour ?? 'none'}` });
			button.addEventListener('click', () => apply(colour));
			row.append(button);
		}
		group.append(row);
		return group;
	}

	private tableForm(table: Table): HTMLElement {
		const t = this.host.strings;
		const box = h('div', { class: 'sf-props' });
		const name = h('input', { class: 'sf-input sf-mono', id: 'sf-prop-name', value: table.name, maxlength: String(LIMITS.name), 'data-key': `table-name:${table.id}`, spellcheck: 'false' });
		name.addEventListener('change', () => {
			if (name.value.trim()) this.host.commit(renameTable(this.store.schema, table.id, name.value), fill(t.history.rename, { x: table.name }));
		});
		box.append(this.field(t.props.name, name, 'sf-prop-name'));
		box.append(this.colours(table.color, (c) => this.host.commit(updateTable(this.store.schema, table.id, { color: c }), fill(t.history.editTable, { x: table.name })), true));
		const comment = h('textarea', { class: 'sf-input', id: 'sf-prop-comment', rows: 2, maxlength: '1000', 'data-key': `table-comment:${table.id}` });
		comment.value = table.comment ?? '';
		comment.addEventListener('change', () => this.host.commit(updateTable(this.store.schema, table.id, { comment: comment.value || undefined }), fill(t.history.editTable, { x: table.name })));
		box.append(this.field(t.props.comment, comment, 'sf-prop-comment'));

		box.append(h('h3', { class: 'sf-props-title', text: t.props.columns }));
		const list = h('ul', { class: 'sf-col-list', role: 'list' });
		const focus = this.store.focusColumn?.table === table.id ? this.store.focusColumn.column : null;
		if (focus) this.expanded.add(focus);
		for (const column of table.columns) list.append(this.columnRow(table, column));
		box.append(list);
		const addButton = h('button', { type: 'button', class: 'sf-btn sf-btn-dashed', 'data-key': `add-col:${table.id}`, disabled: table.columns.length >= LIMITS.columns ? true : null });
		addButton.append(icon('plus', 14), h('span', { text: t.canvas.addColumn }));
		addButton.addEventListener('click', () => this.host.addColumn(table.id));
		box.append(addButton);

		box.append(h('h3', { class: 'sf-props-title', text: t.props.relations }));
		const relations = this.store.schema.relations.filter((r) => r.fromTable === table.id || r.toTable === table.id);
		if (relations.length === 0) box.append(h('p', { class: 'sf-empty-note', text: t.props.noRelations }));
		const rl = h('ul', { class: 'sf-rel-list', role: 'list' });
		for (const relation of relations) {
			const label = this.host.relationLabel(relation);
			const [a, b] = label.split(' → ');
			const button = h('button', { type: 'button', class: 'sf-rel-btn sf-mono', 'aria-label': fill(t.props.editRelation, { a: a ?? '', b: b ?? '' }), text: label });
			button.addEventListener('click', () => this.host.openRelationBubble(relation.id, button));
			rl.append(h('li', {}, button));
		}
		box.append(rl);
		const relate = h('button', { type: 'button', class: 'sf-btn', text: t.ctx.relate });
		relate.addEventListener('click', () => this.host.openRelate({ tableId: table.id }, relate));
		box.append(relate);

		box.append(h('h3', { class: 'sf-props-title', text: t.props.indexes }));
		if (table.indexes.length === 0) box.append(h('p', { class: 'sf-empty-note', text: t.props.noIndexes }));
		for (const index of table.indexes) {
			const row = h('div', { class: 'sf-index-row' });
			row.append(h('span', { class: 'sf-mono', text: index.columns.map((id) => table.columns.find((c) => c.id === id)?.name ?? '').join(', ') }));
			const unique = h('label', { class: 'sf-check' });
			const checkbox = h('input', { type: 'checkbox', checked: index.unique ? true : null, 'data-key': `index-unique:${index.id}` });
			checkbox.addEventListener('change', () => this.host.commit(updateIndex(this.store.schema, table.id, index.id, { unique: checkbox.checked }), fill(t.history.index, { x: table.name })));
			unique.append(checkbox, h('span', { text: t.props.indexUnique }));
			const remove = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': t.props.deleteIndex, 'data-tip': t.props.deleteIndex });
			remove.append(icon('trash', 14));
			remove.addEventListener('click', () => this.host.commit(deleteIndex(this.store.schema, table.id, index.id), fill(t.history.index, { x: table.name })));
			row.append(unique, remove);
			box.append(row);
		}
		if (this.indexDraft === table.id) {
			const form = h('fieldset', { class: 'sf-index-draft' });
			form.append(h('legend', { class: 'sf-label', text: t.props.indexColumns }));
			const checks: HTMLInputElement[] = [];
			for (const column of table.columns) {
				const label = h('label', { class: 'sf-check' });
				const input = h('input', { type: 'checkbox', value: column.id });
				checks.push(input);
				label.append(input, h('span', { class: 'sf-mono', text: column.name }));
				form.append(label);
			}
			const actions = h('div', { class: 'sf-props-actions' });
			const cancel = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.cancel });
			cancel.addEventListener('click', () => {
				this.indexDraft = null;
				this.render();
			});
			const save = h('button', { type: 'button', class: 'sf-btn sf-btn-primary', text: t.props.addIndex });
			save.addEventListener('click', () => {
				const ids = checks.filter((c) => c.checked).map((c) => c.value);
				this.indexDraft = null;
				if (ids.length > 0) this.host.commit(addIndex(this.store.schema, table.id, ids), fill(t.history.index, { x: table.name }));
				else this.render();
			});
			actions.append(cancel, save);
			form.append(actions);
			box.append(form);
		} else {
			const addIndexButton = h('button', { type: 'button', class: 'sf-btn' });
			addIndexButton.append(icon('plus', 14), h('span', { text: t.props.addIndex }));
			addIndexButton.addEventListener('click', () => {
				this.indexDraft = table.id;
				this.render();
			});
			box.append(addIndexButton);
		}
		const remove = h('button', { type: 'button', class: 'sf-btn sf-btn-danger sf-props-delete' });
		remove.append(icon('trash', 14), h('span', { text: t.props.deleteTable }));
		remove.addEventListener('click', () => this.host.deleteSelected());
		box.append(remove);
		if (focus) requestAnimationFrame(() => this.body.querySelector(`[data-column-row="${focus}"]`)?.scrollIntoView({ block: 'nearest' }));
		return box;
	}

	private columnRow(table: Table, column: Column): HTMLElement {
		const t = this.host.strings;
		const label = fill(t.history.editColumn, { x: column.name });
		const isPk = table.primaryKey.includes(column.id);
		const li = h('li', { class: 'sf-col-edit', 'data-column-row': column.id });
		const line = h('div', { class: 'sf-col-line' });
		const name = h('input', { class: 'sf-input sf-mono', value: column.name, 'aria-label': t.props.name, maxlength: String(LIMITS.name), 'data-key': `col-name:${column.id}`, spellcheck: 'false' });
		name.addEventListener('change', () => {
			if (name.value.trim()) this.host.commit(updateColumn(this.store.schema, table.id, column.id, { name: name.value }), fill(t.history.rename, { x: column.name }));
		});
		const type = h('input', { class: 'sf-input sf-mono sf-type-input', value: displayType(column.type), 'aria-label': t.props.type, 'data-key': `col-type:${column.id}`, spellcheck: 'false', autocomplete: 'off' });
		let settled = false;
		const settle = (mode: 'enter' | 'blur') => {
			if (settled) return;
			settled = true;
			const parsed = picker.resolve(mode);
			picker.close();
			if (!parsed) {
				this.host.toasts.show(fill(t.types.invalid, { dialect: DIALECT_LABELS[this.store.dialect] }));
				type.value = displayType(column.type);
			} else if (sameType(parsed, column.type)) type.value = displayType(column.type);
			else this.host.commit(updateColumn(this.store.schema, table.id, column.id, { type: parsed }), fill(t.history.changeType, { x: column.name }));
		};
		const picker = new TypePicker({ input: type, strings: t, overlay: this.host.overlay, dialect: () => this.store.dialect, onPick: () => settle('enter') });
		type.addEventListener('input', () => (settled = false));
		type.addEventListener('click', () => {
			settled = false;
			picker.open();
		});
		type.addEventListener('focus', () => type.select());
		type.addEventListener('keydown', (event) => {
			if (picker.handleKey(event)) return;
			if (event.key === 'Enter') {
				event.preventDefault();
				settle('enter');
			} else if (event.key === 'Escape' && picker.isOpen) {
				event.stopPropagation();
				settled = true;
				picker.close();
				type.value = displayType(column.type);
			}
		});
		type.addEventListener('blur', () => settle('blur'));
		const expand = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-expanded': String(this.expanded.has(column.id)), 'aria-label': fill(t.props.expand, { name: column.name }), 'data-key': `expand:${column.id}` });
		expand.append(icon('chevron', 14));
		expand.addEventListener('click', () => {
			if (this.expanded.has(column.id)) this.expanded.delete(column.id);
			else this.expanded.add(column.id);
			this.render();
		});
		line.append(name, type, expand);
		li.append(line);
		const flags = h('div', { class: 'sf-col-flags' });
		const flag = (text: string, checked: boolean, disabled: boolean, key: string, onChange: (value: boolean) => void) => {
			const wrap = h('label', { class: 'sf-flag' });
			const input = h('input', { type: 'checkbox', checked: checked ? true : null, disabled: disabled ? true : null, 'data-key': key });
			input.addEventListener('change', () => onChange(input.checked));
			wrap.append(input, h('span', { text }));
			return wrap;
		};
		flags.append(
			flag(t.props.primaryKey, isPk, false, `pk:${column.id}`, (v) => this.host.commit(setPrimaryKey(this.store.schema, table.id, v ? [...table.primaryKey, column.id] : table.primaryKey.filter((id) => id !== column.id)), label)),
			flag(t.props.allowsNull, column.nullable && !isPk, isPk, `null:${column.id}`, (v) => this.host.commit(updateColumn(this.store.schema, table.id, column.id, { nullable: v }), label)),
			flag(t.props.unique, isUnique(table, column.id), false, `uq:${column.id}`, () => this.host.commit(toggleUnique(this.store.schema, table.id, column.id), label))
		);
		li.append(flags);
		if (this.expanded.has(column.id)) li.append(this.columnDetails(table, column, label));
		return li;
	}

	private typeFields(table: Table, column: Column, label: string): HTMLElement | null {
		const t = this.host.strings;
		const type = column.type;
		if (type.kind !== 'varchar' && type.kind !== 'char' && type.kind !== 'decimal') return null;
		const numeric = (title: string, id: string, value: number | undefined, min: number, max: number, locked: boolean, invalid: string, apply: (n: number | undefined) => LogicalType): HTMLElement => {
			const input = h('input', { class: 'sf-input sf-mono', id, inputmode: 'numeric', value: value === undefined ? '' : String(value), disabled: locked ? true : null, 'data-key': id });
			input.addEventListener('change', () => {
				const raw = input.value.trim();
				const n = raw === '' ? undefined : Number(raw);
				if (n !== undefined && (!Number.isInteger(n) || n < min || n > max)) {
					this.host.toasts.show(invalid);
					input.value = value === undefined ? '' : String(value);
					return;
				}
				this.host.commit(updateColumn(this.store.schema, table.id, column.id, { type: apply(n) }), label);
			});
			return this.field(title, input, id);
		};
		const box = h('div', { class: 'sf-type-fields' });
		if (type.kind === 'decimal') {
			const precision = type.precision;
			box.append(
				numeric(t.props.precision, `sf-prec-${column.id}`, precision, 1, 1000, false, t.types.precisionInvalid, (n) => (n === undefined ? { kind: 'decimal' } : { kind: 'decimal', precision: n, scale: Math.min(type.scale ?? 0, n) })),
				numeric(t.props.scale, `sf-scale-${column.id}`, type.scale, 0, precision ?? 0, precision === undefined, fill(t.types.scaleInvalid, { max: precision ?? 0 }), (n) => ({ kind: 'decimal', precision: precision ?? 0, scale: n ?? 0 }))
			);
		} else {
			box.append(numeric(t.props.length, `sf-len-${column.id}`, type.length, 1, 1_000_000, false, t.types.lengthInvalid, (n) => (n === undefined ? { kind: type.kind } : { kind: type.kind, length: n })));
		}
		return box;
	}

	private columnDetails(table: Table, column: Column, label: string): HTMLElement {
		const t = this.host.strings;
		const box = h('div', { class: 'sf-col-details' });
		const typeFields = this.typeFields(table, column, label);
		if (typeFields) box.append(typeFields);
		const id = `sf-default-${column.id}`;
		const select = h('select', { class: 'sf-select', id, 'data-key': `default:${column.id}` });
		const kinds: DefaultValue['kind'][] = ['none', 'now', 'uuid', 'autoincrement', 'literal'];
		if (column.default.kind === 'expression' || column.default.kind === 'computed') kinds.push(column.default.kind);
		for (const kind of kinds) {
			const text = fill(t.props.defaults[kind], { dialect: 'dialect' in column.default ? DIALECT_LABELS[column.default.dialect] : '' });
			select.append(h('option', { value: kind, text, selected: column.default.kind === kind ? true : null }));
		}
		select.addEventListener('change', () => {
			const kind = select.value as DefaultValue['kind'];
			let value: DefaultValue = { kind: 'none' };
			if (kind === 'now' || kind === 'uuid' || kind === 'autoincrement' || kind === 'none') value = { kind };
			else if (kind === 'literal') value = { kind: 'literal', value: '' };
			else value = column.default;
			this.host.commit(updateColumn(this.store.schema, table.id, column.id, { default: value }), label);
		});
		box.append(this.field(t.props.default, select, id));
		if (column.default.kind === 'literal') {
			const literalId = `sf-literal-${column.id}`;
			const literal = h('input', { class: 'sf-input sf-mono', id: literalId, value: column.default.value === null ? 'NULL' : String(column.default.value), 'data-key': `literal:${column.id}` });
			literal.addEventListener('change', () => {
				const raw = literal.value;
				let value: string | number | boolean | null = raw;
				if (/^null$/i.test(raw)) value = null;
				else if (column.type.kind === 'boolean' && /^(true|false)$/i.test(raw)) value = /^true$/i.test(raw);
				else if (/^-?\d+(\.\d+)?$/.test(raw) && column.type.kind !== 'varchar' && column.type.kind !== 'char' && column.type.kind !== 'text') value = Number(raw);
				this.host.commit(updateColumn(this.store.schema, table.id, column.id, { default: { kind: 'literal', value } }), label);
			});
			box.append(this.field(t.props.literalValue, literal, literalId));
		}
		const commentId = `sf-col-comment-${column.id}`;
		const comment = h('textarea', { class: 'sf-input', id: commentId, rows: 2, maxlength: '1000', 'data-key': `col-comment:${column.id}` });
		comment.value = column.comment ?? '';
		comment.addEventListener('change', () => this.host.commit(updateColumn(this.store.schema, table.id, column.id, { comment: comment.value || undefined }), label));
		box.append(this.field(t.props.comment, comment, commentId));
		const remove = h('button', { type: 'button', class: 'sf-btn sf-btn-danger sf-btn-small' });
		remove.append(icon('trash', 13), h('span', { text: t.ctx.deleteColumn }));
		remove.addEventListener('click', () => this.host.deleteColumn(table.id, column.id));
		box.append(remove);
		return box;
	}
}

