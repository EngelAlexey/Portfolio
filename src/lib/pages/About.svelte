<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import Container from '$lib/components/Container.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import { CERTIFICATIONS, EDUCATION, EXPERIENCE, LANGUAGES, SKILL_GROUPS } from '$lib/about';
	import { t, type Lang } from '$lib/i18n';

	let { lang }: { lang: Lang } = $props();

	const strings = $derived(t(lang));
	const toItems = (roles: typeof EXPERIENCE) =>
		roles.map((role) => ({
			period: role.period[lang],
			title: role.title[lang],
			org: role.org,
			detail: role.detail[lang] || undefined
		}));
</script>

<Seo
	{lang}
	key="about"
	title={strings.meta.titleTemplate(strings.about.title)}
	description={strings.about.lead}
/>

<Container as="header" size="text">
	<div class="head">
		<Avatar alt={strings.about.photoAlt} size={112} />
		<div>
			<h1>{strings.about.title}</h1>
			<p>{strings.about.lead}</p>
		</div>
	</div>
</Container>

<Container size="text">
	<section>
		<h2>{strings.about.experience}</h2>
		<Timeline items={toItems(EXPERIENCE)} label={strings.about.experience} />
	</section>

	<section>
		<h2>{strings.about.education}</h2>
		<Timeline items={toItems(EDUCATION)} label={strings.about.education} />
	</section>

	<section>
		<h2>{strings.about.skills}</h2>
		<dl class="skills">
			{#each SKILL_GROUPS as group (group.label.es)}
				<div>
					<dt>{group.label[lang]}</dt>
					<dd>{group.items.join(' · ')}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<div class="split">
		<section>
			<h2>{strings.about.certifications}</h2>
			<ul class="plain">
				{#each CERTIFICATIONS as cert (cert.name)}
					<li><strong>{cert.name}</strong> — {cert.issuer}</li>
				{/each}
			</ul>
		</section>

		<section>
			<h2>{strings.about.languages}</h2>
			<ul class="plain">
				{#each LANGUAGES as language (language.label.es)}
					<li><strong>{language.label[lang]}</strong> — {language.level[lang]}</li>
				{/each}
			</ul>
		</section>
	</div>
</Container>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.5rem;
		padding-block: clamp(2.5rem, 7vw, 4rem) 1rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 2.75rem);
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	.head p {
		margin: 0.5rem 0 0;
		color: var(--ink-muted);
		font-size: 1.0625rem;
	}

	section {
		padding-block: clamp(1.75rem, 4vw, 2.5rem);
		border-top: 1px solid var(--line);
	}

	section:last-child {
		padding-bottom: clamp(3rem, 7vw, 5rem);
	}

	h2 {
		margin: 0 0 1.25rem;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-faint);
	}

	.skills {
		display: grid;
		gap: 0.9rem;
		margin: 0;
	}

	.skills dt {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.skills dd {
		margin: 0.15rem 0 0;
		color: var(--ink-muted);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.plain {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
		color: var(--ink-muted);
		font-size: 0.9375rem;
	}

	.plain strong {
		color: var(--ink);
		font-weight: 600;
	}

	.split {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
		gap: 0 2rem;
	}

	.split section {
		padding-bottom: clamp(2rem, 5vw, 3rem);
	}
</style>
