import { History } from '../model/history';
import { emptySelection, type Selection } from '../model/ops';
import { emptySchema, type DialectId, type Schema } from '../model/types';
import { analyze, score, type DesignIssue } from '../validate/rules';

export type StoreEvent = 'schema' | 'selection' | 'dialect' | 'history' | 'view';

export interface View {
	zoom: number;
	x: number;
	y: number;
}

export class Store {
	schema: Schema = emptySchema('');
	selection: Selection = emptySelection();
	focusColumn: { table: string; column: string } | null = null;
	dialect: DialectId = 'postgres';
	view: View = { zoom: 1, x: 0, y: 0 };
	readonly history = new History(100);
	private listeners = new Map<StoreEvent, Set<() => void>>();
	private cachedIssues: { schema: Schema; dialect: DialectId; issues: DesignIssue[] } | null = null;

	on(event: StoreEvent, listener: () => void): void {
		const set = this.listeners.get(event) ?? new Set();
		set.add(listener);
		this.listeners.set(event, set);
	}

	emit(event: StoreEvent): void {
		for (const listener of this.listeners.get(event) ?? []) listener();
	}

	commit(next: Schema, label: string, options: { coalesce?: string; select?: Selection } = {}): void {
		if (next === this.schema) return;
		this.history.record(this.schema, options.coalesce, Date.now(), label);
		this.schema = next;
		if (options.select) this.selection = options.select;
		this.pruneSelection();
		this.emit('schema');
		this.emit('history');
		if (options.select) this.emit('selection');
	}

	replace(next: Schema): void {
		this.schema = next;
		this.pruneSelection();
		this.emit('schema');
	}

	undo(): string | null {
		const entry = this.history.undoEntry(this.schema);
		if (!entry) return null;
		this.schema = entry.schema;
		this.pruneSelection();
		this.emit('schema');
		this.emit('history');
		this.emit('selection');
		return entry.label;
	}

	redo(): string | null {
		const entry = this.history.redoEntry(this.schema);
		if (!entry) return null;
		this.schema = entry.schema;
		this.pruneSelection();
		this.emit('schema');
		this.emit('history');
		this.emit('selection');
		return entry.label;
	}

	discard(matches: (before: Schema) => boolean): boolean {
		const before = this.history.peek();
		if (!before || !matches(before)) return false;
		this.history.drop();
		this.schema = before;
		this.pruneSelection();
		this.emit('schema');
		this.emit('history');
		return true;
	}

	select(selection: Selection, focusColumn: { table: string; column: string } | null = null): void {
		this.selection = selection;
		this.focusColumn = focusColumn;
		this.emit('selection');
	}

	setDialect(dialect: DialectId): void {
		if (dialect === this.dialect) return;
		this.dialect = dialect;
		this.emit('dialect');
	}

	setView(view: View): void {
		this.view = view;
		this.emit('view');
	}

	issues(): DesignIssue[] {
		const cache = this.cachedIssues;
		if (cache && cache.schema === this.schema && cache.dialect === this.dialect) return cache.issues;
		const issues = analyze(this.schema, this.dialect);
		this.cachedIssues = { schema: this.schema, dialect: this.dialect, issues };
		return issues;
	}

	score(): number | null {
		return this.schema.tables.length === 0 ? null : score(this.issues());
	}

	private pruneSelection(): void {
		const tables = new Set(this.schema.tables.map((t) => t.id));
		const relations = new Set(this.schema.relations.map((r) => r.id));
		const notes = new Set(this.schema.notes.map((n) => n.id));
		const areas = new Set(this.schema.areas.map((a) => a.id));
		const s = this.selection;
		const next: Selection = {
			tables: s.tables.filter((id) => tables.has(id)),
			relations: s.relations.filter((id) => relations.has(id)),
			notes: s.notes.filter((id) => notes.has(id)),
			areas: s.areas.filter((id) => areas.has(id))
		};
		if (next.tables.length !== s.tables.length || next.relations.length !== s.relations.length || next.notes.length !== s.notes.length || next.areas.length !== s.areas.length) {
			this.selection = next;
		}
		if (this.focusColumn) {
			const table = this.schema.tables.find((t) => t.id === this.focusColumn?.table);
			if (!table || !table.columns.some((c) => c.id === this.focusColumn?.column)) this.focusColumn = null;
		}
	}
}

export function isEmptySelection(s: Selection): boolean {
	return s.tables.length + s.relations.length + s.notes.length + s.areas.length === 0;
}
