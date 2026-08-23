<script lang="ts">
	import type { Tool } from '$lib/brands';

	/**
	 * A tool's brand mark in ink. Tools simple-icons has no mark for (Playwright,
	 * for one — withdrawn over trademark) get a monogram tile at the same weight
	 * rather than an invented logo.
	 */
	let { tool, size = 22 }: { tool: Tool; size?: number } = $props();
</script>

{#if tool.d}
	<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
		<path fill="currentColor" d={tool.d} />
	</svg>
{:else}
	<span class="monogram" style="--size: {size}px" aria-hidden="true">{tool.monogram}</span>
{/if}

<style>
	svg {
		display: block;
	}

	.monogram {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size);
		height: var(--size);
		border: 1px solid currentColor;
		border-radius: 4px;
		font-family: var(--font-mono);
		font-size: calc(var(--size) * 0.4);
		line-height: 1;
		letter-spacing: 0.02em;
	}
</style>
