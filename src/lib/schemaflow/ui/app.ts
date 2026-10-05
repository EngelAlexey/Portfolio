import { autoLayout } from '../model/layout';
import { emptySelection, type Selection } from '../model/ops';
import { decodeShare } from '../model/share';
import { clearBase, loadSaved, onExternalChange, save } from '../model/storage';
import { LIMITS, emptySchema, type Relation, type Schema } from '../model/types';
import type { Severity } from '../parse/issues';
import { openGlossary, openRelateBubble, openRelationBubble, type BubbleHost } from './bubbles';
import { Canvas, type CanvasHost } from './canvas';
import { h, icon, isTextField, mod, modLabel } from './dom';
import { Dock, type DockHost } from './dock';
import { Finder } from './finder';
import { DENSITIES, type Density } from './geometry';
import type { Gallery } from './gallery';
import { exportPng, exportSvg, mermaid, readFile, saveFile, shareContent } from './io';
import { Palette, type PaletteItem } from './palette';
import { Banners, Bubble, Live, Menus, Toasts, Tooltips } from './popups';
import { Sheet, type SheetHost, type SheetTab } from './sheet';
import { Store } from './store';
import { fill, summarize, type Strings } from './strings';

interface Prefs {
	dockOpen: boolean;
	dockWidth: number;
	sheetOpen: boolean;
	sheetTab: SheetTab;
	paletteOpen: boolean;
	density: Density;
}

const PREFS_KEY = 'sf:ui';

function loadPrefs(): Prefs {
	const defaults: Prefs = { dockOpen: true, dockWidth: 400, sheetOpen: false, sheetTab: 'review', paletteOpen: true, density: 'full' };
	try {
		const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
		return {
			dockOpen: typeof raw.dockOpen === 'boolean' ? raw.dockOpen : defaults.dockOpen,
			dockWidth: typeof raw.dockWidth === 'number' && raw.dockWidth >= 320 && raw.dockWidth <= 640 ? raw.dockWidth : defaults.dockWidth,
			sheetOpen: typeof raw.sheetOpen === 'boolean' ? raw.sheetOpen : defaults.sheetOpen,
			sheetTab: raw.sheetTab === 'properties' ? 'properties' : 'review',
			paletteOpen: typeof raw.paletteOpen === 'boolean' ? raw.paletteOpen : defaults.paletteOpen,
			density: DENSITIES.find((value) => value === raw.density) ?? defaults.density
		};
	} catch {
		return defaults;
	}
}

function savePrefs(prefs: Prefs): void {
	try {
		localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
	} catch {
		return;
	}
}

function q<T extends Element>(root: ParentNode, selector: string): T {
	const node = root.querySelector<T>(selector);
	if (!node) throw new Error(`Missing ${selector}`);
	return node;
}

export function mountSchemaFlow(root: HTMLElement): void {
	const strings = JSON.parse(root.dataset.strings ?? '{}') as Strings;
	const lang = (root.dataset.lang === 'en' ? 'en' : 'es') as 'es' | 'en';
	const t = strings;
	const store = new Store();
	const prefs = loadPrefs();
	const mobile = window.matchMedia('(max-width: 699px)');
	const tablet = window.matchMedia('(max-width: 1099px)');

	const overlay = h('div', { class: 'sf-overlay' });
	document.body.append(overlay);
	const bubble = new Bubble(overlay);
	const menus = new Menus(overlay);
	new Tooltips(document.body);
	const canvasEl = q<HTMLElement>(root, '[data-canvas]');
	const toasts = new Toasts(canvasEl);
	const live = new Live(q<HTMLElement>(root, '[data-live]'));
	const banners = new Banners(q<HTMLElement>(root, '[data-banners]'), t.close);
	const dockEl = q<HTMLElement>(root, '[data-dock]');
	const sheetEl = q<HTMLElement>(root, '[data-sheet]');
	const nameInput = q<HTMLInputElement>(root, '[data-name]');
	const saveState = q<HTMLElement>(root, '[data-save]');
	const scoreButton = q<HTMLButtonElement>(root, '[data-action="review"]');
	const undoButton = q<HTMLButtonElement>(root, '[data-action="undo"]');
	const redoButton = q<HTMLButtonElement>(root, '[data-action="redo"]');
	const propertiesButton = q<HTMLButtonElement>(root, '[data-action="properties"]');
	const dockButton = q<HTMLButtonElement>(root, '[data-action="toggle-dock"]');
	const fileInput = q<HTMLInputElement>(root, '[data-file]');
	const resize = q<HTMLElement>(root, '[data-resize]');

	let canvas: Canvas;
	let dock: Dock;
	let sheet: Sheet;
	let gallery: Gallery | null = null;
	let palette: Palette | null = null;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let findingsTimer: ReturnType<typeof setTimeout> | undefined;
	let lastFindings = '';
	let saveFailed = false;
	let mobilePanel: 'none' | 'code' | 'properties' | 'review' = 'none';

	const commit = (next: Schema, label: string, options: { coalesce?: string; select?: Selection } = {}) => {
		if (!label) {
			store.replace(next);
			return;
		}
		store.commit(next, label, options);
	};

	const designName = () => store.schema.name.trim();
	const fileBase = () => (designName() || 'schemaflow').replace(/[^\w.\-áéíóúüñÁÉÍÓÚÜÑ ]+/g, '_').replace(/\s+/g, '_').slice(0, 80) || 'schemaflow';

	const relationLabel = (relation: Relation) => canvas.relationLabel(relation);

	const bubbleHost: BubbleHost = {
		strings: t,
		bubble,
		live,
		commit,
		relationLabel,
		deleteRelation: (id) => canvas.deleteRelationWithToast(id),
		flash: (id) => canvas.flash(id)
	};

	const toastUndo = (text: string) => toasts.show(text, { label: t.toast.undo, run: () => undo() });

	const undo = () => {
		const label = store.undo();
		if (label) live.say(fill(t.live.undone, { action: label }));
	};
	const redo = () => {
		const label = store.redo();
		if (label) live.say(fill(t.live.redone, { action: label }));
	};

	const sheetInset = () => {
		if (mobile.matches || !sheet?.open) return 0;
		return sheetEl.offsetWidth + 24;
	};
	const bottomInset = () => (mobile.matches && mobilePanel !== 'none' ? Math.round(canvasEl.clientHeight * 0.55) : 0);
	const paletteEl = q<HTMLElement>(root, '[data-palette]');
	const leftInset = () => (mobile.matches || !palette?.isOpen ? 0 : paletteEl.offsetLeft + paletteEl.offsetWidth + 12);

	const canvasHost: CanvasHost = {
		strings: t,
		bubble,
		menus,
		toasts,
		live,
		overlay,
		commit,
		undo,
		openRelationBubble: (id, at) => openRelationBubble(store, bubbleHost, id, at),
		openRelate: (request, anchor) => {
			const card = request.tableId ? canvas.cardElement(request.tableId) : null;
			const at = anchor ?? card?.querySelector<HTMLElement>(request.columnId ? `.sf-row[data-column="${request.columnId}"]` : '.sf-card-head') ?? canvasEl;
			openRelateBubble(store, bubbleHost, request, at);
		},
		setDensity: (density) => setDensity(density),
		cycleDensity: () => cycleDensity(),
		openProperties: () => openSheet('properties'),
		openGlossary: (term, anchor) => openGlossary(t, bubble, term, anchor),
		sheetInset,
		leftInset,
		bottomInset,
		toastUndo,
		afterRename: (oldName) => {
			if (store.schema.extras.some((e) => new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(e.sql))) {
				toasts.show(fill(t.toast.renamedInExtras, { name: oldName }));
			}
		}
	};

	canvas = new Canvas(
		store,
		canvasHost,
		canvasEl,
		q<HTMLElement>(root, '[data-world]'),
		q<HTMLElement>(root, '[data-cards]'),
		q<HTMLElement>(root, '[data-notes]'),
		q<HTMLElement>(root, '[data-areas]'),
		q<SVGSVGElement>(root, '[data-edges]'),
		q<HTMLElement>(root, '[data-empty]'),
		q<HTMLElement>(root, '[data-pill]'),
		q<HTMLElement>(root, '[data-zoom-value]')
	);

	const dockHost: DockHost = {
		strings: t,
		lang,
		bubble,
		toasts,
		live,
		commit,
		undo,
		afterApply: (wasEmpty) => {
			if (wasEmpty) canvas.fit(null, false);
		},
		designName
	};
	dock = new Dock(store, dockHost, dockEl);

	const sheetHost: SheetHost = {
		...bubbleHost,
		overlay,
		toasts,
		openRelate: canvasHost.openRelate,
		openRelationBubble: (id, at) => openRelationBubble(store, bubbleHost, id, at),
		frame: (kind, id) => canvas.frame(kind, id),
		createArea: () => canvas.createArea(),
		duplicateSelected: () => canvas.duplicateSelected(),
		deleteSelected: () => canvas.deleteSelectionWithToast(),
		align: (mode) => canvas.alignSelected(mode),
		distribute: (axis) => canvas.distributeSelected(axis),
		arrangeSelected: () => canvas.arrangeSelected(),
		addColumn: (tableId) => canvas.addColumnAndEdit(tableId),
		deleteColumn: (tableId, columnId) => canvas.deleteColumnWithToast(tableId, columnId),
		onClose: () => {
			prefs.sheetOpen = false;
			savePrefs(prefs);
			syncPanels();
		},
		onTab: (tab) => {
			prefs.sheetOpen = true;
			prefs.sheetTab = tab;
			savePrefs(prefs);
			syncPanels();
		},
		scoreInfo: (anchor) => {
			const box = h('p', { class: 'sf-bubble-text', text: t.review.scoreInfo });
			bubble.open(anchor, box, { label: t.review.scoreInfoLabel, key: 'score-info' });
		}
	};
	sheet = new Sheet(store, sheetHost, sheetEl);

	function openSheet(tab: SheetTab): void {
		if (mobile.matches) setMobilePanel(tab);
		else sheet.show(tab, true);
	}

	function syncPanels(): void {
		const dockOpen = mobile.matches ? mobilePanel === 'code' : prefs.dockOpen;
		root.classList.toggle('sf-dock-closed', !dockOpen);
		root.classList.toggle('sf-dock-overlay', tablet.matches && !mobile.matches);
		dockButton.setAttribute('aria-pressed', String(dockOpen));
		propertiesButton.setAttribute('aria-pressed', String(sheet.open && sheet.tab === 'properties'));
		root.style.setProperty('--sf-dock-width', `${prefs.dockWidth}px`);
		for (const button of root.querySelectorAll<HTMLButtonElement>('[data-mobile]')) {
			const panel = button.dataset.mobile;
			const active = (panel === 'diagram' && mobilePanel === 'none') || panel === mobilePanel;
			button.setAttribute('aria-pressed', String(active));
		}
		root.dataset.mobilePanel = mobilePanel;
		if (dockOpen) void dock.ensureEditor();
	}

	function setMobilePanel(panel: 'none' | 'code' | 'properties' | 'review'): void {
		mobilePanel = panel;
		if (panel === 'properties' || panel === 'review') sheet.show(panel);
		else sheet.close();
		syncPanels();
	}

	const updateBar = () => {
		const history = store.history;
		undoButton.disabled = !history.canUndo;
		redoButton.disabled = !history.canRedo;
		const undoTip = history.canUndo ? fill(t.bar.undoTip, { action: history.undoLabel, shortcut: `${modLabel}+Z` }) : t.bar.nothingToUndo;
		const redoTip = history.canRedo ? fill(t.bar.redoTip, { action: history.redoLabel, shortcut: `${modLabel}+Y` }) : t.bar.nothingToRedo;
		undoButton.dataset.tip = undoTip;
		redoButton.dataset.tip = redoTip;
		const score = store.score();
		const text = scoreButton.querySelector<HTMLElement>('[data-score-text]');
		if (text) text.textContent = score === null ? t.bar.scoreEmpty : fill(t.bar.score, { n: score });
		const level = score === null ? '' : score >= 90 ? 'ok' : score >= 70 ? 'medium' : score >= 50 ? 'high' : 'critical';
		scoreButton.querySelector<HTMLElement>('[data-score-dot]')?.setAttribute('data-level', level);
		const counts = { error: 0, warning: 0, info: 0 };
		for (const issue of store.issues()) counts[issue.severity]++;
		const badge = root.querySelector<HTMLElement>('[data-review-count]');
		if (badge) {
			const n = counts.error + counts.warning;
			badge.textContent = n ? String(n) : '';
			badge.hidden = n === 0;
		}
		const empty = store.schema.tables.length === 0 && store.schema.notes.length === 0 && store.schema.areas.length === 0;
		root.querySelector<HTMLButtonElement>('[data-action="arrange"]')?.toggleAttribute('disabled', store.schema.tables.length === 0);
		root.classList.toggle('sf-empty-design', empty);
	};

	const updateFindings = () => {
		const issues = store.issues();
		const levels = new Map<string, Severity>();
		const rank: Record<Severity, number> = { error: 3, warning: 2, info: 1 };
		const errors = new Set<string>();
		for (const issue of issues) {
			if (issue.table && (!levels.has(issue.table) || rank[issue.severity] > rank[levels.get(issue.table) as Severity])) levels.set(issue.table, issue.severity);
			if (issue.relation && issue.severity === 'error') errors.add(issue.relation);
		}
		canvas.setFindings(levels, errors);
		clearTimeout(findingsTimer);
		findingsTimer = setTimeout(() => {
			const counts = { error: 0, warning: 0, info: 0 };
			for (const issue of issues) counts[issue.severity]++;
			const key = `${counts.error}:${counts.warning}`;
			if (lastFindings && key !== lastFindings && store.schema.tables.length > 0) live.say(fill(t.live.findings, { summary: summarize(t, { ...counts, info: 0 }) || summarize(t, { error: 0, warning: 0, info: counts.info }) }));
			lastFindings = key;
		}, 1000);
	};

	const updateSaveState = () => {
		if (saveFailed) {
			saveState.className = 'sf-save is-failed';
			saveState.replaceChildren(icon('warning', 14), h('span', { text: t.bar.saveFailed }));
			saveState.dataset.tip = t.bar.saveFailed;
			return;
		}
		saveState.className = 'sf-save';
		saveState.replaceChildren(icon('check', 14), h('span', { class: 'sf-save-text', text: t.bar.saved }));
		saveState.dataset.tip = fill(t.bar.savedAt, { time: new Date().toLocaleTimeString(lang === 'es' ? 'es' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) });
	};

	const scheduleSave = () => {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			const ok = save(store.schema, store.dialect);
			if (!ok && !saveFailed) {
				saveFailed = true;
				banners.show('save', 'error', t.banner.saveFailed, [{ label: t.menu.saveFile, run: () => saveFile(store.schema, fileBase()) }]);
			}
			if (ok) saveFailed = false;
			updateSaveState();
		}, 400);
	};

	store.on('schema', () => {
		updateFindings();
		canvas.render();
		updateBar();
		scheduleSave();
		if (nameInput !== document.activeElement) nameInput.value = store.schema.name;
		if (bubble.isOpen && bubble.key.current.startsWith('relation:')) {
			const id = bubble.key.current.slice('relation:'.length);
			if (!store.schema.relations.some((r) => r.id === id)) bubble.close(false);
		}
	});
	store.on('history', updateBar);
	store.on('selection', () => canvas.render());
	store.on('view', () => canvas.applyView());
	store.on('dialect', () => {
		updateFindings();
		canvas.render();
		updateBar();
		scheduleSave();
	});

	nameInput.addEventListener('input', () => {
		commit({ ...store.schema, name: nameInput.value.slice(0, LIMITS.name) }, fill(t.history.rename, { x: store.schema.name || t.bar.untitled }), { coalesce: 'design-name' });
	});
	nameInput.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === 'Escape') {
			event.preventDefault();
			canvasEl.focus({ preventScroll: true });
		}
	});

	let suppressToolClick = false;
	const tableItem: PaletteItem = { kind: 'table' };
	for (const tool of root.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
		tool.addEventListener('pointerdown', (event) => {
			if (event.button !== 0 || event.pointerType === 'touch') return;
			event.preventDefault();
			suppressToolClick = true;
			window.addEventListener('pointerup', () => setTimeout(() => (suppressToolClick = false), 0), { once: true });
			canvas.beginInsert(tableItem, event);
		});
		tool.addEventListener('click', () => {
			if (suppressToolClick) {
				suppressToolClick = false;
				return;
			}
			canvas.createTable();
		});
	}

	const syncPalette = () => {
		canvasEl.style.setProperty('--sf-left-inset', `${mobile.matches ? 0 : paletteEl.offsetLeft + paletteEl.offsetWidth}px`);
	};
	palette = new Palette(
		{
			strings: t,
			drag: (item, event) => canvas.beginInsert(item, event),
			activate: (item) => canvas.activateItem(item),
			toggled: (open) => {
				prefs.paletteOpen = open;
				savePrefs(prefs);
				syncPalette();
			}
		},
		paletteEl,
		prefs.paletteOpen
	);
	syncPalette();

	const loadTemplate = (schema: Schema, name: string) => {
		const named = { ...schema, name: designName() ? store.schema.name : name };
		commit(named, fill(t.history.template, { x: name }), { select: emptySelection() });
		canvas.fit(null, false);
		toasts.show(fill(t.gallery.loaded, { name }), { label: t.toast.undo, run: () => undo() });
		live.say(fill(t.gallery.loaded, { name }));
	};

	const openGallery = async () => {
		if (!gallery) {
			const { Gallery } = await import('./gallery');
			gallery = new Gallery(t, lang, loadTemplate, () => store.schema.tables.length > 0);
		}
		await gallery.open();
	};

	let finder: Finder | null = null;
	const openFinder = () => {
		finder ??= new Finder(t, {
			schema: () => store.schema,
			jump: (hit) => {
				if (mobile.matches && mobilePanel !== 'none') setMobilePanel('none');
				store.select({ ...emptySelection(), tables: [hit.table] }, hit.kind === 'column' ? { table: hit.table, column: hit.column } : null);
				canvas.frame('table', hit.table);
				canvas.focusTable(hit.table, hit.kind === 'column' ? hit.column : undefined);
			}
		});
		finder.open();
	};

	const densityButton = q<HTMLButtonElement>(root, '[data-action="density"]');
	const DENSITY_ICONS = { full: 'rows', keys: 'rowsKeys', names: 'rowsNames' } as const;
	const nextDensity = () => DENSITIES[(DENSITIES.indexOf(prefs.density) + 1) % DENSITIES.length] ?? 'full';
	const syncDensity = () => {
		const words = t.density;
		densityButton.setAttribute('aria-label', fill(words.label, { current: words[prefs.density] }));
		densityButton.dataset.tip = fill(words.tip, { current: words[prefs.density], next: words[nextDensity()] });
		densityButton.replaceChildren(icon(DENSITY_ICONS[prefs.density], 16));
	};
	function setDensity(density: Density, announce = false): void {
		if (density === prefs.density) return;
		prefs.density = density;
		savePrefs(prefs);
		canvas.setDensity(density);
		syncDensity();
		if (announce) live.say(fill(t.density.changed, { current: t.density[density] }));
	}
	function cycleDensity(): void {
		setDensity(nextDensity(), true);
	}
	canvas.setDensity(prefs.density);
	syncDensity();
	q<HTMLButtonElement>(root, '[data-action="find"]').dataset.tip = fill(t.bar.findTip, { shortcut: `${modLabel}+K` });

	let elements: { dialog: HTMLDialogElement; palette: Palette } | null = null;
	const openElements = () => {
		if (!elements) {
			const dialog = h('dialog', { class: 'sf-elements', 'aria-labelledby': 'sf-elements-title' }) as HTMLDialogElement;
			const close = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': t.close, 'data-tip': t.close });
			close.append(icon('close', 16));
			close.addEventListener('click', () => dialog.close());
			const head = h('div', { class: 'sf-gallery-head' }, h('h2', { id: 'sf-elements-title', class: 'sf-gallery-title', text: t.palette.title }), close);
			const body = h('div', { class: 'sf-elements-panel' });
			dialog.append(head, body);
			dialog.addEventListener('click', (event) => {
				if (event.target === dialog) dialog.close();
			});
			document.body.append(dialog);
			const palette = new Palette(
				{
					strings: t,
					drag: () => {},
					activate: (item) => {
						dialog.close();
						canvas.activateItem(item);
					},
					toggled: () => {}
				},
				body,
				true,
				true
			);
			elements = { dialog, palette };
		}
		elements.palette.reset();
		elements.dialog.showModal();
	};

	let exportDialog: import('./export-dialog').ExportDialog | null = null;
	const openExport = async () => {
		if (!exportDialog) {
			const { ExportDialog } = await import('./export-dialog');
			exportDialog = new ExportDialog(t, { schema: () => store.schema, dialect: () => store.dialect, fileBase });
		}
		exportDialog.open();
	};

	let migrationDialog: import('./migration-dialog').MigrationDialog | null = null;
	const openMigration = async () => {
		if (!migrationDialog) {
			const { MigrationDialog } = await import('./migration-dialog');
			migrationDialog = new MigrationDialog(t, lang, { schema: () => store.schema, dialect: () => store.dialect, fileBase });
		}
		migrationDialog.open();
	};

	const openFile = () => fileInput.click();
	fileInput.addEventListener('change', async () => {
		const file = fileInput.files?.[0];
		fileInput.value = '';
		if (!file) return;
		const result = await readFile(file);
		if (result.kind === 'error') {
			toasts.show(result.reason === 'tooLarge' ? t.file.tooLarge : t.file.invalid, undefined, 'error');
			return;
		}
		if (result.kind === 'schema') {
			commit(result.schema, fill(t.history.openFile, { x: result.name }), { select: emptySelection() });
			canvas.fit(null, false);
			toasts.show(fill(t.file.opened, { name: result.name }), { label: t.toast.undo, run: () => undo() });
			return;
		}
		if (mobile.matches) setMobilePanel('code');
		else if (!prefs.dockOpen) toggleDock();
		dock.loadText(result.text, result.dialect);
		toasts.show(fill(t.file.codeOpened, { name: result.name }));
	});

	const newDesign = (anchor: HTMLElement) => {
		const content = h('div', { class: 'sf-bubble-body' });
		content.append(h('p', { class: 'sf-bubble-title', text: t.newDesign.title }), h('p', { class: 'sf-bubble-text', text: t.newDesign.body }));
		const row = h('div', { class: 'sf-bubble-actions' });
		const cancel = h('button', { type: 'button', class: 'sf-btn sf-btn-ghost', text: t.cancel });
		const saveButton = h('button', { type: 'button', class: 'sf-btn', text: t.menu.saveFile });
		const confirm = h('button', { type: 'button', class: 'sf-btn sf-btn-danger-solid', text: t.menu.newDesign });
		cancel.addEventListener('click', () => bubble.close(true));
		saveButton.addEventListener('click', () => {
			saveFile(store.schema, fileBase());
			toasts.show(t.file.saved);
		});
		confirm.addEventListener('click', () => {
			bubble.close(false);
			clearBase();
			commit(emptySchema(''), t.history.newDesign, { select: emptySelection() });
			store.setView({ zoom: 1, x: 60, y: 60 });
			canvasEl.focus({ preventScroll: true });
		});
		row.append(cancel, saveButton, confirm);
		content.append(row);
		bubble.open(anchor, content, { label: t.newDesign.title, key: 'new-design' });
	};

	const fileMenu = (anchor: HTMLElement) => {
		const empty = store.schema.tables.length === 0 && store.schema.notes.length === 0 && store.schema.areas.length === 0;
		anchor.setAttribute('aria-expanded', 'true');
		menus.open(
			anchor,
			[
				{ label: t.menu.newDesign, icon: 'plus', disabled: empty, action: () => newDesign(anchor) },
				{ label: t.menu.openFile, icon: 'file', shortcut: `${modLabel}+O`, action: openFile },
				{ label: t.menu.saveFile, icon: 'download', shortcut: `${modLabel}+S`, action: () => {
					saveFile(store.schema, fileBase());
					toasts.show(t.file.saved);
				} },
				{ kind: 'separator' },
				{ label: t.menu.importCode, icon: 'code', action: () => importCode() },
				{ kind: 'separator' },
				{ label: t.menu.exportSvg, disabled: empty, action: () => {
					exportSvg(store.schema, root, fileBase());
					toasts.show(t.export.svg);
				} },
				{ label: t.menu.exportPng, disabled: empty, action: async () => {
					const ok = await exportPng(store.schema, root, fileBase());
					toasts.show(ok ? t.export.png : t.export.pngFailed, undefined, ok ? 'info' : 'error');
				} },
				{ label: t.menu.copyMermaid, disabled: store.schema.tables.length === 0, action: async () => {
					const ok = await navigator.clipboard.writeText(mermaid(store.schema)).then(() => true, () => false);
					toasts.show(ok ? t.export.mermaid : t.copyFailed, undefined, ok ? 'info' : 'error');
				} },
				{ kind: 'separator' },
				{ label: t.menu.exportCode, icon: 'code', disabled: store.schema.tables.length === 0, action: () => void openExport() },
				{ label: t.menu.migration, icon: 'migrate', action: () => void openMigration() },
				{ kind: 'separator' },
				{ label: t.menu.shortcuts, icon: 'keyboard', shortcut: '?', action: () => shortcuts() }
			],
			{ label: t.bar.file, returnFocus: anchor, onClose: () => anchor.setAttribute('aria-expanded', 'false') }
		);
	};

	const importCode = () => {
		if (mobile.matches) setMobilePanel('code');
		else if (!prefs.dockOpen) toggleDock();
		dock.startImport();
	};

	const shareBubble = async (anchor: HTMLElement) => {
		const loading = h('p', { class: 'sf-bubble-text', text: t.share.preparing });
		bubble.open(anchor, loading, { label: t.share.title, key: 'share', focus: false });
		const content = await shareContent(store.schema, t, (ok) => {
			bubble.close(true);
			toasts.show(ok ? t.share.copied : t.copyFailed, undefined, ok ? 'info' : 'error');
		}, () => {
			saveFile(store.schema, fileBase());
			toasts.show(t.file.saved);
		});
		if (bubble.key.current === 'share') bubble.open(anchor, content, { label: t.share.title, key: 'share' });
	};

	let shortcutsDialog: HTMLDialogElement | null = null;
	const shortcuts = () => {
		if (!shortcutsDialog) {
			const k = t.shortcuts.items;
			const keys = t.shortcuts.keys;
			const groups: [string, [string, string][]][] = [
				[t.shortcuts.create, [['T', k.table], ['N', k.note], ['Z', k.area], ['R', k.relate], ['C', k.column], [`Alt + ${keys.drag}`, k.manyToMany]]],
				[t.shortcuts.edit, [['Enter · F2', k.rename], ['Alt + Enter', k.properties], ['Alt + ↑ ↓', k.moveColumn], [keys.arrows, k.nudge], [keys.del, k.delete], [`${modLabel} + D`, k.duplicate], [`${modLabel} + A`, k.selectAll], [`${modLabel} + Z`, k.undo], [`${modLabel} + Y`, k.redo]]],
				[t.shortcuts.view, [[`${modLabel} + K · /`, k.find], ['F', k.fit], ['V', k.density], ['+ −', k.zoom], ['0', k.zoomReset], [`${keys.rightDrag} · ${keys.space} + ${keys.drag} · ${keys.wheel}`, k.pan], [keys.backgroundDrag, k.marquee]]],
				[t.shortcuts.fileCode, [[`${modLabel} + Enter`, k.apply], [`${modLabel} + S`, k.save], [`${modLabel} + O`, k.open], ['?', k.help]]]
			];
			shortcutsDialog = h('dialog', { class: 'sf-shortcuts', 'aria-labelledby': 'sf-shortcuts-title' }) as HTMLDialogElement;
			const head = h('div', { class: 'sf-gallery-head' });
			const close = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': t.close });
			close.append(icon('close', 16));
			close.addEventListener('click', () => shortcutsDialog?.close());
			head.append(h('h2', { id: 'sf-shortcuts-title', class: 'sf-gallery-title', text: t.shortcuts.title }), close);
			const body = h('div', { class: 'sf-shortcuts-body' });
			for (const [title, items] of groups) {
				const section = h('section', {});
				section.append(h('h3', { class: 'sf-props-title', text: title }));
				const dl = h('dl', { class: 'sf-keys' });
				for (const [key, text] of items) dl.append(h('dt', {}, h('kbd', { text: key })), h('dd', { text }));
				section.append(dl);
				body.append(section);
			}
			shortcutsDialog.append(head, body);
			shortcutsDialog.addEventListener('click', (event) => {
				if (event.target === shortcutsDialog) shortcutsDialog?.close();
			});
			document.body.append(shortcutsDialog);
		}
		shortcutsDialog.showModal();
	};

	const toggleDock = () => {
		if (mobile.matches) {
			setMobilePanel(mobilePanel === 'code' ? 'none' : 'code');
			return;
		}
		prefs.dockOpen = !prefs.dockOpen;
		savePrefs(prefs);
		syncPanels();
	};

	root.addEventListener('click', (event) => {
		const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
		if (!target || !root.contains(target)) return;
		switch (target.dataset.action) {
			case 'toggle-dock':
				toggleDock();
				break;
			case 'undo':
				undo();
				break;
			case 'redo':
				redo();
				break;
			case 'arrange': {
				const positions = autoLayout(store.schema, undefined, undefined, canvas.heightOf);
				commit({ ...store.schema, tables: store.schema.tables.map((x) => ({ ...x, ...(positions.get(x.id) ?? {}) })) }, t.history.arrange);
				canvas.fit(null, true);
				break;
			}
			case 'review':
				if (mobile.matches) setMobilePanel(mobilePanel === 'review' ? 'none' : 'review');
				else sheet.toggle('review');
				break;
			case 'properties':
				if (mobile.matches) setMobilePanel(mobilePanel === 'properties' ? 'none' : 'properties');
				else sheet.toggle('properties');
				break;
			case 'templates':
				void openGallery();
				break;
			case 'share':
				void shareBubble(target);
				break;
			case 'file':
				fileMenu(target);
				break;
			case 'more':
				menus.open(target, [
					{ label: t.palette.title, icon: 'shapes', action: () => openElements() },
					{ label: t.bar.find, icon: 'search', action: () => openFinder() },
					{ label: t.bar.note, icon: 'note', action: () => canvas.createNote() },
					{ label: t.bar.area, icon: 'area', action: () => canvas.createArea() },
					{ label: t.bar.arrange, icon: 'arrange', disabled: store.schema.tables.length === 0, action: () => root.querySelector<HTMLButtonElement>('[data-action="arrange"]')?.click() },
					{ kind: 'separator' },
					{ label: t.bar.templates, icon: 'templates', action: () => void openGallery() },
					{ label: t.bar.share, icon: 'share', action: () => void shareBubble(target) },
					{ label: t.bar.file, icon: 'file', action: () => fileMenu(target) }
				], { label: t.bar.more, returnFocus: target });
				break;
			case 'empty-create':
				canvas.createTable();
				break;
			case 'empty-template':
				void openGallery();
				break;
			case 'empty-import':
				importCode();
				break;
			case 'empty-open':
				openFile();
				break;
			case 'find':
				openFinder();
				break;
			case 'density':
				cycleDensity();
				break;
			case 'zoom-in':
				canvas.setZoom(store.view.zoom * 1.2);
				break;
			case 'zoom-out':
				canvas.setZoom(store.view.zoom / 1.2);
				break;
			case 'zoom-reset':
				canvas.setZoom(1);
				break;
			case 'zoom-fit':
				canvas.fit(null, true);
				break;
			default:
				break;
		}
	});

	for (const button of root.querySelectorAll<HTMLButtonElement>('[data-mobile]')) {
		button.addEventListener('click', () => {
			const panel = button.dataset.mobile;
			if (panel === 'diagram') setMobilePanel('none');
			else if (panel === 'code' || panel === 'properties' || panel === 'review') setMobilePanel(mobilePanel === panel ? 'none' : panel);
		});
	}

	let resizing: { start: number; width: number } | null = null;
	resize.addEventListener('pointerdown', (event) => {
		event.preventDefault();
		resize.setPointerCapture(event.pointerId);
		resizing = { start: event.clientX, width: prefs.dockWidth };
	});
	resize.addEventListener('pointermove', (event) => {
		if (!resizing) return;
		prefs.dockWidth = Math.max(320, Math.min(640, resizing.width + event.clientX - resizing.start));
		root.style.setProperty('--sf-dock-width', `${prefs.dockWidth}px`);
		resize.setAttribute('aria-valuenow', String(prefs.dockWidth));
	});
	const endResize = () => {
		if (!resizing) return;
		resizing = null;
		savePrefs(prefs);
	};
	resize.addEventListener('pointerup', endResize);
	resize.addEventListener('pointercancel', endResize);
	resize.addEventListener('dblclick', () => {
		prefs.dockWidth = 400;
		savePrefs(prefs);
		syncPanels();
	});
	resize.addEventListener('keydown', (event) => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		prefs.dockWidth = Math.max(320, Math.min(640, prefs.dockWidth + (event.key === 'ArrowRight' ? 16 : -16)));
		resize.setAttribute('aria-valuenow', String(prefs.dockWidth));
		savePrefs(prefs);
		syncPanels();
	});

	const regions = () => [root.querySelector<HTMLElement>('.sf-bar'), prefs.dockOpen ? dockEl : null, canvasEl, root.querySelector<HTMLElement>('.sf-zoom'), sheet.open ? sheetEl : null].filter((x): x is HTMLElement => Boolean(x));

	document.addEventListener('keydown', (event) => {
		if (!root.isConnected) return;
		const inText = isTextField(event.target);
		const ctrl = mod(event);
		const key = event.key.toLowerCase();
		if (ctrl && key === 's') {
			event.preventDefault();
			saveFile(store.schema, fileBase());
			toasts.show(t.file.saved);
			return;
		}
		if (ctrl && key === 'o') {
			event.preventDefault();
			openFile();
			return;
		}
		if (ctrl && key === 'k') {
			event.preventDefault();
			openFinder();
			return;
		}
		if (event.key === 'F6') {
			event.preventDefault();
			const list = regions();
			const at = list.findIndex((r) => r.contains(document.activeElement));
			const next = list[(at + (event.shiftKey ? -1 : 1) + list.length) % list.length];
			(next?.querySelector<HTMLElement>('button, [tabindex="0"], input') ?? next)?.focus();
			return;
		}
		if (event.altKey && event.key === 'Enter' && !inText) {
			event.preventDefault();
			openSheet('properties');
			return;
		}
		if (inText || document.querySelector('dialog[open]')) return;
		if (ctrl && key === 'z' && !event.shiftKey) {
			event.preventDefault();
			undo();
			return;
		}
		if ((ctrl && key === 'y') || (ctrl && key === 'z' && event.shiftKey)) {
			event.preventDefault();
			redo();
			return;
		}
		if (event.key === '/' && canvasEl.contains(document.activeElement)) {
			event.preventDefault();
			openFinder();
			return;
		}
		if (event.key === '?' && canvasEl.contains(document.activeElement)) {
			event.preventDefault();
			shortcuts();
		}
	});

	mobile.addEventListener('change', () => {
		mobilePanel = 'none';
		if (!mobile.matches && prefs.sheetOpen) sheet.show(prefs.sheetTab);
		else if (mobile.matches) sheet.close();
		syncPanels();
		syncPalette();
	});
	tablet.addEventListener('change', () => {
		if (tablet.matches && !mobile.matches) prefs.dockOpen = false;
		syncPanels();
	});

	onExternalChange(() => {
		banners.show('other-tab', 'warning', t.banner.otherTab, [{ label: t.banner.reload, primary: true, run: () => location.reload() }]);
	});

	const restored = loadSaved();
	if (restored === 'corrupt') {
		banners.show('restore', 'error', t.banner.restoreFailed);
	} else if (restored) {
		store.schema = restored.schema;
		store.dialect = restored.dialect;
		dock.refresh();
	}
	const hash = location.hash.startsWith('#s=') ? location.hash.slice(3) : '';
	const clearHash = () => history.replaceState(null, '', location.pathname + location.search);
	if (hash) {
		void decodeShare(hash).then((shared) => {
			if (!shared) {
				banners.show('share', 'error', t.banner.linkBroken);
				clearHash();
				return;
			}
			const current = store.schema;
			const hasOwn = current.tables.length > 0 || current.notes.length > 0 || current.areas.length > 0;
			if (!hasOwn || JSON.stringify(current) === JSON.stringify(shared)) {
				store.replace(shared);
				canvas.fit(null, false);
				clearHash();
				return;
			}
			banners.show('share', 'info', t.banner.shared, [
				{ label: t.banner.openShared, primary: true, run: () => {
					commit(shared, t.history.openShared, { select: emptySelection() });
					canvas.fit(null, false);
					clearHash();
				} },
				{ label: t.banner.keepMine, run: clearHash }
			]);
		});
	}

	if (tablet.matches && !mobile.matches) prefs.dockOpen = false;
	if (mobile.matches) prefs.sheetOpen = false;
	syncPanels();
	if (prefs.sheetOpen && !mobile.matches) sheet.show(prefs.sheetTab);
	updateFindings();
	canvas.render();
	updateBar();
	updateSaveState();
	nameInput.value = store.schema.name;
	requestAnimationFrame(() => {
		canvas.fit(null, false);
		canvas.applyView();
	});
	if (prefs.dockOpen && !mobile.matches) void dock.ensureEditor();
	root.dataset.ready = '';
}
