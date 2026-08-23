<script lang="ts">
	import { page } from '$app/state';
	import { alternatePath, other, t, type Lang } from '$lib/i18n';

	let { lang }: { lang: Lang } = $props();

	const href = $derived(alternatePath(page.url.pathname));
	const strings = $derived(t(lang).a11y);
</script>

<a {href} class="switch" hreflang={other(lang)} aria-label={strings.langSwitch}>
	{strings.langSwitchShort}
</a>

<style>
	.switch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2.25rem;
		padding-inline: 0.7rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink-muted);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-decoration: none;
		transition:
			color 120ms ease,
			border-color 120ms ease;
	}

	.switch:hover {
		color: var(--ink);
		border-color: var(--line-strong);
	}
</style>
