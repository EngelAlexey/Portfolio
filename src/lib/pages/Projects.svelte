<script lang="ts">
	import AreaFilter from '$lib/components/AreaFilter.svelte';
	import Container from '$lib/components/Container.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { AreaId } from '$lib/areas';
	import { areaCounts, fichas, tarjetas } from '$lib/content';
	import { t, type Lang } from '$lib/i18n';

	let { lang }: { lang: Lang } = $props();

	const strings = $derived(t(lang));
	const counts = $derived(areaCounts(lang));

	let selected = $state<AreaId[]>([]);

	const matches = (areas: readonly AreaId[]) =>
		selected.length === 0 || selected.some((area) => areas.includes(area));

	const visibleFichas = $derived(fichas(lang).filter((p) => matches(p.meta.areas)));
	const visibleTarjetas = $derived(tarjetas(lang).filter((p) => matches(p.meta.areas)));
	const total = $derived(visibleFichas.length + visibleTarjetas.length);
</script>

<Seo
	{lang}
	key="projects"
	title={strings.meta.titleTemplate(strings.projects.title)}
	description={strings.projects.lead}
/>

<Container as="header">
	<div class="head">
		<h1>{strings.projects.title}</h1>
		<p>{strings.projects.lead}</p>
	</div>
</Container>

<Container>
	<AreaFilter {lang} {counts} bind:selected />
	<p class="results" aria-live="polite">
		{total === 1 ? strings.projects.resultsOne : strings.projects.resultsMany(total)}
	</p>
</Container>

<Container>
	{#if total === 0}
		<p class="empty">{strings.projects.empty}</p>
	{/if}

	{#if visibleFichas.length}
		<ul class="grid">
			{#each visibleFichas as project (project.meta.slug)}
				<li><ProjectCard {project} {lang} /></li>
			{/each}
		</ul>
	{/if}

	{#if visibleTarjetas.length}
		<div class="section-head">
			<h2>{strings.projects.moreTitle}</h2>
			<p>{strings.projects.moreLead}</p>
		</div>
		<ul class="grid compact">
			{#each visibleTarjetas as project (project.meta.slug)}
				<li><ProjectCard {project} {lang} /></li>
			{/each}
		</ul>
	{/if}
</Container>

<style>
	.head {
		padding-block: clamp(2.5rem, 7vw, 4rem) 1.5rem;
		max-width: 42rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 2.75rem);
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	.head p {
		margin: 0.6rem 0 0;
		color: var(--ink-muted);
		font-size: 1.0625rem;
		line-height: 1.6;
	}

	.results {
		margin: 0.9rem 0 1.5rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--ink-faint);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
		gap: 1rem;
		list-style: none;
		margin: 0 0 clamp(2.5rem, 6vw, 4rem);
		padding: 0;
	}

	.grid.compact {
		grid-template-columns: repeat(auto-fill, minmax(min(17rem, 100%), 1fr));
	}

	.section-head {
		padding-top: clamp(1rem, 3vw, 2rem);
		margin-bottom: 1.25rem;
	}

	.section-head h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.section-head p {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
		font-size: 0.9375rem;
	}

	.empty {
		margin: 0 0 3rem;
		color: var(--ink-muted);
	}
</style>
