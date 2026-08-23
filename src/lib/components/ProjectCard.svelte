<script lang="ts">
	import AreaChip from './AreaChip.svelte';
	import type { Project } from '$lib/content';
	import { path, t, type Lang } from '$lib/i18n';

	let {
		project,
		lang,
		featured = false
	}: { project: Project; lang: Lang; featured?: boolean } = $props();

	const meta = $derived(project.meta);
	const strings = $derived(t(lang));
	const href = $derived(
		meta.tier === 'ficha' ? path(lang, 'project', meta.slug) : (meta.repo ?? null)
	);
	const years = $derived(
		meta.period.end === null
			? `${meta.period.start} — ${strings.project.present}`
			: meta.period.end.slice(0, 4) === meta.period.start.slice(0, 4)
				? meta.period.start.slice(0, 4)
				: `${meta.period.start.slice(0, 4)} — ${meta.period.end.slice(0, 4)}`
	);
</script>

<article class="card" class:featured>
	<div class="eyebrow">
		<span>{strings.kind[meta.kind]}</span>
		{#if meta.org}<span class="sep" aria-hidden="true">·</span><span>{meta.org}</span>{/if}
		<span class="sep" aria-hidden="true">·</span>
		<span class="years">{years}</span>
	</div>

	<h3 class="title">
		{#if href}
			<a
				{href}
				rel={meta.tier === 'ficha' ? undefined : 'noreferrer'}
				target={meta.tier === 'ficha' ? undefined : '_blank'}
			>
				{meta.title}
			</a>
		{:else}
			{meta.title}
		{/if}
	</h3>

	<p class="tagline">{meta.tagline}</p>

	<ul class="areas">
		{#each meta.areas as area (area)}
			<li><AreaChip {area} {lang} size="sm" /></li>
		{/each}
	</ul>
</article>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		transition:
			border-color 140ms ease,
			transform 140ms ease,
			box-shadow 140ms ease;
	}

	.card:has(a:hover),
	.card:has(a:focus-visible) {
		border-color: var(--line-strong);
		transform: translateY(-2px);
		box-shadow: var(--shadow-card);
	}

	.featured {
		padding: 1.5rem;
	}

	.eyebrow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}

	.sep {
		color: var(--line-strong);
	}

	.title {
		font-size: 1.0625rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin: 0;
	}

	.featured .title {
		font-size: 1.375rem;
	}

	/* Stretched link: the whole card is the hit target, the anchor stays the
	   only thing in the tab order. */
	.title a {
		text-decoration: none;
	}

	.title a::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	.tagline {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.9375rem;
		line-height: 1.55;
		max-width: 46ch;
	}

	.areas {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0;
	}
</style>
