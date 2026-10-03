import { h, icon, prefersReducedMotion, type IconName } from './dom';

type Anchor = Element | { x: number; y: number };

function rectOf(anchor: Anchor): DOMRect {
	if (anchor instanceof Element) return anchor.getBoundingClientRect();
	return new DOMRect(anchor.x, anchor.y, 0, 0);
}

function place(panel: HTMLElement, anchor: Anchor, gap = 10): void {
	const rect = rectOf(anchor);
	const width = panel.offsetWidth;
	const height = panel.offsetHeight;
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const centre = rect.left + rect.width / 2;
	const left = Math.min(Math.max(12, centre - Math.min(40, width / 2)), vw - width - 12);
	const below = rect.bottom + gap + height <= vh - 8 || rect.top - gap - height < 8;
	const top = below ? Math.min(rect.bottom + gap, vh - height - 8) : rect.top - gap - height;
	panel.style.left = `${Math.max(8, left)}px`;
	panel.style.top = `${Math.max(8, top)}px`;
	panel.dataset.side = below ? 'below' : 'above';
	panel.style.setProperty('--tip-x', `${Math.min(Math.max(14, centre - left), width - 14)}px`);
}

export class Bubble {
	private panel: HTMLElement | null = null;
	private anchor: Anchor | null = null;
	private returnFocus: HTMLElement | null = null;
	private onClose: (() => void) | undefined;
	readonly key = { current: '' };

	constructor(private readonly host: HTMLElement) {
		document.addEventListener('pointerdown', (event) => {
			if (!this.panel) return;
			const target = event.target as Node;
			if (this.panel.contains(target)) return;
			if (this.anchor instanceof Element && this.anchor.contains(target)) return;
			if ((target as Element).closest?.('.sf-menu')) return;
			this.close(false);
		});
		window.addEventListener('resize', () => this.reposition());
	}

	get isOpen(): boolean {
		return this.panel !== null;
	}

	open(anchor: Anchor, content: HTMLElement, options: { label: string; key: string; returnFocus?: HTMLElement | null; onClose?: () => void; className?: string; focus?: boolean; tip?: boolean }): HTMLElement {
		this.close(false);
		const titleId = `sf-bubble-${Math.random().toString(36).slice(2, 8)}`;
		const panel = h('div', { class: `sf-bubble ${options.className ?? ''}`, role: 'dialog', 'aria-modal': 'false', 'aria-label': options.label, 'data-tip': options.tip === false ? null : '' });
		panel.id = titleId;
		panel.append(content);
		panel.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				event.stopPropagation();
				this.close(true);
			}
		});
		this.host.append(panel);
		this.panel = panel;
		this.anchor = anchor;
		this.returnFocus = options.returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
		this.onClose = options.onClose;
		this.key.current = options.key;
		place(panel, anchor);
		if (!prefersReducedMotion()) panel.animate([{ opacity: 0, transform: 'scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 120, easing: 'ease-out' });
		if (options.focus !== false) {
			const first = panel.querySelector<HTMLElement>('input, select, textarea, button:not([data-close]), [tabindex]:not([tabindex="-1"])') ?? panel.querySelector<HTMLElement>('button');
			first?.focus();
		}
		return panel;
	}

	reposition(anchor?: Anchor): void {
		if (!this.panel) return;
		if (anchor) this.anchor = anchor;
		if (this.anchor instanceof Element && !this.anchor.isConnected) {
			this.close(false);
			return;
		}
		if (this.anchor) place(this.panel, this.anchor);
	}

	close(restoreFocus = true): void {
		if (!this.panel) return;
		const panel = this.panel;
		const onClose = this.onClose;
		this.panel = null;
		this.anchor = null;
		this.key.current = '';
		this.onClose = undefined;
		panel.remove();
		onClose?.();
		if (restoreFocus && this.returnFocus?.isConnected) this.returnFocus.focus();
		this.returnFocus = null;
	}
}

export interface MenuItem {
	label?: string;
	shortcut?: string;
	disabled?: boolean;
	danger?: boolean;
	checked?: boolean;
	kind?: 'item' | 'check' | 'radio' | 'separator';
	swatch?: string;
	icon?: IconName;
	action?: () => void;
}

export class Menus {
	private panel: HTMLElement | null = null;
	private returnFocus: HTMLElement | null = null;
	private onClose: (() => void) | undefined;

	constructor(private readonly host: HTMLElement) {
		document.addEventListener('pointerdown', (event) => {
			if (this.panel && !this.panel.contains(event.target as Node)) this.close(false);
		});
		window.addEventListener('blur', () => this.close(false));
	}

	get isOpen(): boolean {
		return this.panel !== null;
	}

	open(anchor: Anchor, items: MenuItem[], options: { label: string; returnFocus?: HTMLElement | null; onClose?: () => void } = { label: '' }): void {
		this.close(false);
		const panel = h('div', { class: 'sf-menu', role: 'menu', 'aria-label': options.label, tabindex: '-1' });
		const buttons: HTMLElement[] = [];
		for (const item of items) {
			if (item.kind === 'separator') {
				panel.append(h('div', { class: 'sf-menu-sep', role: 'separator' }));
				continue;
			}
			const role = item.kind === 'check' ? 'menuitemcheckbox' : item.kind === 'radio' ? 'menuitemradio' : 'menuitem';
			const button = h('button', {
				type: 'button',
				class: `sf-menu-item${item.danger ? ' danger' : ''}`,
				role,
				tabindex: '-1',
				'aria-checked': item.kind === 'check' || item.kind === 'radio' ? String(Boolean(item.checked)) : null,
				'aria-disabled': item.disabled ? 'true' : null
			});
			const lead = h('span', { class: 'sf-menu-lead', 'aria-hidden': 'true' });
			if (item.swatch !== undefined) lead.append(h('span', { class: `sf-swatch sf-swatch-${item.swatch}` }));
			else if (item.kind === 'check' || item.kind === 'radio') {
				if (item.checked) lead.append(icon('check', 14));
			} else if (item.icon) lead.append(icon(item.icon, 14));
			button.append(lead, h('span', { class: 'sf-menu-label', text: item.label ?? '' }));
			if (item.shortcut) button.append(h('kbd', { class: 'sf-menu-kbd', text: item.shortcut }));
			button.addEventListener('click', () => {
				if (item.disabled) return;
				this.close(false);
				item.action?.();
			});
			buttons.push(button);
			panel.append(button);
		}
		panel.addEventListener('keydown', (event) => {
			const enabled = buttons.filter((b) => b.getAttribute('aria-disabled') !== 'true');
			const at = enabled.indexOf(document.activeElement as HTMLElement);
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				enabled[(at + 1) % enabled.length]?.focus();
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				enabled[(at - 1 + enabled.length) % enabled.length]?.focus();
			} else if (event.key === 'Home') {
				event.preventDefault();
				enabled[0]?.focus();
			} else if (event.key === 'End') {
				event.preventDefault();
				enabled[enabled.length - 1]?.focus();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				this.close(true);
			} else if (event.key === 'Tab') {
				this.close(true);
			} else if (event.key.length === 1) {
				const hit = enabled.find((b, i) => i > at && b.textContent?.toLowerCase().startsWith(event.key.toLowerCase())) ?? enabled.find((b) => b.textContent?.toLowerCase().startsWith(event.key.toLowerCase()));
				hit?.focus();
			}
		});
		this.host.append(panel);
		this.panel = panel;
		this.returnFocus = options.returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
		this.onClose = options.onClose;
		const rect = rectOf(anchor);
		const width = panel.offsetWidth;
		const height = panel.offsetHeight;
		const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
		const below = rect.bottom + 4 + height <= window.innerHeight - 8;
		panel.style.left = `${left}px`;
		panel.style.top = `${below ? rect.bottom + 4 : Math.max(8, rect.top - height - 4)}px`;
		(buttons.find((b) => b.getAttribute('aria-disabled') !== 'true') ?? panel).focus();
	}

	close(restoreFocus = true): void {
		if (!this.panel) return;
		this.panel.remove();
		this.panel = null;
		const onClose = this.onClose;
		this.onClose = undefined;
		onClose?.();
		if (restoreFocus && this.returnFocus?.isConnected) this.returnFocus.focus();
		this.returnFocus = null;
	}
}

export class Tooltips {
	private tip: HTMLElement;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private current: HTMLElement | null = null;

	constructor(host: HTMLElement) {
		this.tip = h('div', { class: 'sf-tooltip', role: 'tooltip', id: 'sf-tooltip', hidden: true });
		host.append(this.tip);
		host.addEventListener('pointerover', (event) => {
			if ((event as PointerEvent).pointerType !== 'mouse') return;
			const target = (event.target as Element).closest<HTMLElement>('[data-tip]');
			if (target === this.current) return;
			this.hide();
			if (target) this.timer = setTimeout(() => this.show(target), 450);
		});
		host.addEventListener('pointerout', (event) => {
			const next = (event as PointerEvent).relatedTarget as Element | null;
			if (this.current && next && this.current.contains(next)) return;
			if (!next?.closest?.('[data-tip]')) this.hide();
		});
		host.addEventListener('focusin', (event) => {
			const target = (event.target as Element).closest<HTMLElement>('[data-tip]');
			if (target?.matches(':focus-visible')) this.show(target);
		});
		host.addEventListener('focusout', () => this.hide());
		host.addEventListener('pointerdown', () => this.hide());
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') this.hide();
		});
	}

	show(target: HTMLElement): void {
		const text = target.dataset.tip;
		if (!text) return;
		this.current = target;
		this.tip.textContent = text;
		this.tip.hidden = false;
		target.setAttribute('aria-describedby', 'sf-tooltip');
		const rect = target.getBoundingClientRect();
		const width = this.tip.offsetWidth;
		const height = this.tip.offsetHeight;
		const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
		const top = rect.bottom + 8 + height < window.innerHeight ? rect.bottom + 8 : rect.top - height - 8;
		this.tip.style.left = `${left}px`;
		this.tip.style.top = `${top}px`;
	}

	hide(): void {
		clearTimeout(this.timer);
		this.current?.removeAttribute('aria-describedby');
		this.current = null;
		this.tip.hidden = true;
	}
}

export class Toasts {
	private node: HTMLElement;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private remaining = 0;
	private started = 0;

	constructor(host: HTMLElement) {
		this.node = h('div', { class: 'sf-toast', role: 'status', 'aria-live': 'polite', hidden: true });
		host.append(this.node);
		const pause = () => {
			if (!this.timer) return;
			clearTimeout(this.timer);
			this.timer = undefined;
			this.remaining -= Date.now() - this.started;
		};
		const resume = () => {
			if (this.node.hidden || this.timer) return;
			this.arm(Math.max(1500, this.remaining));
		};
		this.node.addEventListener('pointerenter', pause);
		this.node.addEventListener('pointerleave', resume);
		this.node.addEventListener('focusin', pause);
		this.node.addEventListener('focusout', resume);
	}

	private arm(ms: number): void {
		this.remaining = ms;
		this.started = Date.now();
		this.timer = setTimeout(() => this.hide(), ms);
	}

	show(text: string, action?: { label: string; run: () => void }, kind: 'info' | 'error' = 'info'): void {
		clearTimeout(this.timer);
		this.timer = undefined;
		this.node.replaceChildren(h('span', { text }));
		this.node.dataset.kind = kind;
		if (action) {
			const button = h('button', { type: 'button', class: 'sf-toast-action', text: action.label });
			button.addEventListener('click', () => {
				this.hide();
				action.run();
			});
			this.node.append(button);
		}
		this.node.hidden = false;
		this.arm(action ? 8000 : 5000);
	}

	hide(): void {
		clearTimeout(this.timer);
		this.timer = undefined;
		this.node.hidden = true;
	}
}

export class Live {
	private last = '';

	constructor(private readonly node: HTMLElement) {}

	say(text: string): void {
		const next = text === this.last ? `${text}​` : text;
		this.last = next;
		this.node.textContent = '';
		requestAnimationFrame(() => {
			this.node.textContent = next;
		});
	}
}

export interface BannerAction {
	label: string;
	run: () => void;
	primary?: boolean;
}

export class Banners {
	private items = new Map<string, HTMLElement>();

	constructor(private readonly host: HTMLElement, private readonly closeLabel: string) {}

	show(key: string, kind: 'info' | 'warning' | 'error', text: string, actions: BannerAction[] = []): void {
		this.hide(key);
		const banner = h('div', { class: `sf-banner sf-banner-${kind}`, role: kind === 'error' ? 'alert' : 'status' });
		banner.append(h('span', { class: 'sf-banner-text', text }));
		const buttons = h('div', { class: 'sf-banner-actions' });
		for (const action of actions) {
			const button = h('button', { type: 'button', class: `sf-btn${action.primary ? ' sf-btn-primary' : ''}`, text: action.label });
			button.addEventListener('click', () => {
				this.hide(key);
				action.run();
			});
			buttons.append(button);
		}
		const close = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': this.closeLabel, 'data-tip': this.closeLabel });
		close.append(icon('close', 14));
		close.addEventListener('click', () => this.hide(key));
		buttons.append(close);
		banner.append(buttons);
		this.host.append(banner);
		this.items.set(key, banner);
	}

	hide(key: string): void {
		this.items.get(key)?.remove();
		this.items.delete(key);
	}
}
