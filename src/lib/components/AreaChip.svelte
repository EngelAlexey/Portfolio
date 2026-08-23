<script lang="ts">
	import { areaLabel, areaStyle, type AreaId } from '$lib/areas';
	import type { Lang } from '$lib/i18n';

	let {
		area,
		lang,
		size = 'md'
	}: { area: AreaId; lang: Lang; size?: 'sm' | 'md' } = $props();
</script>

<span class="chip" class:sm={size === 'sm'} style={areaStyle(area)}>
	<span class="dot" aria-hidden="true"></span>
	{areaLabel(area, lang)}
</span>

<style>
	/* The dot carries the hue, the text carries the meaning — the chip never
	   relies on colour alone. */
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.25em 0.6em;
		border: 1px solid var(--chip-line);
		border-radius: 999px;
		background: var(--chip-bg);
		color: var(--chip-fg);
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1.35;
		white-space: nowrap;
	}

	.chip.sm {
		font-size: 0.75rem;
		padding: 0.15em 0.5em;
	}

	.dot {
		width: 0.4em;
		height: 0.4em;
		border-radius: 999px;
		background: currentColor;
		flex: none;
	}
</style>
