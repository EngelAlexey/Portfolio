<script lang="ts">
	import BrandMark from './BrandMark.svelte';
	import { toolFor } from '$lib/stack';

	let { stack, label }: { stack: string[]; label?: string } = $props();

	const items = $derived(stack.map((entry) => toolFor(entry)));
</script>

<ul class="stack" aria-label={label}>
	{#each items as tool (tool.label)}
		<li>
			<span class="mark"><BrandMark {tool} size={18} /></span>
			{tool.label}
		</li>
	{/each}
</ul>

<style>
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper-sunken);
		color: var(--ink-muted);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.mark {
		display: flex;
		color: var(--ink-faint);
	}
</style>
