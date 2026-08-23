<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { t, type Lang } from '$lib/i18n';
	import { CV, PERSON } from '$lib/site';

	let { lang }: { lang: Lang } = $props();

	const strings = $derived(t(lang));
	const cvHref = $derived(CV[lang] ?? CV.es);
	const cvNeedsNote = $derived(CV[lang] === null);
</script>

<Seo
	{lang}
	key="contact"
	title={strings.meta.titleTemplate(strings.contact.title)}
	description={strings.contact.lead}
/>

<Container as="header" size="text">
	<div class="head">
		<h1>{strings.contact.title}</h1>
		<p>{strings.contact.lead}</p>
	</div>
</Container>

<Container size="text">
	<ul class="channels">
		<li>
			<span class="label">{strings.contact.email}</span>
			<a class="value" href="mailto:{PERSON.email}">{PERSON.email}</a>
		</li>
		<li>
			<span class="label">{strings.contact.linkedin}</span>
			<a class="value" href={PERSON.linkedin} rel="noreferrer" target="_blank">
				alex-herrera-manzanares ↗
			</a>
		</li>
		<li>
			<span class="label">{strings.contact.github}</span>
			<a class="value" href={PERSON.github} rel="noreferrer" target="_blank">EngelAlexey ↗</a>
		</li>
		<li>
			<span class="label">{strings.contact.location}</span>
			<span class="value plain">{PERSON.location[lang]}</span>
		</li>
		<li>
			<span class="label">{strings.contact.availability}</span>
			<span class="value plain">{PERSON.availability[lang]}</span>
		</li>
	</ul>

	<div class="cv">
		<a class="btn" href={cvHref} download>{strings.contact.cv}</a>
		<p class="note">
			{cvNeedsNote ? strings.contact.cvOnlySpanish : strings.contact.cvNote}
		</p>
	</div>
</Container>

<style>
	.head {
		padding-block: clamp(2.5rem, 7vw, 4rem) 1.5rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 2.75rem);
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	.head p {
		margin: 0.6rem 0 0;
		color: var(--ink-muted);
		font-size: 1.0625rem;
		line-height: 1.6;
	}

	.channels {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}

	.channels li {
		display: grid;
		grid-template-columns: minmax(7rem, max-content) 1fr;
		gap: 1rem;
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--line);
		align-items: baseline;
	}

	.label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-faint);
	}

	.value {
		font-size: 0.9375rem;
		color: var(--ink);
		text-decoration: none;
		border-bottom: 1px solid var(--line-strong);
		justify-self: start;
	}

	.value:hover {
		border-bottom-color: var(--ink);
	}

	.value.plain {
		border-bottom: 0;
		color: var(--ink-muted);
	}

	.cv {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
		margin: 2rem 0 clamp(3rem, 7vw, 5rem);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.1rem;
		border: 1px solid var(--action);
		border-radius: var(--radius-sm);
		background: var(--action);
		color: var(--action-ink);
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.btn:hover {
		background: var(--action-hover);
		border-color: var(--action-hover);
	}

	.note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--ink-faint);
	}

	@media (max-width: 30rem) {
		.channels li {
			grid-template-columns: 1fr;
			gap: 0.2rem;
		}
	}
</style>
