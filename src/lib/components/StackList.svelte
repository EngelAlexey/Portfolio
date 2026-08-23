<script lang="ts">
	let { stack, label }: { stack: string[]; label?: string } = $props();
</script>

<ul class="stack" aria-label={label}>
	{#each stack as item (item)}
		<li>{item}</li>
	{/each}
</ul>

<style>
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		line-height: 1.4;
		padding: 0.2em 0.5em;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--ink-muted);
		background: var(--paper-sunken);
	}
</style>
