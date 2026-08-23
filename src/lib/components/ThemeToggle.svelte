<script lang="ts">
	import { t, type Lang } from '$lib/i18n';

	let { lang }: { lang: Lang } = $props();

	let theme = $state<'light' | 'dark'>('light');
	let ready = $state(false);

	// The inline script in app.html already painted the right theme; this only
	// syncs the button label once the component is alive.
	$effect(() => {
		const stored = document.documentElement.dataset.theme;
		theme =
			stored === 'dark' || stored === 'light'
				? stored
				: window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light';
		ready = true;
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			/* storage blocked: the choice just does not persist */
		}
	}

	const label = $derived(theme === 'dark' ? t(lang).a11y.themeToLight : t(lang).a11y.themeToDark);
</script>

<button type="button" class="toggle" onclick={toggle} aria-label={label} title={label}>
	{#if ready && theme === 'dark'}
		<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
			<circle cx="12" cy="12" r="4.2" fill="currentColor" />
			<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
				<path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4" />
				<path d="M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
			</g>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
			<path
				d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.6 8.6 0 1 0 10.4 10.4z"
				fill="currentColor"
			/>
		</svg>
	{/if}
</button>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink-muted);
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease;
	}

	.toggle:hover {
		color: var(--ink);
		border-color: var(--line-strong);
	}
</style>
