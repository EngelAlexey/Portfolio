import {
	addColumn,
	connectColumns,
	connectWithNewColumns,
	convertToJunction,
	createJunction,
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
import { ACTIONS, type Action, type Relation, type Schema } from '../model/types';
import type { Selection } from '../model/ops';
import { h, icon } from './dom';
import type { Bubble, Live } from './popups';
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

export function openRelateBubble(store: Store, host: BubbleHost, tableId: string, columnId: string | undefined, anchor: Element): void {
	const t = host.strings;
	const table = findTable(store.schema, tableId);
	if (!table) return;
	const others = store.schema.tables;
	const form = h('form', { class: 'sf-relate' });
	form.append(h('p', { class: 'sf-bubble-title', text: fill(t.relate.title, { table: table.name }) }));
	const targetTable = h('select', { class: 'sf-select', id: 'sf-relate-table' });
	for (const other of others) targetTable.append(h('option', { value: other.id, text: other.name }));
	const firstOther = others.find((o) => o.id !== tableId) ?? table;
	targetTable.value = firstOther.id;
	const targetColumn = h('select', { class: 'sf-select', id: 'sf-relate-column' });
	const sourceColumn = h('select', { class: 'sf-select', id: 'sf-relate-source' });
	const many = h('input', { type: 'checkbox', id: 'sf-relate-many' });
	const preview = h('p', { class: 'sf-relate-preview sf-mono', 'aria-live': 'polite' });
	const warning = h('p', { class: 'sf-relate-warning', 'aria-live': 'polite' });
	const fillTarget = () => {
		const target = findTable(store.schema, targetTable.value);
		targetColumn.replaceChildren();
		if (!target) return;
		const key = referencedKey(target);
		for (const column of target.columns) {
			const flags = [displayType(column.type), target.primaryKey.includes(column.id) ? 'PK' : isUnique(target, column.id) ? 'UQ' : ''].filter(Boolean).join(', ');
			targetColumn.append(h('option', { value: column.id, text: `${column.name} (${flags})`, selected: key[0] === column.id ? true : null }));
		}
		sourceColumn.replaceChildren();
		const keyColumn = target.columns.find((c) => c.id === targetColumn.value);
		sourceColumn.append(h('option', { value: '', text: fill(t.relate.newColumn, { column: `${target.name}_${keyColumn?.name ?? 'id'}` }) }));
		for (const column of table.columns) sourceColumn.append(h('option', { value: column.id, text: column.name, selected: column.id === columnId ? true : null }));
		update();
	};
	const update = () => {
		const target = findTable(store.schema, targetTable.value);
		const tc = target?.columns.find((c) => c.id === targetColumn.value);
		const sc = table.columns.find((c) => c.id === sourceColumn.value);
		sourceColumn.disabled = many.checked;
		targetColumn.disabled = many.checked;
		if (!target || !tc) {
			preview.textContent = '';
			return;
		}
		if (many.checked) {
			preview.textContent = fill(t.connect.junction, { name: `${table.name}_${target.name}` });
			warning.textContent = '';
			return;
		}
		const sourceName = sc ? sc.name : `${target.name}_${tc.name}`;
		preview.textContent = `${table.name}.${sourceName} → ${target.name}.${tc.name}`;
		const warnings: string[] = [];
		if (sc && !sameType(sc.type, tc.type)) warnings.push(fill(t.connect.typeMismatch, { a: displayType(sc.type), b: displayType(tc.type) }));
		const isKey = (target.primaryKey.length === 1 && target.primaryKey[0] === tc.id) || isUnique(target, tc.id);
		if (!isKey) warnings.push(fill(t.connect.notKey, { column: `${target.name}.${tc.name}` }));
		warning.textContent = warnings.join(' ');
	};
	targetTable.addEventListener('change', fillTarget);
	targetColumn.addEventListener('change', () => {
		const target = findTable(store.schema, targetTable.value);
		const keyColumn = target?.columns.find((c) => c.id === targetColumn.value);
		const first = sourceColumn.querySelector('option');
		if (first && target) first.textContent = fill(t.relate.newColumn, { column: `${target.name}_${keyColumn?.name ?? 'id'}` });
		update();
	});
	sourceColumn.addEventListener('change', update);
	many.addEventListener('change', update);
	const field = (label: string, control: HTMLElement, id: string) => {
		const f = h('div', { class: 'sf-field' });
		f.append(h('label', { class: 'sf-label', for: id, text: label }), control);
		return f;
	};
	form.append(field(t.relate.targetTable, targetTable, 'sf-relate-table'), field(t.relate.targetColumn, targetColumn, 'sf-relate-column'), field(fill(t.relate.sourceColumn, { table: table.name }), sourceColumn, 'sf-relate-source'));
	const check = h('label', { class: 'sf-check', for: 'sf-relate-many' });
	check.append(many, h('span', { text: t.relate.manyToMany }));
	form.append(check, preview, warning);
	const row = h('div', { class: 'sf-bubble-actions' });
	const cancel = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.cancel });
	cancel.addEventListener('click', () => host.bubble.close(true));
	const submit = h('button', { type: 'submit', class: 'sf-btn sf-btn-primary', text: t.relate.submit });
	row.append(h('span', { class: 'sf-spacer' }), cancel, submit);
	form.append(row);
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const target = findTable(store.schema, targetTable.value);
		const tc = target?.columns.find((c) => c.id === targetColumn.value);
		if (!target || !tc) return;
		if (many.checked) {
			const result = createJunction(store.schema, table.id, target.id);
			if (!result.tableId) return;
			const created = findTable(result.schema, result.tableId)?.name ?? '';
			host.bubble.close(false);
			host.commit(result.schema, fill(t.history.junction, { x: created }), { select: { ...emptySelection(), tables: [result.tableId] } });
			host.live.say(fill(t.live.junctionCreated, { x: created }));
			return;
		}
		let next: Schema;
		let relationId = '';
		let label = '';
		if (sourceColumn.value) {
			const sc = table.columns.find((c) => c.id === sourceColumn.value);
			const result = connectColumns(store.schema, { fromTable: table.id, fromColumns: [sourceColumn.value], toTable: target.id, toColumns: [tc.id] });
			next = result.schema;
			relationId = result.relationId;
			label = `${table.name}.${sc?.name ?? ''} → ${target.name}.${tc.name}`;
		} else {
			const key = referencedKey(target);
			if (key.length === 1 && key[0] === tc.id) {
				const result = connectWithNewColumns(store.schema, table.id, target.id);
				next = result.schema;
				relationId = result.relationId;
				const created = findTable(next, table.id)?.columns.find((c) => c.id === result.columnIds[0])?.name ?? '';
				label = `${table.name}.${created} → ${target.name}.${tc.name}`;
			} else {
				const added = addColumn(store.schema, table.id, { name: `${target.name}_${tc.name}`, type: tc.type });
				const result = connectColumns(added.schema, { fromTable: table.id, fromColumns: [added.columnId], toTable: target.id, toColumns: [tc.id] });
				next = result.schema;
				relationId = added.columnId ? result.relationId : '';
				const created = findTable(next, table.id)?.columns.find((c) => c.id === added.columnId)?.name ?? '';
				label = `${table.name}.${created} → ${target.name}.${tc.name}`;
			}
		}
		if (!relationId) return;
		host.bubble.close(false);
		host.commit(next, fill(t.history.createRelation, { x: label }));
		host.live.say(fill(t.live.relationCreated, { x: label }));
		host.flash(relationId);
	});
	fillTarget();
	host.bubble.open(anchor, withClose(t, host.bubble, form), { label: fill(t.relate.title, { table: table.name }), key: `relate:${tableId}`, className: 'sf-bubble-relate' });
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
