<script lang="ts">
	import { page } from '$app/state';
	import Container from '$lib/components/Container.svelte';
	import { langFromPathname, path, t } from '$lib/i18n';

	const lang = $derived(langFromPathname(page.url.pathname));
	const strings = $derived(t(lang).notFound);
</script>

<Container size="text">
	<div class="wrap">
		<p class="status">{page.status}</p>
		<h1>{strings.title}</h1>
		<p class="body">{strings.body}</p>
		<a href={path(lang, 'home')}>← {strings.back}</a>
	</div>
</Container>

<style>
	.wrap {
		padding-block: clamp(4rem, 12vw, 8rem);
	}

	.status {
		margin: 0 0 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--ink-faint);
	}

	h1 {
		margin: 0;
		font-size: clamp(1.75rem, 5vw, 2.5rem);
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.body {
		margin: 0.6rem 0 1.5rem;
		color: var(--ink-muted);
	}

	a {
		color: var(--ink-muted);
		text-decoration: none;
		font-size: 0.9375rem;
	}

	a:hover {
		color: var(--ink);
	}
</style>
