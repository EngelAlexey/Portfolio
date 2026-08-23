<script lang="ts">
	import { personJsonLd, seo, type SeoInput } from '$lib/seo';
	import { t } from '$lib/i18n';

	let {
		lang,
		key,
		slug,
		title,
		description,
		image = null,
		person = false
	}: SeoInput & { person?: boolean } = $props();

	const tags = $derived(seo({ lang, key, slug, title, description, image }));
	const siteName = $derived(t(lang).meta.siteName);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={tags.canonical} />

	{#each tags.alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}

	<meta property="og:type" content={key === 'project' ? 'article' : 'website'} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content={tags.ogLocale} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={tags.canonical} />
	{#if tags.ogImage}
		<meta property="og:image" content={tags.ogImage} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}

	{#if person}
		{@html `<script type="application/ld+json">${personJsonLd(lang)}<\/script>`}
	{/if}
</svelte:head>
