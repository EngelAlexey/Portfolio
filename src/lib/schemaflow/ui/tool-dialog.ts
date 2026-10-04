import { h, icon } from './dom';

export interface ToolDialog {
	dialog: HTMLDialogElement;
	open(): void;
	close(): void;
}

export function createToolDialog(options: { id: string; title: string; closeLabel: string; className: string }, ...sections: HTMLElement[]): ToolDialog {
	const dialog = h('dialog', { class: `sf-gallery sf-tool ${options.className}`, 'aria-labelledby': `${options.id}-title` }) as HTMLDialogElement;
	const head = h('div', { class: 'sf-gallery-head' });
	const close = h('button', { type: 'button', class: 'sf-icon-btn', 'aria-label': options.closeLabel, 'data-tip': options.closeLabel });
	close.append(icon('close', 16));
	head.append(h('h2', { id: `${options.id}-title`, class: 'sf-gallery-title', text: options.title }), close);
	dialog.append(head, ...sections);
	document.body.append(dialog);
	let returnFocus: HTMLElement | null = null;
	const api: ToolDialog = {
		dialog,
		open() {
			returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			if (!dialog.open) dialog.showModal();
		},
		close() {
			if (dialog.open) dialog.close();
		}
	};
	close.addEventListener('click', () => api.close());
	dialog.addEventListener('close', () => {
		if (returnFocus?.isConnected) returnFocus.focus();
	});
	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) api.close();
	});
	return api;
}
