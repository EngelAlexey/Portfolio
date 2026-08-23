<script lang="ts">
	export type Proof = { value: string; label: string };

	let { items, label }: { items: Proof[]; label?: string } = $props();
</script>

<ul class="proof" aria-label={label}>
	{#each items as item (item.label)}
		<li>
			<strong class="mono">{item.value}</strong>
			<span>{item.label}</span>
		</li>
	{/each}
</ul>

<style>
	.proof {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1px;
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--line);
		overflow: hidden;
	}

	li {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 1.1rem 1.35rem;
		background: var(--surface);
	}

	strong {
		font-size: 1.75rem;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	span {
		font-size: 0.8125rem;
		color: var(--ink-muted);
	}

	@media (max-width: 48rem) {
		.proof {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		li {
			padding: 0.85rem 1rem;
		}

		strong {
			font-size: 1.375rem;
		}

		span {
			font-size: 0.75rem;
		}
	}
</style>
