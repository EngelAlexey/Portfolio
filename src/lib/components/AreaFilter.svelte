<script lang="ts">
	import { AREA_IDS, areaLabel, areaStyle, type AreaId } from '$lib/areas';
	import { t, type Lang } from '$lib/i18n';

	let {
		lang,
		counts,
		selected = $bindable<AreaId[]>([])
	}: { lang: Lang; counts: Record<AreaId, number>; selected?: AreaId[] } = $props();

	const strings = $derived(t(lang).projects);

	function toggle(area: AreaId) {
		selected = selected.includes(area)
			? selected.filter((id) => id !== area)
			: [...selected, area];
	}
</script>

<fieldset class="filter">
	<legend class="sr-only">{strings.filterLegend}</legend>

	<button
		type="button"
		class="pill all"
		aria-pressed={selected.length === 0}
		onclick={() => (selected = [])}
	>
		{strings.filterAll}
	</button>

	{#each AREA_IDS as area (area)}
		<button
			type="button"
			class="pill"
			style={areaStyle(area)}
			aria-pressed={selected.includes(area)}
			onclick={() => toggle(area)}
		>
			<span class="dot" aria-hidden="true"></span>
			{areaLabel(area, lang)}
			<span class="count">{counts[area]}</span>
		</button>
	{/each}
</fieldset>

<style>
	.filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		border: 0;
		margin: 0;
		padding: 0;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
		color: var(--ink-muted);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			background-color 120ms ease,
			color 120ms ease;
	}

	.pill:hover {
		border-color: var(--line-strong);
		color: var(--ink);
	}

	.pill[aria-pressed='true'] {
		border-color: var(--chip-line, var(--ink));
		background: var(--chip-bg, var(--ink));
		color: var(--chip-fg, var(--ink-inverted));
	}

	.all[aria-pressed='true'] {
		border-color: var(--ink);
		background: var(--ink);
		color: var(--ink-inverted);
	}

	.dot {
		width: 0.45em;
		height: 0.45em;
		border-radius: 999px;
		background: var(--chip-fg);
		flex: none;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		opacity: 0.7;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
