<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { AREA_IDS, areaBlurb, areaLabel, areaStyle } from '$lib/areas';
	import { areaCounts, homeProjects } from '$lib/content';
	import { path, t, type Lang } from '$lib/i18n';

	let { lang }: { lang: Lang } = $props();

	const strings = $derived(t(lang));
	const featured = $derived(homeProjects(lang));
	const counts = $derived(areaCounts(lang));
</script>

<Seo
	{lang}
	key="home"
	title={strings.meta.defaultTitle}
	description={strings.meta.defaultDescription}
	person
/>

<Container as="header" size="wide">
	<div class="hero">
		<p class="eyebrow">{strings.home.eyebrow}</p>
		<h1>{strings.home.title}</h1>
		<p class="role">{strings.home.role}</p>
		<p class="pitch">{strings.home.pitch}</p>

		<div class="actions">
			<a class="btn primary" href={path(lang, 'projects')}>{strings.home.ctaProjects}</a>
			<a class="btn" href={path(lang, 'contact')}>{strings.home.ctaContact}</a>
		</div>
	</div>
</Container>

{#if featured.length}
	<Container>
		<div class="section-head">
			<h2>{strings.home.featuredTitle}</h2>
			<p>{strings.home.featuredLead}</p>
		</div>

		<ul class="grid">
			{#each featured as project (project.meta.slug)}
				<li><ProjectCard {project} {lang} featured /></li>
			{/each}
		</ul>

		<p class="more">
			<a href={path(lang, 'projects')}>{strings.home.featuredAll} →</a>
		</p>
	</Container>
{/if}

<Container>
	<div class="section-head">
		<h2>{strings.home.areasTitle}</h2>
		<p>{strings.home.areasLead}</p>
	</div>

	<ul class="areas">
		{#each AREA_IDS as area (area)}
			<li style={areaStyle(area)}>
				<span class="area-name">
					<span class="dot" aria-hidden="true"></span>
					{areaLabel(area, lang)}
				</span>
				<p class="area-blurb">{areaBlurb(area, lang)}</p>
				<span class="area-count">{strings.home.areasCount(counts[area])}</span>
			</li>
		{/each}
	</ul>
</Container>

<style>
	.hero {
		padding-block: clamp(3rem, 9vw, 6rem) clamp(2rem, 5vw, 3.5rem);
		max-width: 44rem;
	}

	.eyebrow {
		margin: 0 0 1rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		color: var(--ink-faint);
	}

	h1 {
		margin: 0;
		font-size: clamp(2.25rem, 6vw, 3.5rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}

	.role {
		margin: 0.6rem 0 0;
		font-size: clamp(1.125rem, 2.6vw, 1.5rem);
		color: var(--ink-muted);
		letter-spacing: -0.01em;
	}

	.pitch {
		margin: 1.5rem 0 0;
		font-size: 1.0625rem;
		line-height: 1.7;
		color: var(--ink-muted);
		max-width: 38rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.1rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		font-size: 0.9375rem;
		text-decoration: none;
		color: var(--ink);
		transition:
			background-color 120ms ease,
			border-color 120ms ease;
	}

	.btn:hover {
		border-color: var(--ink);
	}

	.btn.primary {
		background: var(--action);
		border-color: var(--action);
		color: var(--action-ink);
	}

	.btn.primary:hover {
		background: var(--action-hover);
		border-color: var(--action-hover);
	}

	.section-head {
		padding-top: clamp(2.5rem, 6vw, 4rem);
		margin-bottom: 1.5rem;
	}

	.section-head h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.section-head p {
		margin: 0.4rem 0 0;
		color: var(--ink-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(22rem, 100%), 1fr));
		gap: 1rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.more {
		margin: 1.25rem 0 0;
		font-size: 0.9375rem;
	}

	.more a {
		text-decoration: none;
		color: var(--ink-muted);
	}

	.more a:hover {
		color: var(--ink);
	}

	.areas {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(17rem, 100%), 1fr));
		gap: 1px;
		list-style: none;
		margin: 0 0 clamp(3rem, 7vw, 5rem);
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--line);
		overflow: hidden;
	}

	.areas li {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 1.1rem 1.25rem;
		background: var(--surface);
	}

	.area-name {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--chip-fg);
	}

	.dot {
		width: 0.45em;
		height: 0.45em;
		border-radius: 999px;
		background: currentColor;
	}

	.area-blurb {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.55;
		color: var(--ink-muted);
	}

	.area-count {
		margin-top: auto;
		padding-top: 0.4rem;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--ink-faint);
	}
</style>
