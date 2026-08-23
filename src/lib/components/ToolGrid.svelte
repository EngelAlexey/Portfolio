<script lang="ts">
	import BrandMark from './BrandMark.svelte';
	import { AREA_IDS, areaLabel, areaStyle, type AreaId } from '$lib/areas';
	import { TOOLS, toolsByArea } from '$lib/brands';
	import { t, type Lang } from '$lib/i18n';

	let { lang }: { lang: Lang } = $props();

	const strings = $derived(t(lang));
	const counts = toolsByArea();

	let filter = $state<AreaId | 'all'>('all');

	const shown = $derived(filter === 'all' ? TOOLS.length : counts[filter]);
</script>

<div class="chips">
	<button
		type="button"
		class="chip chip-all"
		aria-pressed={filter === 'all'}
		onclick={() => (filter = 'all')}
	>
		{strings.projects.filterAll}<span class="mono n">{TOOLS.length}</span>
	</button>

	{#each AREA_IDS as area (area)}
		<button
			type="button"
			class="chip"
			style={areaStyle(area)}
			aria-pressed={filter === area}
			onclick={() => (filter = area)}
		>
			<span class="dot" aria-hidden="true"></span>
			{areaLabel(area, lang)}<span class="mono n">{counts[area]}</span>
		</button>
	{/each}
</div>

<p class="count mono" aria-live="polite">{strings.stack.showing(shown, TOOLS.length)}</p>

<!-- Filtering moves one attribute; the tiles never re-render, so the marks
     paint once and stay put. -->
<ul class="grid" data-filter={filter}>
	{#each TOOLS as tool (tool.slug)}
		<li class="tile" data-area={tool.area} title={tool.label}>
			<BrandMark {tool} />
			<span class="label">{tool.label}</span>
		</li>
	{/each}
</ul>

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
		color: var(--ink-muted);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			background-color 120ms ease,
			color 120ms ease;
	}

	.chip:hover {
		border-color: var(--line-strong);
		color: var(--ink);
	}

	.chip[aria-pressed='true'] {
		border-color: var(--chip-line);
		background: var(--chip-bg);
		color: var(--chip-fg);
	}

	.chip-all[aria-pressed='true'] {
		border-color: var(--ink);
		background: var(--ink);
		color: var(--ink-inverted);
	}

	.dot {
		width: 0.4em;
		height: 0.4em;
		border-radius: 999px;
		background: currentColor;
		flex: none;
	}

	.n {
		font-size: 0.6875rem;
		opacity: 0.65;
	}

	.count {
		margin: 0.9rem 0 1.25rem;
		font-size: 0.75rem;
		color: var(--ink-faint);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 1px;
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--line);
		overflow: hidden;
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		padding: 1.35rem 0.5rem;
		background: var(--surface);
		color: var(--ink-faint);
		transition:
			color 140ms ease,
			background-color 140ms ease;
	}

	.tile:hover {
		color: var(--ink);
		background: var(--paper-sunken);
	}

	.label {
		font-size: 0.75rem;
		color: var(--ink-muted);
		text-align: center;
		line-height: 1.3;
	}

	.grid[data-filter='fullstack'] .tile:not([data-area='fullstack']),
	.grid[data-filter='ia'] .tile:not([data-area='ia']),
	.grid[data-filter='datos'] .tile:not([data-area='datos']),
	.grid[data-filter='movil'] .tile:not([data-area='movil']),
	.grid[data-filter='seguridad'] .tile:not([data-area='seguridad']),
	.grid[data-filter='infra'] .tile:not([data-area='infra']) {
		display: none;
	}

	@media (max-width: 60rem) {
		.grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (max-width: 34rem) {
		/* Sideways beats four ragged rows of chips on a phone. */
		.chips {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-bottom: 0.6rem;
			scrollbar-width: none;
		}

		.chip {
			flex: none;
			min-height: 36px;
		}

		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.tile {
			min-height: 76px;
			padding: 0.75rem 0.35rem;
			gap: 0.4rem;
		}

		.label {
			font-size: 0.625rem;
		}
	}
</style>
