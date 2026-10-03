type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | number | boolean | null | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value === null || value === undefined || value === false) continue;
		if (key === 'class') node.className = String(value);
		else if (key === 'text') node.textContent = String(value);
		else if (value === true) node.setAttribute(key, '');
		else node.setAttribute(key, String(value));
	}
	for (const child of children) {
		if (child === null || child === undefined || child === false) continue;
		node.append(typeof child === 'string' ? document.createTextNode(child) : child);
	}
	return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}): SVGElementTagNameMap[K] {
	const node = document.createElementNS(SVG_NS, tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value === null || value === undefined || value === false) continue;
		node.setAttribute(key, String(value));
	}
	return node;
}

export const ICONS = {
	table: 'M4 5h16v14H4zM4 10h16M10 10v9',
	note: 'M6 3h9l5 5v13H6zM14 3v6h6M9 13h7M9 17h5',
	area: 'M4 4h6M14 4h6v6M20 14v6h-6M10 20H4v-6M4 10V4',
	undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
	redo: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
	arrange: 'M4 4h6v6H4zM14 14h6v6h-6zM14 4h6v6h-6zM7 10v4a3 3 0 0 0 3 3h4',
	dock: 'M4 4h16v16H4zM10 4v16',
	properties: 'M4 4h16v16H4zM14 4v16M17 8h0M17 12h0',
	templates: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
	share: 'M8 12h8M15 7l5 5-5 5M4 4v16',
	file: 'M6 3h9l5 5v13H6zM14 3v6h6',
	more: 'M5 12h.01M12 12h.01M19 12h.01',
	plus: 'M12 5v14M5 12h14',
	minus: 'M5 12h14',
	fit: 'M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4',
	copy: 'M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
	download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
	close: 'M6 6l12 12M18 6 6 18',
	trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
	grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
	check: 'm5 12 5 5 9-10',
	play: 'M7 4v16l13-8z',
	stop: 'M6 6h12v12H6z',
	search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
	info: 'M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
	warning: 'M12 9v4M12 17h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
	error: 'M12 8v5M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
	diagram: 'M3 3h7v7H3zM14 14h7v7h-7zM10 6.5h3.5a2 2 0 0 1 2 2V14',
	code: 'm8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
	review: 'M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
	chevron: 'm6 9 6 6 6-6',
	link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
	keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
	spinner: 'M12 3a9 9 0 1 0 9 9'
} as const;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName, size = 16): SVGSVGElement {
	const svg = s('svg', {
		width: size,
		height: size,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		'stroke-width': 2,
		'stroke-linecap': 'round',
		'stroke-linejoin': 'round',
		'aria-hidden': 'true',
		class: `sf-icon sf-icon-${name}`
	});
	svg.append(s('path', { d: ICONS[name] }));
	return svg;
}

export function clearChildren(node: Element): void {
	while (node.firstChild) node.firstChild.remove();
}

export function isTextField(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
	if (target instanceof HTMLInputElement) return !['checkbox', 'radio', 'button', 'submit'].includes(target.type);
	return Boolean(target.closest('.cm-editor'));
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const mod = (e: KeyboardEvent | MouseEvent | PointerEvent | WheelEvent) => (isMac ? e.metaKey : e.ctrlKey);
export const modLabel = isMac ? '⌘' : 'Ctrl';

export function prefersReducedMotion(): boolean {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function download(name: string, content: Blob | string, type = 'text/plain;charset=utf-8'): void {
	const blob = content instanceof Blob ? content : new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const link = h('a', { href: url, download: name });
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
