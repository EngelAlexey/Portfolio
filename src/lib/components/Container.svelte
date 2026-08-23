<script lang="ts">
	let {
		children,
		size = 'wide',
		as = 'section'
	}: {
		children: import('svelte').Snippet;
		size?: 'wide' | 'text';
		as?: 'section' | 'div' | 'article' | 'header';
	} = $props();
</script>

<svelte:element this={as} class="container {size}">
	{@render children()}
</svelte:element>

<style>
	.container {
		width: 100%;
		margin-inline: auto;
		padding-inline: clamp(1rem, 4vw, 2.5rem);
	}

	.wide {
		max-width: 74rem;
	}

	.text {
		max-width: 48rem;
	}
</style>
