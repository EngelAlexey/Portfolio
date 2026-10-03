type Plural = [string, string];
type Severity = 'critical' | 'warning' | 'info';
type Action = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

interface Strings {
	tables: Plural;
	relations: Plural;
	columns: Plural;
	score: string;
	rendering: string;
	reviewEmpty: string;
	severity: Record<Severity, string>;
	presets: Record<string, { title: string; description: string }>;
	glossary: Record<string, { term: string; basic: string; advanced: string }>;
	rules: Record<string, { title: string; explanation: string; detail: string; recommendation: string }>;
	recommendation: string;
	fixSql: string;
	copied: string;
	sqlCopied: string;
	copyError: string;
	errors: Record<'empty' | 'invalid' | 'tooLarge' | 'network' | 'unknown', string>;
	tableName: string;
	columnName: string;
	columnType: string;
	deleteColumn: string;
	notNull: string;
	reference: string;
	noReference: string;
	onDelete: string;
	newTable: string;
	newColumn: string;
}

interface ApiColumn {
	name: string;
	dataType: string;
	isPrimaryKey: boolean;
	isNullable: boolean;
	isUnique: boolean;
}

interface ApiRelationship {
	fromTable: string;
	fromColumn: string;
	toTable: string;
	toColumn: string;
	onDelete?: string;
}

interface Diagnostic {
	ruleId: string;
	tableName?: string;
	columnName?: string;
	severity: Severity;
	title: string;
	explanation: string;
	seniorContext: string;
	recommendation?: string;
	fixSql?: string;
}

interface Analysis {
	ast: { tables: { name: string; columns: ApiColumn[] }[]; relationships: ApiRelationship[] };
	layout: { nodes: { table: { name: string }; x: number; y: number; width: number }[] };
	health: { score: number; diagnostics: Diagnostic[] };
}

interface Preset {
	id: string;
	title: string;
	description: string;
	sql: string;
}

interface Column {
	id: number;
	name: string;
	type: string;
	pk: boolean;
	notNull: boolean;
	unique: boolean;
	ref: { table: number; column: number; onDelete: Action } | null;
}

interface Table {
	id: number;
	name: string;
	x: number;
	y: number;
	columns: Column[];
}

const CARD_WIDTH = 260;
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 28;
const LIST_PADDING = 5;
const BORDER = 1;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const MAX_SQL_LENGTH = 250_000;
const ACTIONS: Action[] = ['NO ACTION', 'CASCADE', 'SET NULL', 'RESTRICT'];
const TRASH = 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3';

const BADGES = [
	{ test: (c: Column) => c.pk, label: 'PK', kind: 'pk', term: 'PRIMARY_KEY' },
	{ test: (c: Column) => c.ref !== null, label: 'FK', kind: 'fk', term: 'FOREIGN_KEY' },
	{ test: (c: Column) => c.unique, label: 'UQ', kind: 'uq', term: 'UNIQUE' }
] as const;

const count = ([one, many]: Plural, n: number): string => (n === 1 ? one : many.replace('{n}', String(n)));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function svgIcon(d: string): SVGSVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', '15');
	svg.setAttribute('height', '15');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '2');
	svg.setAttribute('stroke-linecap', 'round');
	svg.setAttribute('stroke-linejoin', 'round');
	svg.setAttribute('aria-hidden', 'true');
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', d);
	svg.append(path);
	return svg;
}

function scoreColor(score: number): string {
	if (score >= 90) return 'var(--check-pass)';
	if (score >= 70) return 'var(--sev-medium)';
	if (score >= 50) return 'var(--sev-high)';
	return 'var(--sev-critical)';
}

function xml(value: string): string {
	return value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

function ident(value: string): string {
	return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) ? value : `"${value.replace(/"/g, '""')}"`;
}

function mermaidName(value: string): string {
	const cleaned = value.replace(/[^A-Za-z0-9_]/g, '_');
	return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function mermaidType(value: string): string {
	return mermaidName(value.replace(/[\s(),]+/g, '_').replace(/_+$/, '')) || 'unknown';
}

export function mountSchemaFlow(root: HTMLElement): void {
	const api = root.dataset.api ?? '';
	const strings = JSON.parse(root.dataset.strings ?? '{}') as Strings;

	const q = <T extends Element>(selector: string): T => {
		const found = root.querySelector<T>(selector);
		if (!found) throw new Error(`Missing ${selector}`);
		return found;
	};

	const form = q<HTMLFormElement>('[data-sf-form]');
	const sql = q<HTMLTextAreaElement>('[data-sf-sql]');
	const renderBtn = q<HTMLButtonElement>('[data-sf-render]');
	const status = q<HTMLElement>('[data-sf-status]');
	const presetsBox = q<HTMLElement>('[data-sf-presets]');
	const viewport = q<HTMLElement>('[data-sf-viewport]');
	const world = q<HTMLElement>('[data-sf-world]');
	const cards = q<HTMLElement>('[data-sf-cards]');
	const edgesSvg = q<SVGSVGElement>('[data-sf-edges]');
	const paths = q<SVGGElement>('[data-sf-paths]');
	const empty = q<HTMLElement>('[data-sf-empty]');
	const counts = q<HTMLElement>('[data-sf-counts]');
	const scoreBtn = q<HTMLButtonElement>('[data-sf-score]');
	const scoreText = q<HTMLElement>('[data-sf-score-text]');
	const mermaidBtn = q<HTMLButtonElement>('[data-sf-mermaid]');
	const svgBtn = q<HTMLButtonElement>('[data-sf-svg]');
	const review = q<HTMLElement>('[data-sf-review]');
	const reviewBody = q<HTMLElement>('[data-sf-review-body]');
	const bubble = q<HTMLElement>('[data-sf-term]');
	const selectHint = q<HTMLElement>('[data-sf-select-hint]');
	const editor = q<HTMLElement>('[data-sf-editor]');
	const tableNameInput = q<HTMLInputElement>('[data-sf-table-name]');
	const columnList = q<HTMLOListElement>('[data-sf-columns]');
	const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-sf-tab]')];

	let tables: Table[] = [];
	let selected: number | null = null;
	let nextId = 1;
	let zoom = 1;
	let panX = 24;
	let panY = 24;
	let parseRequest = 0;
	let reviewRequest = 0;
	let reviewTimer: ReturnType<typeof setTimeout> | undefined;
	let sqlDirty = false;
	let bubbleAnchor: HTMLElement | null = null;

	const newId = () => nextId++;
	const tableById = (id: number) => tables.find((t) => t.id === id);

	const setStatus = (message: string, kind: 'info' | 'error' = 'info') => {
		status.textContent = message;
		status.dataset.kind = kind;
	};

	const applyTransform = () => {
		world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
		if (bubbleAnchor) placeBubble(bubbleAnchor);
	};

	const tableHeight = (t: Table) => BORDER * 2 + HEADER_HEIGHT + LIST_PADDING * 2 + t.columns.length * ROW_HEIGHT;

	const bounds = () => ({
		left: Math.min(...tables.map((t) => t.x)),
		top: Math.min(...tables.map((t) => t.y)),
		right: Math.max(...tables.map((t) => t.x + CARD_WIDTH)),
		bottom: Math.max(...tables.map((t) => t.y + tableHeight(t)))
	});

	const fit = () => {
		if (tables.length === 0) return;
		const b = bounds();
		const pad = 40;
		const width = viewport.clientWidth;
		const height = viewport.clientHeight - 44;
		zoom = Math.min(1.1, Math.max(MIN_ZOOM, Math.min((width - pad * 2) / (b.right - b.left), (height - pad * 2) / (b.bottom - b.top))));
		panX = (width - (b.right - b.left) * zoom) / 2 - b.left * zoom;
		panY = Math.max(pad / 2, (height - (b.bottom - b.top) * zoom) / 2) - b.top * zoom;
		applyTransform();
	};

	const zoomAt = (factor: number, cx: number, cy: number) => {
		const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
		panX = cx - ((cx - panX) * next) / zoom;
		panY = cy - ((cy - panY) * next) / zoom;
		zoom = next;
		applyTransform();
	};

	const rowY = (t: Table, index: number) => t.y + BORDER + HEADER_HEIGHT + LIST_PADDING + index * ROW_HEIGHT + ROW_HEIGHT / 2;

	const relations = () => {
		const out: { from: Table; fromIndex: number; to: Table; toIndex: number }[] = [];
		for (const from of tables) {
			from.columns.forEach((col, fromIndex) => {
				if (!col.ref) return;
				const to = tableById(col.ref.table);
				const toIndex = to ? to.columns.findIndex((c) => c.id === col.ref?.column) : -1;
				if (to && toIndex !== -1) out.push({ from, fromIndex, to, toIndex });
			});
		}
		return out;
	};

	const edgePath = (r: ReturnType<typeof relations>[number]): string => {
		const { from: src, to: tgt } = r;
		const y1 = rowY(src, r.fromIndex);
		const y2 = rowY(tgt, r.toIndex);
		if (src === tgt) {
			const x = src.x + CARD_WIDTH;
			return `M ${x} ${y1} C ${x + 48} ${y1}, ${x + 48} ${y2}, ${x} ${y2}`;
		}
		const leftToRight = src.x + CARD_WIDTH / 2 <= tgt.x + CARD_WIDTH / 2;
		const x1 = leftToRight ? src.x + CARD_WIDTH : src.x;
		const x2 = leftToRight ? tgt.x : tgt.x + CARD_WIDTH;
		const dir = leftToRight ? 1 : -1;
		const overlap = leftToRight ? x2 < x1 : x2 > x1;
		const bend = overlap ? 60 : Math.max(36, Math.abs(x2 - x1) * 0.5);
		const c2 = overlap ? x2 + dir * bend : x2 - dir * bend;
		return `M ${x1} ${y1} C ${x1 + dir * bend} ${y1}, ${c2} ${y2}, ${x2} ${y2}`;
	};

	const drawEdges = () => {
		paths.replaceChildren();
		for (const r of relations()) {
			const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('d', edgePath(r));
			path.setAttribute('class', 'edge');
			path.setAttribute('marker-end', 'url(#sf-arrow)');
			path.dataset.from = String(r.from.id);
			path.dataset.to = String(r.to.id);
			paths.append(path);
		}
		if (tables.length > 0) {
			const b = bounds();
			edgesSvg.setAttribute('width', String(b.right + 160));
			edgesSvg.setAttribute('height', String(b.bottom + 160));
		}
	};

	const highlight = (id: number | null) => {
		for (const path of paths.querySelectorAll<SVGPathElement>('path')) {
			if (id !== null && (path.dataset.from === String(id) || path.dataset.to === String(id))) path.dataset.hot = '';
			else delete path.dataset.hot;
		}
	};

	const placeBubble = (anchor: HTMLElement) => {
		const rect = anchor.getBoundingClientRect();
		const width = bubble.offsetWidth;
		const height = bubble.offsetHeight;
		const left = Math.min(Math.max(12, rect.left + rect.width / 2 - 28), window.innerWidth - width - 12);
		const below = rect.bottom + 10 + height < window.innerHeight;
		bubble.style.left = `${left}px`;
		bubble.style.top = `${below ? rect.bottom + 10 : rect.top - height - 10}px`;
		bubble.dataset.side = below ? 'below' : 'above';
		bubble.style.setProperty('--tip-x', `${rect.left + rect.width / 2 - left}px`);
	};

	const closeBubble = () => {
		bubble.hidden = true;
		bubbleAnchor = null;
	};

	const openTerm = (key: string, anchor: HTMLElement) => {
		const entry = strings.glossary[key];
		const info = BADGES.find((b) => b.term === key);
		if (!entry || !info) return;
		const badge = q<HTMLElement>('[data-sf-term-badge]');
		badge.textContent = info.label;
		badge.dataset.kind = info.kind;
		q<HTMLElement>('[data-sf-term-title]').textContent = entry.term;
		q<HTMLElement>('[data-sf-term-basic]').textContent = entry.basic;
		q<HTMLElement>('[data-sf-term-advanced]').textContent = entry.advanced;
		bubble.hidden = false;
		bubbleAnchor = anchor;
		placeBubble(anchor);
	};

	const generateSql = (): string => {
		const done = new Set<number>();
		const order: Table[] = [];
		const visiting = new Set<number>();
		const visit = (t: Table) => {
			if (done.has(t.id) || visiting.has(t.id)) return;
			visiting.add(t.id);
			for (const col of t.columns) {
				const target = col.ref ? tableById(col.ref.table) : undefined;
				if (target && target !== t) visit(target);
			}
			visiting.delete(t.id);
			done.add(t.id);
			order.push(t);
		};
		tables.forEach(visit);

		const emitted = new Set<number>();
		const deferred: string[] = [];
		const blocks = order.map((t) => {
			const pks = t.columns.filter((c) => c.pk);
			const lines = t.columns.map((c) => {
				const parts = [ident(c.name), c.type.trim() || 'TEXT'];
				if (c.pk && pks.length === 1) parts.push('PRIMARY KEY');
				if (c.notNull && !c.pk) parts.push('NOT NULL');
				if (c.unique && !c.pk) parts.push('UNIQUE');
				const target = c.ref ? tableById(c.ref.table) : undefined;
				const targetCol = target?.columns.find((tc) => tc.id === c.ref?.column);
				if (c.ref && target && targetCol) {
					const clause = `REFERENCES ${ident(target.name)}(${ident(targetCol.name)})${c.ref.onDelete !== 'NO ACTION' ? ` ON DELETE ${c.ref.onDelete}` : ''}`;
					if (target === t || emitted.has(target.id)) parts.push(clause);
					else deferred.push(`ALTER TABLE ${ident(t.name)} ADD FOREIGN KEY (${ident(c.name)}) ${clause};`);
				}
				return `\t${parts.join(' ')}`;
			});
			if (pks.length > 1) lines.push(`\tPRIMARY KEY (${pks.map((c) => ident(c.name)).join(', ')})`);
			emitted.add(t.id);
			return `CREATE TABLE ${ident(t.name)} (\n${lines.join(',\n')}\n);`;
		});
		return [...blocks, ...deferred].join('\n\n');
	};

	const uniqueName = (base: string, taken: string[]) => {
		if (!taken.includes(base)) return base;
		let i = 2;
		while (taken.includes(`${base}_${i}`)) i++;
		return `${base}_${i}`;
	};

	const buildCard = (t: Table): HTMLElement => {
		const card = el('div', 'sf-card');
		card.style.left = `${t.x}px`;
		card.style.top = `${t.y}px`;
		card.style.width = `${CARD_WIDTH}px`;
		card.tabIndex = 0;
		card.setAttribute('role', 'button');
		card.setAttribute('aria-label', t.name);
		card.dataset.id = String(t.id);
		if (t.id === selected) card.dataset.selected = '';

		const head = el('div', 'sf-head');
		const name = el('span', 'sf-name', t.name);
		name.title = t.name;
		head.append(name, el('span', 'sf-count', count(strings.columns, t.columns.length)));

		const list = el('ul', 'sf-cols');
		for (const col of t.columns) {
			const row = el('li', 'sf-col');
			const badge = BADGES.find((b) => b.test(col));
			if (badge && strings.glossary[badge.term]) {
				const button = el('button', `sf-badge ${badge.kind}`, badge.label);
				button.type = 'button';
				button.setAttribute('aria-label', strings.glossary[badge.term]?.term ?? badge.label);
				button.addEventListener('click', (e) => {
					e.stopPropagation();
					if (bubbleAnchor === button) closeBubble();
					else openTerm(badge.term, button);
				});
				row.append(button);
			} else {
				row.append(el('span', `sf-badge ${badge ? badge.kind : 'none'}`, badge?.label ?? '··'));
			}
			const colName = el('span', 'sf-col-name', col.name);
			colName.title = col.name;
			const type = el('span', 'sf-type', col.type);
			type.title = col.type;
			row.append(colName, type);
			list.append(row);
		}

		card.append(head, list);
		card.addEventListener('pointerenter', () => highlight(t.id));
		card.addEventListener('pointerleave', () => highlight(null));
		card.addEventListener('pointerdown', (e) => startDrag(e, t, card));
		card.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				select(t.id);
				tableNameInput.focus();
			}
		});
		return card;
	};

	const renderCanvas = () => {
		closeBubble();
		cards.replaceChildren(...tables.map(buildCard));
		drawEdges();
		empty.hidden = tables.length > 0;
		counts.textContent = `${count(strings.tables, tables.length)} · ${count(strings.relations, relations().length)}`;
		mermaidBtn.disabled = tables.length === 0;
		svgBtn.disabled = tables.length === 0;
	};

	const refOptions = (current: Column, owner: Table): HTMLSelectElement => {
		const select = el('select', 'sf-select');
		select.setAttribute('aria-label', strings.reference);
		select.append(new Option(strings.noReference, ''));
		for (const t of tables) {
			for (const c of t.columns) {
				if (t === owner && c === current) continue;
				const value = `${t.id}:${c.id}`;
				const option = new Option(`→ ${t.name}.${c.name}`, value);
				option.selected = current.ref?.table === t.id && current.ref.column === c.id;
				select.append(option);
			}
		}
		return select;
	};

	const flag = (label: string, checked: boolean, title: string, onChange: (value: boolean) => void) => {
		const wrap = el('label', 'sf-flag');
		wrap.title = title;
		const input = el('input');
		input.type = 'checkbox';
		input.checked = checked;
		input.addEventListener('change', () => onChange(input.checked));
		wrap.append(input, el('span', undefined, label));
		return wrap;
	};

	const renderEditor = () => {
		const t = selected === null ? undefined : tableById(selected);
		editor.hidden = !t;
		selectHint.hidden = Boolean(t);
		if (!t) return;
		tableNameInput.value = t.name;
		columnList.replaceChildren();
		t.columns.forEach((col) => {
			const item = el('li', 'sf-col-edit');
			const line = el('div', 'sf-col-line');
			const name = el('input', 'sf-input');
			name.value = col.name;
			name.spellcheck = false;
			name.setAttribute('aria-label', strings.columnName);
			name.addEventListener('input', () => {
				col.name = name.value.trim() || strings.newColumn;
				changed(false);
			});
			const type = el('input', 'sf-input sf-type-input');
			type.value = col.type;
			type.spellcheck = false;
			type.setAttribute('list', 'sf-types');
			type.setAttribute('aria-label', strings.columnType);
			type.addEventListener('input', () => {
				col.type = type.value;
				changed(false);
			});
			const remove = el('button', 'sf-icon-btn');
			remove.type = 'button';
			remove.setAttribute('aria-label', strings.deleteColumn);
			remove.title = strings.deleteColumn;
			remove.append(svgIcon(TRASH));
			remove.addEventListener('click', () => {
				t.columns = t.columns.filter((c) => c !== col);
				for (const other of tables) for (const c of other.columns) if (c.ref?.column === col.id) c.ref = null;
				changed(true);
			});
			line.append(name, type, remove);

			const flags = el('div', 'sf-flags');
			flags.append(
				flag('PK', col.pk, strings.glossary.PRIMARY_KEY?.term ?? 'PK', (v) => {
					col.pk = v;
					changed(false);
				}),
				flag(strings.notNull, col.notNull || col.pk, 'NOT NULL', (v) => {
					col.notNull = v;
					changed(false);
				}),
				flag('UQ', col.unique, strings.glossary.UNIQUE?.term ?? 'UQ', (v) => {
					col.unique = v;
					changed(false);
				})
			);

			const ref = el('div', 'sf-ref');
			const target = refOptions(col, t);
			target.addEventListener('change', () => {
				const [tableId, columnId] = target.value.split(':').map(Number);
				col.ref = target.value && tableId && columnId ? { table: tableId, column: columnId, onDelete: col.ref?.onDelete ?? 'NO ACTION' } : null;
				changed(true);
			});
			ref.append(target);
			if (col.ref) {
				const action = el('select', 'sf-select');
				action.setAttribute('aria-label', strings.onDelete);
				action.title = strings.onDelete;
				for (const a of ACTIONS) {
					const option = new Option(a === 'NO ACTION' ? `${strings.onDelete}: —` : a, a);
					option.selected = col.ref.onDelete === a;
					action.append(option);
				}
				action.addEventListener('change', () => {
					if (col.ref) col.ref.onDelete = action.value as Action;
					changed(false);
				});
				ref.append(action);
			}

			item.append(line, flags, ref);
			columnList.append(item);
		});
	};

	const select = (id: number | null) => {
		selected = id;
		for (const card of cards.querySelectorAll<HTMLElement>('.sf-card')) {
			if (card.dataset.id === String(id)) card.dataset.selected = '';
			else delete card.dataset.selected;
		}
		renderEditor();
		if (id !== null) showTab('design');
	};

	const scheduleReview = () => {
		clearTimeout(reviewTimer);
		const source = generateSql();
		if (tables.length === 0) {
			scoreBtn.disabled = true;
			scoreText.textContent = strings.score.replace('{n}', '–');
			scoreBtn.style.removeProperty('--score');
			reviewBody.replaceChildren();
			return;
		}
		reviewTimer = setTimeout(async () => {
			const id = ++reviewRequest;
			try {
				const res = await fetch(`${api}/api/schemaflow`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sql: source })
				});
				if (!res.ok || id !== reviewRequest) return;
				const data = (await res.json()) as Analysis;
				renderReview(data.health.diagnostics);
				scoreText.textContent = strings.score.replace('{n}', String(data.health.score));
				scoreBtn.style.setProperty('--score', scoreColor(data.health.score));
				scoreBtn.disabled = false;
			} catch {
				return;
			}
		}, 500);
	};

	const changed = (structural: boolean) => {
		renderCanvas();
		if (structural) renderEditor();
		if (!sqlDirty) sql.value = generateSql();
		scheduleReview();
	};

	const renderReview = (diagnostics: Diagnostic[]) => {
		reviewBody.replaceChildren();
		if (diagnostics.length === 0) {
			reviewBody.append(el('p', 'sf-ok', strings.reviewEmpty));
			return;
		}
		for (const diag of diagnostics) {
			const rule = strings.rules[diag.ruleId];
			const fill = (template: string) =>
				template.replaceAll('{table}', diag.tableName ?? '').replaceAll('{column}', diag.columnName ?? '');
			const recommendation = rule ? fill(rule.recommendation) : diag.recommendation;
			const item = el('article', 'sf-diag');
			item.dataset.severity = diag.severity;
			item.append(
				el('span', 'sf-sev', strings.severity[diag.severity] ?? diag.severity),
				el('h3', undefined, rule ? fill(rule.title) : diag.title),
				el('p', undefined, rule ? rule.explanation : diag.explanation),
				el('p', undefined, rule ? rule.detail : diag.seniorContext)
			);
			if (recommendation) {
				const p = el('p');
				p.append(el('strong', undefined, `${strings.recommendation}: `), document.createTextNode(recommendation));
				item.append(p);
			}
			if (diag.fixSql) {
				const pre = el('pre');
				pre.setAttribute('aria-label', strings.fixSql);
				pre.append(el('code', undefined, diag.fixSql));
				item.append(pre);
			}
			reviewBody.append(item);
		}
	};

	const loadAnalysis = (data: Analysis) => {
		const ids = new Map<string, { id: number; columns: Map<string, number> }>();
		const positions = new Map(data.layout.nodes.map((n) => [n.table.name, n]));
		tables = data.ast.tables.map((t, index) => {
			const columns = t.columns.map((c) => ({
				id: newId(),
				name: c.name,
				type: c.dataType,
				pk: c.isPrimaryKey,
				notNull: !c.isNullable && !c.isPrimaryKey,
				unique: c.isUnique,
				ref: null
			}));
			const id = newId();
			ids.set(t.name, { id, columns: new Map(columns.map((c) => [c.name, c.id])) });
			const pos = positions.get(t.name);
			return { id, name: t.name, x: pos?.x ?? 50 + index * 40, y: pos?.y ?? 50 + index * 40, columns };
		});
		for (const rel of data.ast.relationships) {
			const from = ids.get(rel.fromTable);
			const to = ids.get(rel.toTable);
			const fromCol = from?.columns.get(rel.fromColumn);
			const toCol = to?.columns.get(rel.toColumn);
			const table = from ? tableById(from.id) : undefined;
			const column = table?.columns.find((c) => c.id === fromCol);
			if (column && to && toCol) {
				const action = ACTIONS.includes(rel.onDelete as Action) ? (rel.onDelete as Action) : 'NO ACTION';
				column.ref = { table: to.id, column: toCol, onDelete: action };
			}
		}
		selected = null;
		sqlDirty = false;
		renderCanvas();
		renderEditor();
		sql.value = generateSql();
		renderReview(data.health.diagnostics);
		scoreText.textContent = strings.score.replace('{n}', String(data.health.score));
		scoreBtn.style.setProperty('--score', scoreColor(data.health.score));
		scoreBtn.disabled = false;
		fit();
	};

	const parse = async (source: string): Promise<boolean> => {
		const trimmed = source.trim();
		if (!trimmed) {
			setStatus(strings.errors.empty, 'error');
			return false;
		}
		if (trimmed.length > MAX_SQL_LENGTH) {
			setStatus(strings.errors.tooLarge, 'error');
			return false;
		}
		const id = ++parseRequest;
		renderBtn.disabled = true;
		setStatus(strings.rendering);
		try {
			const res = await fetch(`${api}/api/schemaflow`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sql: trimmed })
			});
			if (id !== parseRequest) return false;
			if (!res.ok) {
				const key = res.status === 413 ? 'tooLarge' : res.status === 422 ? 'invalid' : 'unknown';
				setStatus(strings.errors[key], 'error');
				return false;
			}
			loadAnalysis((await res.json()) as Analysis);
			setStatus('');
			return true;
		} catch {
			if (id === parseRequest) setStatus(strings.errors.network, 'error');
			return false;
		} finally {
			if (id === parseRequest) renderBtn.disabled = false;
		}
	};

	const showTab = (name: 'design' | 'sql') => {
		for (const tab of tabs) {
			const active = tab.dataset.sfTab === name;
			tab.setAttribute('aria-selected', String(active));
			tab.tabIndex = active ? 0 : -1;
		}
		for (const panel of root.querySelectorAll<HTMLElement>('[data-sf-panel]')) panel.hidden = panel.dataset.sfPanel !== name;
	};

	tabs.forEach((tab, index) => {
		tab.addEventListener('click', () => showTab(tab.dataset.sfTab as 'design' | 'sql'));
		tab.addEventListener('keydown', (e) => {
			if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
			const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
			if (!next) return;
			showTab(next.dataset.sfTab as 'design' | 'sql');
			next.focus();
		});
	});

	const setPresetPressed = (id: string | null) => {
		for (const chip of presetsBox.querySelectorAll<HTMLButtonElement>('button')) chip.setAttribute('aria-pressed', String(chip.dataset.preset === id));
	};

	const loadMeta = async () => {
		let presets: Preset[] = [];
		try {
			const res = await fetch(`${api}/api/schemaflow`);
			if (!res.ok) throw new Error(String(res.status));
			presets = ((await res.json()) as { presets?: Preset[] }).presets ?? [];
		} catch {
			setStatus(strings.errors.network, 'error');
			return;
		}
		for (const preset of presets) {
			const label = strings.presets[preset.id];
			const chip = el('button', undefined, label?.title ?? preset.title);
			chip.type = 'button';
			chip.title = label?.description ?? preset.description;
			chip.dataset.preset = preset.id;
			chip.setAttribute('aria-pressed', 'false');
			chip.addEventListener('click', async () => {
				if (await parse(preset.sql)) setPresetPressed(preset.id);
			});
			presetsBox.append(chip);
		}
		const first = presets[0];
		if (first && tables.length === 0 && (await parse(first.sql))) setPresetPressed(first.id);
	};

	let drag: { table: Table; card: HTMLElement; startX: number; startY: number; x: number; y: number; id: number; moved: boolean } | null = null;
	let pan: { startX: number; startY: number; x: number; y: number; id: number } | null = null;

	const startDrag = (e: PointerEvent, t: Table, card: HTMLElement) => {
		if ((e.target as Element).closest('button')) return;
		e.stopPropagation();
		closeBubble();
		card.setPointerCapture(e.pointerId);
		drag = { table: t, card, startX: e.clientX, startY: e.clientY, x: t.x, y: t.y, id: e.pointerId, moved: false };
	};

	window.addEventListener('pointermove', (e) => {
		if (drag && e.pointerId === drag.id) {
			const dx = (e.clientX - drag.startX) / zoom;
			const dy = (e.clientY - drag.startY) / zoom;
			if (!drag.moved && Math.hypot(dx, dy) < 3) return;
			drag.moved = true;
			drag.card.dataset.dragging = '';
			drag.table.x = Math.round(drag.x + dx);
			drag.table.y = Math.round(drag.y + dy);
			drag.card.style.left = `${drag.table.x}px`;
			drag.card.style.top = `${drag.table.y}px`;
			drawEdges();
			highlight(drag.table.id);
		} else if (pan && e.pointerId === pan.id) {
			panX = pan.x + e.clientX - pan.startX;
			panY = pan.y + e.clientY - pan.startY;
			applyTransform();
		}
	});

	const endPointer = (e: PointerEvent) => {
		if (drag && e.pointerId === drag.id) {
			delete drag.card.dataset.dragging;
			if (!drag.moved) select(drag.table.id);
			drag = null;
		}
		if (pan && e.pointerId === pan.id) {
			delete viewport.dataset.panning;
			if (Math.hypot(e.clientX - pan.startX, e.clientY - pan.startY) < 3) select(null);
			pan = null;
		}
	};
	window.addEventListener('pointerup', endPointer);
	window.addEventListener('pointercancel', endPointer);

	viewport.addEventListener('pointerdown', (e) => {
		if ((e.target as Element).closest('.sf-card, .zoom, button, .sheet')) return;
		closeBubble();
		viewport.setPointerCapture(e.pointerId);
		viewport.dataset.panning = '';
		pan = { startX: e.clientX, startY: e.clientY, x: panX, y: panY, id: e.pointerId };
	});

	viewport.addEventListener(
		'wheel',
		(e) => {
			if (review.contains(e.target as Node)) return;
			e.preventDefault();
			const rect = viewport.getBoundingClientRect();
			if (e.ctrlKey || e.metaKey) {
				zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - rect.left, e.clientY - rect.top);
			} else {
				panX -= e.deltaX;
				panY -= e.deltaY;
				applyTransform();
			}
		},
		{ passive: false }
	);

	for (const button of root.querySelectorAll<HTMLButtonElement>('[data-sf-zoom]')) {
		button.addEventListener('click', () => {
			const action = button.dataset.sfZoom;
			if (action === 'fit') return fit();
			zoomAt(action === 'in' ? 1.2 : 1 / 1.2, viewport.clientWidth / 2, viewport.clientHeight / 2);
		});
	}

	q<HTMLButtonElement>('[data-sf-add-table]').addEventListener('click', () => {
		const name = uniqueName(strings.newTable, tables.map((t) => t.name));
		const b = tables.length > 0 ? bounds() : null;
		const x = b ? b.right + 80 : Math.round((viewport.clientWidth / 2 - panX) / zoom - CARD_WIDTH / 2);
		const y = b ? b.top : Math.round((viewport.clientHeight / 3 - panY) / zoom);
		const table: Table = {
			id: newId(),
			name,
			x,
			y,
			columns: [{ id: newId(), name: 'id', type: 'BIGSERIAL', pk: true, notNull: false, unique: false, ref: null }]
		};
		tables.push(table);
		setPresetPressed(null);
		selected = table.id;
		changed(true);
		const sx = table.x * zoom + panX;
		if (sx + CARD_WIDTH * zoom > viewport.clientWidth - 24 || sx < 0) fit();
		showTab('design');
		tableNameInput.focus();
		tableNameInput.select();
	});

	q<HTMLButtonElement>('[data-sf-clear-canvas]').addEventListener('click', () => {
		tables = [];
		selected = null;
		sqlDirty = false;
		setPresetPressed(null);
		setStatus('');
		changed(true);
	});

	tableNameInput.addEventListener('input', () => {
		const t = selected === null ? undefined : tableById(selected);
		if (!t) return;
		t.name = tableNameInput.value.trim() || strings.newTable;
		changed(false);
	});

	q<HTMLButtonElement>('[data-sf-delete-table]').addEventListener('click', () => {
		if (selected === null) return;
		const id = selected;
		tables = tables.filter((t) => t.id !== id);
		for (const t of tables) for (const c of t.columns) if (c.ref?.table === id) c.ref = null;
		selected = null;
		changed(true);
	});

	q<HTMLButtonElement>('[data-sf-add-column]').addEventListener('click', () => {
		const t = selected === null ? undefined : tableById(selected);
		if (!t) return;
		const name = uniqueName(strings.newColumn, t.columns.map((c) => c.name));
		t.columns.push({ id: newId(), name, type: 'TEXT', pk: false, notNull: false, unique: false, ref: null });
		changed(true);
		columnList.querySelector<HTMLInputElement>('li:last-child .sf-input')?.select();
	});

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		setPresetPressed(null);
		void parse(sql.value);
	});

	sql.addEventListener('input', () => {
		sqlDirty = true;
	});

	sql.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit();
	});

	q<HTMLButtonElement>('[data-sf-clear]').addEventListener('click', () => {
		sql.value = '';
		sqlDirty = true;
		setStatus('');
		sql.focus();
	});

	const copy = async (value: string, done: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setStatus(done);
		} catch {
			setStatus(strings.copyError, 'error');
		}
	};

	q<HTMLButtonElement>('[data-sf-copy-sql]').addEventListener('click', () => void copy(sql.value, strings.sqlCopied));

	scoreBtn.addEventListener('click', () => {
		review.hidden = !review.hidden;
		if (!review.hidden) review.querySelector<HTMLButtonElement>('[data-sf-close]')?.focus();
	});
	review.querySelector('[data-sf-close]')?.addEventListener('click', () => {
		review.hidden = true;
		scoreBtn.focus();
	});
	bubble.querySelector('[data-sf-close]')?.addEventListener('click', () => {
		const anchor = bubbleAnchor;
		closeBubble();
		anchor?.focus();
	});

	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape') return;
		if (!bubble.hidden) {
			const anchor = bubbleAnchor;
			closeBubble();
			anchor?.focus();
		} else if (!review.hidden) {
			review.hidden = true;
			scoreBtn.focus();
		}
	});

	document.addEventListener('pointerdown', (e) => {
		if (!bubble.hidden && !bubble.contains(e.target as Node) && !(e.target as Element).closest?.('.sf-badge')) closeBubble();
	});

	window.addEventListener('resize', () => {
		if (bubbleAnchor) placeBubble(bubbleAnchor);
	});
	window.addEventListener('scroll', () => {
		if (bubbleAnchor) placeBubble(bubbleAnchor);
	}, { passive: true });

	mermaidBtn.addEventListener('click', () => {
		const lines = ['erDiagram'];
		for (const r of relations()) {
			const col = r.from.columns[r.fromIndex];
			lines.push(`    ${mermaidName(r.to.name)} ||--o{ ${mermaidName(r.from.name)} : "${mermaidName(col?.name ?? '')}"`);
		}
		for (const t of tables) {
			lines.push(`    ${mermaidName(t.name)} {`);
			for (const c of t.columns) {
				const keys = [c.pk ? 'PK' : '', c.ref ? 'FK' : '', c.unique && !c.pk ? 'UK' : ''].filter(Boolean).join(', ');
				lines.push(`        ${mermaidType(c.type)} ${mermaidName(c.name)}${keys ? ` ${keys}` : ''}`);
			}
			lines.push('    }');
		}
		void copy(lines.join('\n'), strings.copied);
	});

	svgBtn.addEventListener('click', () => {
		if (tables.length === 0) return;
		const b = bounds();
		const pad = 40;
		const width = b.right - b.left + pad * 2 + 60;
		const height = b.bottom - b.top + pad * 2;
		const out: string[] = [
			`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="ui-sans-serif, system-ui, sans-serif">`,
			'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#6b7280"/></marker></defs>',
			`<rect width="${width}" height="${height}" fill="#fafafa"/>`,
			`<g transform="translate(${pad - b.left} ${pad - b.top})">`
		];
		for (const r of relations()) out.push(`<path d="${edgePath(r)}" fill="none" stroke="#6b7280" stroke-width="1.5" marker-end="url(#a)"/>`);
		for (const t of tables) {
			out.push(`<rect x="${t.x}" y="${t.y}" width="${CARD_WIDTH}" height="${tableHeight(t)}" rx="6" fill="#ffffff" stroke="#d4d4d8"/>`);
			out.push(`<path d="M ${t.x} ${t.y + HEADER_HEIGHT + BORDER} h ${CARD_WIDTH}" stroke="#e4e4e7"/>`);
			out.push(`<text x="${t.x + 12}" y="${t.y + 28}" font-size="14" font-weight="600" fill="#18181b">${xml(t.name)}</text>`);
			t.columns.forEach((c, i) => {
				const cy = rowY(t, i) + 4;
				const badge = BADGES.find((bd) => bd.test(c));
				if (badge) out.push(`<text x="${t.x + 12}" y="${cy}" font-size="10" font-weight="700" font-family="ui-monospace, monospace" fill="#52525b">${badge.label}</text>`);
				out.push(`<text x="${t.x + 42}" y="${cy}" font-size="13" fill="#18181b">${xml(c.name)}</text>`);
				out.push(`<text x="${t.x + CARD_WIDTH - 12}" y="${cy}" font-size="11" text-anchor="end" font-family="ui-monospace, monospace" fill="#71717a">${xml(c.type)}</text>`);
			});
		}
		out.push('</g></svg>');
		const url = URL.createObjectURL(new Blob([out.join('\n')], { type: 'image/svg+xml' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = 'schemaflow.svg';
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	});

	applyTransform();
	renderEditor();
	void loadMeta();
}
