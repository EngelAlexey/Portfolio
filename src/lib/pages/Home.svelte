<script lang="ts">
	import BrandMark from '$lib/components/BrandMark.svelte';
	import Container from '$lib/components/Container.svelte';
	import OrgMark from '$lib/components/OrgMark.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ProofStrip from '$lib/components/ProofStrip.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ToolGrid from '$lib/components/ToolGrid.svelte';
	import { EXPERIENCE } from '$lib/about';
	import { heroTools } from '$lib/brands';
	import { homeProjects } from '$lib/content';
	import { path, t, type Lang } from '$lib/i18n';
	import { CV } from '$lib/site';

	let { lang }: { lang: Lang } = $props();

	const strings = $derived(t(lang));
	const featured = $derived(homeProjects(lang));
	const tools = heroTools();
	const orgs = EXPERIENCE.filter((role) => role.mark);
	const cvHref = $derived(CV[lang] ?? CV.es);
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
		<p class="badge">
			<span class="pulse" aria-hidden="true"></span>
			{strings.home.badge}
		</p>

		<h1>{strings.home.headline}</h1>
		<p class="pitch">{strings.home.pitch}</p>

		<div class="actions">
			<a class="btn primary" href={path(lang, 'projects')}>{strings.home.ctaProjects}</a>
			<a class="btn" href={cvHref} download>{strings.home.ctaCv}</a>
		</div>

		<ul class="herostack" aria-label={strings.home.heroStackLabel}>
			{#each tools as tool (tool.slug)}
				<li title={tool.label}><BrandMark {tool} /></li>
			{/each}
		</ul>
	</div>
</Container>

<Container>
	<ProofStrip items={strings.home.proof} label={strings.home.proofLabel} />
</Container>

<Container>
	<div class="section">
		<p class="mono seclabel">{strings.home.orgsLabel}</p>
		<ul class="orgs">
			{#each orgs as role (role.org)}
				<li>
					<OrgMark org={role.mark!} />
					<span class="orgtext">
						<strong>{role.shortOrg ?? role.org}</strong>
						<span class="mono">{role.title[lang]} · {role.period[lang]}</span>
					</span>
				</li>
			{/each}
		</ul>
	</div>
</Container>

{#if featured.length}
	<Container>
		<div class="section">
			<p class="mono seclabel">{strings.home.workLabel}</p>
			<h2>{strings.home.workTitle}</h2>

			<ul class="grid">
				{#each featured as project (project.meta.slug)}
					<li><ProjectCard {project} {lang} /></li>
				{/each}
			</ul>

			<p class="more">
				<a href={path(lang, 'projects')}>{strings.home.workAll} →</a>
			</p>
		</div>
	</Container>
{/if}

<Container>
	<div class="section last">
		<p class="mono seclabel">{strings.home.stackLabel}</p>
		<h2>{strings.stack.title}</h2>
		<p class="seclede">{strings.stack.lead}</p>
		<ToolGrid {lang} />
	</div>
</Container>

<style>
	.hero {
		padding-block: clamp(3rem, 8vw, 5.5rem) clamp(2rem, 5vw, 3rem);
		max-width: 44rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 1.75rem;
		padding: 0.3rem 0.75rem 0.3rem 0.6rem;
		border: 1px solid var(--area-infra-line);
		border-radius: 999px;
		background: var(--area-infra-bg);
		color: var(--area-infra-fg);
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.pulse {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 999px;
		background: currentColor;
		box-shadow: 0 0 0 3px color-mix(in oklab, currentColor 22%, transparent);
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5.5vw, 3.5rem);
		line-height: 1.05;
		letter-spacing: -0.035em;
		font-weight: 600;
		text-wrap: pretty;
	}

	.pitch {
		margin: 1.5rem 0 0;
		font-size: 1.0625rem;
		line-height: 1.7;
		color: var(--ink-muted);
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
		min-height: 44px;
		padding: 0 1.15rem;
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

	.herostack {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.35rem;
		list-style: none;
		margin: 2.75rem 0 0;
		padding: 0;
		color: var(--ink-faint);
	}

	.herostack li {
		display: flex;
		transition: color 140ms ease;
	}

	.herostack li:hover {
		color: var(--ink);
	}

	.section {
		padding-top: clamp(2.5rem, 6vw, 4rem);
	}

	.section.last {
		padding-bottom: clamp(3rem, 7vw, 5rem);
	}

	.seclabel {
		margin: 0 0 1.25rem;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-faint);
	}

	h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.seclede {
		margin: 0.4rem 0 1.75rem;
		color: var(--ink-muted);
		font-size: 0.9375rem;
	}

	.orgs {
		display: grid;
		gap: 1px;
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--line);
		overflow: hidden;
	}

	.orgs li {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.1rem 1.35rem;
		background: var(--surface);
	}

	.orgs li :global(.mark) {
		width: 9.375rem;
		flex: none;
	}

	.orgs li:hover :global(.mark) {
		color: var(--ink);
	}

	.orgtext {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.orgtext strong {
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.orgtext .mono {
		font-size: 0.75rem;
		color: var(--ink-faint);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
		gap: 1rem;
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 0;
	}

	.more {
		margin: 1.25rem 0 0;
		font-size: 0.9375rem;
	}

	.more a {
		color: var(--ink-muted);
		text-decoration: none;
	}

	.more a:hover {
		color: var(--ink);
	}

	@media (max-width: 40rem) {
		.orgs li {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.6rem;
		}

		.orgs li :global(.mark) {
			width: 8rem;
		}
	}
</style>
