type TurnstileApi = {
	render(container: HTMLElement, options: Readonly<Record<string, unknown>>): string | undefined;
	execute(widget: string): void;
	reset(widget: string): void;
};

export type BotCheck = {
	token(): Promise<string>;
	reset(): void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_ACTION = 'scan';

let turnstileLoad: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
	turnstileLoad ??= new Promise<TurnstileApi>((resolve, reject) => {
		if (window.turnstile) {
			resolve(window.turnstile);
			return;
		}
		const script = document.createElement('script');
		script.src = TURNSTILE_SCRIPT;
		script.async = true;
		script.addEventListener('load', () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile_load'))));
		script.addEventListener('error', () => reject(new Error('turnstile_load')));
		document.head.append(script);
	}).catch((error: unknown) => {
		turnstileLoad = undefined;
		throw error;
	});
	return turnstileLoad;
}

function pageTheme(): string {
	const theme = document.documentElement.dataset['theme'];
	return theme === 'dark' || theme === 'light' ? theme : 'auto';
}

export function createBotCheck(container: HTMLElement, siteKey: string): BotCheck {
	let widget: string | undefined;
	let pending: { resolve(token: string): void; reject(error: Error): void } | undefined;
	const settle = (outcome: string | Error): void => {
		const current = pending;
		pending = undefined;
		if (current === undefined) {
			return;
		}
		if (typeof outcome === 'string') {
			current.resolve(outcome);
		} else {
			current.reject(outcome);
		}
	};
	return {
		async token() {
			const api = await loadTurnstile();
			return new Promise<string>((resolve, reject) => {
				pending = { resolve, reject };
				widget ??= api.render(container, {
					'sitekey': siteKey,
					'action': TURNSTILE_ACTION,
					'appearance': 'interaction-only',
					'execution': 'execute',
					'retry': 'never',
					'language': document.documentElement.lang || 'auto',
					'theme': pageTheme(),
					'callback': (token: string) => settle(token),
					'error-callback': () => settle(new Error('turnstile_failed')),
					'timeout-callback': () => settle(new Error('turnstile_failed')),
					'expired-callback': () => settle(new Error('turnstile_failed'))
				});
				if (widget === undefined) {
					settle(new Error('turnstile_load'));
					return;
				}
				api.execute(widget);
			});
		},
		reset() {
			if (widget !== undefined) {
				window.turnstile?.reset(widget);
			}
		}
	};
}
