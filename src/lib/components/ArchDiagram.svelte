<script lang="ts">
	/**
	 * Wrapper for the inline SVG that carries a project's architecture. Private
	 * projects have no screenshots, so this is the only thing that shows shape —
	 * it must stay legible in both themes and scroll instead of squashing.
	 */
	let { caption, children }: { caption?: string; children: import('svelte').Snippet } = $props();
</script>

<figure class="diagram">
	<div class="canvas">
		{@render children()}
	</div>
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	.diagram {
		margin: 2rem 0;
	}

	.canvas {
		overflow-x: auto;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-sunken);
	}

	/* Diagrams inherit theme colours instead of hard-coding them. */
	.canvas :global(svg) {
		display: block;
		min-width: 28rem;
		max-width: 100%;
		height: auto;
		color: var(--ink-muted);
	}

	.canvas :global(svg text) {
		fill: var(--ink);
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.canvas :global(svg [data-role='box']) {
		fill: var(--surface);
		stroke: var(--line-strong);
	}

	.canvas :global(svg [data-role='flow']) {
		stroke: var(--ink-faint);
		fill: none;
	}

	figcaption {
		margin-top: 0.6rem;
		font-size: 0.8125rem;
		color: var(--ink-faint);
		line-height: 1.5;
	}
</style>
