import {
	convertToJunction,
	emptySelection,
	findTable,
	isOneToOne,
	isUnique,
	referencedKey,
	sameType,
	setOneToOne,
	updateColumn,
	updateRelation
} from '../model/ops';
import { planRelation, type RelationKind, type RelationPlan, type RelationRequest } from '../model/relate';
import { ACTIONS, LIMITS, type Action, type Relation, type Schema, type Table } from '../model/types';
import type { Selection } from '../model/ops';
import { h, icon } from './dom';
import type { Anchor, Bubble, Live } from './popups';
import type { Store } from './store';
import { fill, type Strings } from './strings';
import { displayType } from './types';

export interface BubbleHost {
	strings: Strings;
	bubble: Bubble;
	live: Live;
	commit(next: Schema, label: string, options?: { coalesce?: string; select?: Selection }): void;
	relationLabel(relation: Relation): string;
	deleteRelation(relationId: string): void;
	flash(relationId: string): void;
}

function names(schema: Schema, relation: Relation) {
	const child = findTable(schema, relation.fromTable);
	const parent = findTable(schema, relation.toTable);
	const col = relation.fromColumns.map((id) => child?.columns.find((c) => c.id === id)?.name ?? '').join(', ');
	return { c: child?.name ?? '', p: parent?.name ?? '', col, child, parent };
}

export function relationControls(store: Store, host: BubbleHost, relationId: string, rerender: () => void): HTMLElement {
	const t = host.strings;
	const schema = store.schema;
	const relation = schema.relations.find((r) => r.id === relationId);
	const box = h('div', { class: 'sf-relation' });
	if (!relation) return box;
	const n = names(schema, relation);
	const words = { c: n.c, p: n.p, col: n.col };
	const oneToOne = isOneToOne(schema, relation);
	box.append(h('p', { class: 'sf-bubble-title sf-mono', text: host.relationLabel(relation) }));
	box.append(h('p', { class: 'sf-bubble-text', text: fill(oneToOne ? t.rel.oneToOne : t.rel.oneToMany, words) }));
	box.append(h('hr', { class: 'sf-sep' }));
	const mongo = store.dialect === 'mongodb';
	const label = host.relationLabel(relation);
	for (const kind of ['onDelete', 'onUpdate'] as const) {
		const id = `sf-${kind}-${relationId}`;
		const field = h('div', { class: 'sf-field' });
		field.append(h('label', { for: id, class: 'sf-label', text: fill(kind === 'onDelete' ? t.rel.onDelete : t.rel.onUpdate, words) }));
		const select = h('select', { id, class: 'sf-select sf-mono', 'data-key': id });
		for (const action of ACTIONS) select.append(h('option', { value: action, text: action, selected: relation[kind] === action ? true : null }));
		select.addEventListener('change', () => {
			host.commit(updateRelation(store.schema, relationId, { [kind]: select.value as Action }), fill(t.history.editRelation, { x: label }));
			rerender();
		});
		field.append(select);
		if (!mongo) {
			const sentences = kind === 'onDelete' ? t.rel.del : t.rel.upd;
			field.append(h('p', { class: 'sf-help', text: fill(sentences[relation[kind]], words) }));
			const action = relation[kind];
			const notNull = relation.fromColumns.some((cid) => n.child?.columns.find((c) => c.id === cid)?.nullable === false);
			const noDefault = relation.fromColumns.some((cid) => n.child?.columns.find((c) => c.id === cid)?.default.kind === 'none');
			if (action === 'SET NULL' && notNull) {
				const conflict = h('div', { class: 'sf-conflict' });
				conflict.append(h('span', { text: fill(t.rel.conflictNull, words) }));
				const fix = h('button', { type: 'button', class: 'sf-btn', text: t.rel.allowNull });
				fix.addEventListener('click', () => {
					let next = store.schema;
					for (const cid of relation.fromColumns) next = updateColumn(next, relation.fromTable, cid, { nullable: true });
					host.commit(next, fill(t.history.editRelation, { x: label }));
					rerender();
				});
				conflict.append(fix);
				field.append(conflict);
			}
			if (action === 'SET DEFAULT' && noDefault) field.append(h('p', { class: 'sf-conflict', text: fill(t.rel.conflictDefault, words) }));
		}
		box.append(field);
	}
	if (mongo) box.append(h('p', { class: 'sf-help', text: t.rel.mongoNote }));
	box.append(h('hr', { class: 'sf-sep' }));
	const row = h('div', { class: 'sf-bubble-actions' });
	const cardinality = h('button', { type: 'button', class: 'sf-btn', text: oneToOne ? t.rel.makeOneToMany : t.rel.makeOneToOne, 'data-tip': fill(t.rel.makeOneToOneTip, words), 'data-key': `card-${relationId}` });
	cardinality.addEventListener('click', () => {
		host.commit(setOneToOne(store.schema, relationId, !oneToOne), fill(t.history.editRelation, { x: label }));
		rerender();
	});
	const junctionName = `${n.c}_${n.p}`;
	const toJunction = h('button', { type: 'button', class: 'sf-btn', text: t.rel.toManyToMany, 'data-tip': fill(t.rel.toManyToManyTip, { name: junctionName }), disabled: relation.fromTable === relation.toTable ? true : null });
	toJunction.addEventListener('click', () => {
		const result = convertToJunction(store.schema, relationId);
		if (!result.tableId) return;
		const created = findTable(result.schema, result.tableId)?.name ?? junctionName;
		host.bubble.close(false);
		host.commit(result.schema, fill(t.history.junction, { x: created }), { select: { ...emptySelection(), tables: [result.tableId] } });
		host.live.say(fill(t.live.junctionCreated, { x: created }));
	});
	const remove = h('button', { type: 'button', class: 'sf-btn sf-btn-danger' });
	remove.append(icon('trash', 14), h('span', { text: t.rel.delete }));
	remove.addEventListener('click', () => host.deleteRelation(relationId));
	row.append(cardinality, toJunction, h('span', { class: 'sf-spacer' }), remove);
	box.append(row);
	return box;
}

export function withClose(strings: Strings, bubble: Bubble, content: HTMLElement): HTMLElement {
	const wrap = h('div', { class: 'sf-bubble-body' });
	const close = h('button', { type: 'button', class: 'sf-icon-btn sf-bubble-close', 'aria-label': strings.close, 'data-close': '' });
	close.append(icon('close', 14));
	close.addEventListener('click', () => bubble.close(true));
	wrap.append(close, content);
	return wrap;
}

export function openRelationBubble(store: Store, host: BubbleHost, relationId: string, anchor: Element | { x: number; y: number }): void {
	const t = host.strings;
	const render = (): HTMLElement => withClose(t, host.bubble, relationControls(store, host, relationId, rerender));
	const rerender = () => {
		const panel = document.querySelector<HTMLElement>('.sf-bubble.sf-bubble-relation');
		const active = document.activeElement as HTMLElement | null;
		const key = active?.dataset.key;
		if (!panel || !store.schema.relations.some((r) => r.id === relationId)) {
			host.bubble.close(false);
			return;
		}
		panel.replaceChildren(render());
		if (key) panel.querySelector<HTMLElement>(`[data-key="${key}"]`)?.focus();
		host.bubble.reposition();
	};
	const relation = store.schema.relations.find((r) => r.id === relationId);
	if (!relation) return;
	host.bubble.open(anchor, render(), { label: host.relationLabel(relation), key: `relation:${relationId}`, className: 'sf-bubble-relation' });
}

export interface RelateRequest {
	tableId?: string;
	columnId?: string;
	kind?: RelationKind;
}

export function applyRelationPlan(host: Pick<BubbleHost, 'strings' | 'live' | 'commit' | 'flash'>, plan: RelationPlan): void {
	const t = host.strings;
	if (plan.tableId) {
		host.commit(plan.schema, fill(t.history.junction, { x: plan.label }), { select: { ...emptySelection(), tables: [plan.tableId] } });
		host.live.say(fill(t.live.junctionCreated, { x: plan.label }));
		return;
	}
	host.commit(plan.schema, fill(t.history.createRelation, { x: plan.label }));
	host.live.say(fill(t.live.relationCreated, { x: plan.label }));
	host.flash(plan.relationId);
}

const KIND_ORDER: readonly RelationKind[] = ['oneToMany', 'oneToOne', 'manyToMany'];

export function openRelateBubble(store: Store, host: BubbleHost, request: RelateRequest, anchor: Anchor): void {
	const t = host.strings;
	const tables = store.schema.tables;
	const first = tables.find((table) => table.id === request.tableId) ?? tables.find((table) => store.selection.tables.includes(table.id)) ?? tables[0];
	if (!first) return;
	const nextId = [...store.selection.tables, ...tables.map((table) => table.id)].find((id) => id !== first.id);
	const second = tables.find((table) => table.id === nextId) ?? first;

	const form = h('form', { class: 'sf-relate' });
	form.append(h('p', { class: 'sf-bubble-title', text: t.relate.title }));

	const tableOption = (table: Table) => h('option', { value: table.id, text: table.name });
	const sourceTable = h('select', { class: 'sf-select', id: 'sf-relate-source-table' }, ...tables.map(tableOption));
	const targetTable = h('select', { class: 'sf-select', id: 'sf-relate-table' }, ...tables.map(tableOption));
	sourceTable.value = first.id;
	targetTable.value = second.id;
	const field = (label: HTMLElement, control: HTMLElement) => h('div', { class: 'sf-field' }, label, control);
	const pair = h(
		'div',
		{ class: 'sf-relate-pair' },
		field(h('label', { class: 'sf-label', for: 'sf-relate-source-table', text: t.relate.sourceTable }), sourceTable),
		field(h('label', { class: 'sf-label', for: 'sf-relate-table', text: t.relate.targetTable }), targetTable)
	);

	const kinds = h('fieldset', { class: 'sf-kinds' }, h('legend', { class: 'sf-label', text: t.relate.kindLabel }));
	const radios = new Map<RelationKind, HTMLInputElement>();
	const sentences = new Map<RelationKind, HTMLElement>();
	for (const kind of KIND_ORDER) {
		const radio = h('input', { type: 'radio', name: 'sf-relate-kind', value: kind, checked: kind === (request.kind ?? 'oneToMany') ? true : null, 'aria-labelledby': `sf-kind-name-${kind}`, 'aria-describedby': `sf-kind-text-${kind}` });
		const sentence = h('span', { class: 'sf-kind-text', id: `sf-kind-text-${kind}` });
		const name = h('span', { class: 'sf-kind-name', id: `sf-kind-name-${kind}`, text: t.relate.kinds[kind].name });
		kinds.append(h('label', { class: 'sf-kind' }, radio, h('span', { class: 'sf-kind-body' }, name, sentence)));
		radios.set(kind, radio);
		sentences.set(kind, sentence);
	}

	const preview = h('p', { class: 'sf-relate-preview sf-mono', 'aria-live': 'polite' });
	const warning = h('p', { class: 'sf-relate-warning', 'aria-live': 'polite' });

	const targetColumn = h('select', { class: 'sf-select', id: 'sf-relate-column' });
	const sourceColumn = h('select', { class: 'sf-select', id: 'sf-relate-source' });
	const sourceLabel = h('label', { class: 'sf-label', for: 'sf-relate-source' });
	const advanced = h(
		'details',
		{ class: 'sf-relate-advanced', open: request.columnId ? true : null },
		h('summary', { text: t.relate.advanced }),
		h('div', { class: 'sf-relate-more' }, field(h('label', { class: 'sf-label', for: 'sf-relate-column', text: t.relate.targetColumn }), targetColumn), field(sourceLabel, sourceColumn))
	);

	let touchedTarget = false;
	let newColumn: HTMLOptionElement | null = null;

	const fillColumns = () => {
		const from = findTable(store.schema, sourceTable.value);
		const to = findTable(store.schema, targetTable.value);
		targetColumn.replaceChildren();
		sourceColumn.replaceChildren();
		if (!from || !to) return;
		sourceLabel.textContent = fill(t.relate.sourceColumn, { table: from.name });
		const key = referencedKey(to);
		for (const column of to.columns) {
			const flags = [displayType(column.type), to.primaryKey.includes(column.id) ? 'PK' : isUnique(to, column.id) ? 'UQ' : ''].filter(Boolean).join(', ');
			targetColumn.append(h('option', { value: column.id, text: `${column.name} (${flags})`, selected: key[0] === column.id ? true : null }));
		}
		newColumn = h('option', { value: '' });
		sourceColumn.append(newColumn);
		const wanted = from.id === first.id ? request.columnId : undefined;
		for (const column of from.columns) sourceColumn.append(h('option', { value: column.id, text: column.name, selected: column.id === wanted ? true : null }));
	};

	const chosenKind = (): RelationKind => KIND_ORDER.find((kind) => radios.get(kind)?.checked) ?? 'oneToMany';

	const submit = h('button', { type: 'submit', class: 'sf-btn sf-btn-primary', text: t.relate.submit });

	const compute = () => {
		const from = findTable(store.schema, sourceTable.value);
		const to = findTable(store.schema, targetTable.value);
		const kind = chosenKind();
		const warnings: string[] = [];
		if (!from || !to) return { from, to, kind, target: undefined, plan: null, blocker: '', warnings };
		const spec: RelationRequest = { kind, from: from.id, to: to.id };
		const key = referencedKey(to);
		const source = from.columns.find((column) => column.id === sourceColumn.value);
		const explicit = touchedTarget || key.length === 0;
		const target = to.columns.find((column) => column.id === (touchedTarget ? targetColumn.value : (key[0] ?? targetColumn.value)));
		if (kind !== 'manyToMany') {
			if (source) spec.fromColumn = source.id;
			if (touchedTarget) spec.toColumn = targetColumn.value;
		}
		const plan = planRelation(store.schema, spec);
		let blocker = '';
		if (kind === 'manyToMany') {
			const missing = [from, to].find((table) => referencedKey(table).length === 0);
			if (from.id === to.id) blocker = t.relate.selfMany;
			else if (store.schema.tables.length >= LIMITS.tables) blocker = t.canvas.limitTables;
			else if (missing) blocker = fill(t.palette.noKey, { table: missing.name });
		} else {
			if (!plan) blocker = fill(t.palette.noKey, { table: to.name });
			else if (store.schema.relations.some((relation) => relation.id === plan.relationId)) blocker = t.connect.exists;
			else if (!source && from.columns.length >= LIMITS.columns) blocker = t.canvas.limitColumns;
			if (source && target && !sameType(source.type, target.type)) warnings.push(fill(t.connect.typeMismatch, { a: displayType(source.type), b: displayType(target.type) }));
			const isKey = target && ((to.primaryKey.length === 1 && to.primaryKey[0] === target.id) || isUnique(to, target.id));
			if (explicit && target && !isKey) warnings.push(fill(t.connect.notKey, { column: `${to.name}.${target.name}` }));
		}
		return { from, to, kind, target, plan, blocker, warnings };
	};

	const update = () => {
		const { from, to, kind, target, plan, blocker, warnings } = compute();
		if (!from || !to) return;
		const same = from.id === to.id;
		const junction = kind === 'manyToMany' && plan ? plan.label : (planRelation(store.schema, { kind: 'manyToMany', from: from.id, to: to.id })?.label ?? `${from.name}_${to.name}`);
		for (const option of KIND_ORDER) {
			const sentence = sentences.get(option);
			if (!sentence) continue;
			sentence.textContent = option === 'manyToMany' && same ? t.relate.selfMany : fill(t.relate.kinds[option].text, { from: from.name, to: to.name, name: junction });
		}
		const many = radios.get('manyToMany');
		if (many) {
			many.disabled = same;
			many.closest('.sf-kind')?.classList.toggle('is-disabled', same);
		}
		sourceColumn.disabled = kind === 'manyToMany';
		targetColumn.disabled = kind === 'manyToMany';
		if (newColumn) newColumn.textContent = fill(t.relate.newColumn, { column: `${to.name}_${target?.name ?? 'id'}` });
		preview.textContent = plan ? (kind === 'manyToMany' ? fill(t.connect.junction, { name: junction }) : plan.label) : '';
		warning.textContent = blocker || warnings.join(' ');
		submit.disabled = !plan || blocker !== '';
		host.bubble.reposition();
	};

	form.addEventListener('change', (event) => {
		const control = event.target;
		if (control === sourceTable || control === targetTable) {
			touchedTarget = false;
			fillColumns();
		} else if (control === targetColumn) touchedTarget = true;
		update();
	});

	advanced.addEventListener('toggle', () => host.bubble.reposition());
	form.append(pair, kinds, preview, warning, advanced);
	const row = h('div', { class: 'sf-bubble-actions' });
	const cancel = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.cancel });
	cancel.addEventListener('click', () => host.bubble.close(true));
	row.append(h('span', { class: 'sf-spacer' }), cancel, submit);
	form.append(row);

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const { plan, blocker } = compute();
		if (!plan || blocker) return;
		host.bubble.close(false);
		applyRelationPlan(host, plan);
	});

	fillColumns();
	update();
	host.bubble.open(anchor, withClose(t, host.bubble, form), { label: t.relate.title, key: 'relate', className: 'sf-bubble-relate' });
	targetTable.focus();
}

export function openGlossary(strings: Strings, bubble: Bubble, term: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE', anchor: HTMLElement): void {
	if (bubble.key.current === `glossary:${term}` ) {
		bubble.close(true);
		return;
	}
	const entry = strings.glossary[term];
	const badge = term === 'PRIMARY_KEY' ? 'PK' : term === 'FOREIGN_KEY' ? 'FK' : 'UQ';
	const content = h('div', { class: 'sf-glossary' });
	const head = h('div', { class: 'sf-glossary-head' });
	head.append(h('span', { class: `sf-badge sf-badge-${badge.toLowerCase()}`, text: badge, 'aria-hidden': 'true' }), h('p', { class: 'sf-bubble-title', text: entry.term }));
	content.append(head, h('p', { class: 'sf-glossary-basic', text: entry.basic }), h('hr', { class: 'sf-sep' }), h('p', { class: 'sf-label', text: strings.glossary.effect }), h('p', { class: 'sf-glossary-advanced', text: entry.advanced }));
	bubble.open(anchor, withClose(strings, bubble, content), { label: entry.term, key: `glossary:${term}`, className: 'sf-bubble-glossary', returnFocus: anchor });
}
