import type { Schema } from './types';

interface Entry {
	schema: Schema;
	label: string;
}

export class History {
	private past: Entry[] = [];
	private future: Entry[] = [];
	private lastKey: string | undefined;
	private lastTime = 0;

	constructor(private readonly limit = 100) {}

	record(before: Schema, key?: string, now = Date.now(), label = ''): void {
		const coalesce = key !== undefined && key === this.lastKey && now - this.lastTime < 1000;
		this.lastKey = key;
		this.lastTime = now;
		this.future = [];
		if (coalesce) return;
		this.past.push({ schema: before, label });
		if (this.past.length > this.limit) this.past.shift();
	}

	undoEntry(current: Schema): Entry | null {
		const previous = this.past.pop();
		if (!previous) return null;
		this.future.push({ schema: current, label: previous.label });
		this.lastKey = undefined;
		return previous;
	}

	redoEntry(current: Schema): Entry | null {
		const next = this.future.pop();
		if (!next) return null;
		this.past.push({ schema: current, label: next.label });
		this.lastKey = undefined;
		return next;
	}

	undo(current: Schema): Schema | null {
		return this.undoEntry(current)?.schema ?? null;
	}

	redo(current: Schema): Schema | null {
		return this.redoEntry(current)?.schema ?? null;
	}

	clear(): void {
		this.past = [];
		this.future = [];
		this.lastKey = undefined;
	}

	breakCoalescing(): void {
		this.lastKey = undefined;
	}

	get canUndo(): boolean {
		return this.past.length > 0;
	}

	get canRedo(): boolean {
		return this.future.length > 0;
	}

	get undoLabel(): string {
		return this.past[this.past.length - 1]?.label ?? '';
	}

	get redoLabel(): string {
		return this.future[this.future.length - 1]?.label ?? '';
	}
}
