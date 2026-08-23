<script lang="ts">
	export type Layer = { name: string; body: string };

	/**
	 * A pipeline with one gate that enforces several layers at once. Private
	 * projects have no screenshots, so this is what carries the shape — and the
	 * layers are the argument, not decoration: clicking one says what it stops.
	 */
	let {
		nodes,
		gate,
		layers,
		caption
	}: { nodes: string[]; gate: number; layers: Layer[]; caption?: string } = $props();

	let active = $state(0);
</script>

<figure class="diagram">
	<div class="pipe" data-active={active}>
		{#each nodes as node, i (node)}
			{#if i > 0}<span class="arrow" aria-hidden="true"></span>{/if}
			<span class="node" class:gate={i === gate}>
				{node}
				{#if i === gate}
					<span class="bars" aria-hidden="true">
						{#each layers as layer, j (layer.name)}
							<i data-layer={j}></i>
						{/each}
					</span>
				{/if}
			</span>
		{/each}
	</div>

	<div class="layers">
		{#each layers as layer, i (layer.name)}
			<button
				type="button"
				class="layer"
				aria-pressed={active === i}
				onclick={() => (active = i)}
			>
				<span class="mono n">0{i + 1}</span>
				<span class="name">{layer.name}</span>
			</button>
		{/each}
	</div>

	<p class="body">{layers[active].body}</p>

	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	.diagram {
		margin: 2rem 0;
	}

	.pipe {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 1.5rem 1.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-sunken);
	}

	.node {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.8rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--ink-muted);
	}

	.node.gate {
		border-color: var(--area-seguridad-line);
		background: var(--area-seguridad-bg);
		color: var(--area-seguridad-fg);
		font-weight: 500;
	}

	.arrow {
		flex: 1 1 12px;
		min-width: 12px;
		height: 1px;
		background: var(--line-strong);
	}

	.bars {
		display: flex;
		gap: 3px;
	}

	.bars i {
		display: block;
		width: 22px;
		height: 4px;
		border-radius: 2px;
		background: currentColor;
		opacity: 0.28;
		transition:
			opacity 160ms ease,
			transform 160ms ease;
	}

	.pipe[data-active='0'] .bars i[data-layer='0'],
	.pipe[data-active='1'] .bars i[data-layer='1'],
	.pipe[data-active='2'] .bars i[data-layer='2'],
	.pipe[data-active='3'] .bars i[data-layer='3'] {
		opacity: 1;
		transform: scaleY(1.6);
	}

	.layers {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(11rem, 100%), 1fr));
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.layer {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
		padding: 0.8rem 0.95rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink-muted);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			background-color 120ms ease,
			color 120ms ease;
	}

	.layer:hover {
		border-color: var(--line-strong);
		color: var(--ink);
	}

	.layer[aria-pressed='true'] {
		border-color: var(--area-seguridad-line);
		background: var(--area-seguridad-bg);
		color: var(--area-seguridad-fg);
	}

	.n {
		font-size: 0.6875rem;
		opacity: 0.7;
	}

	.name {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.body {
		margin: 0.9rem 0 0;
		padding: 0.9rem 1.1rem;
		border-left: 2px solid var(--area-seguridad-line);
		font-size: 0.9375rem;
		line-height: 1.65;
		color: var(--ink-muted);
	}

	figcaption {
		margin-top: 0.75rem;
		font-size: 0.8125rem;
		color: var(--ink-faint);
	}
</style>
