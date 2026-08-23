<script lang="ts">
	/**
	 * Falls back to a monogram until `static/img/alex.jpg` exists — dropping the
	 * file in is the only change needed.
	 */
	let {
		src = '/img/alex.jpg',
		alt,
		size = 128,
		hasPhoto = false
	}: { src?: string; alt: string; size?: number; hasPhoto?: boolean } = $props();
</script>

{#if hasPhoto}
	<img class="avatar" {src} {alt} width={size} height={size} loading="lazy" decoding="async" />
{:else}
	<span class="avatar monogram" style="--size: {size}px" role="img" aria-label={alt}>AH</span>
{/if}

<style>
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size, 128px);
		height: var(--size, 128px);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		object-fit: cover;
		background: var(--paper-sunken);
	}

	.monogram {
		font-family: var(--font-mono);
		font-size: calc(var(--size) * 0.3);
		letter-spacing: 0.02em;
		color: var(--ink-faint);
		user-select: none;
	}
</style>
