<script lang="ts">
	import '@fontsource-variable/geist';
	import '@fontsource-variable/jetbrains-mono';
	import '../app.css';

	import { page } from '$app/state';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import LangSwitch from '$lib/components/LangSwitch.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { langFromPathname, path, routeFromPathname, t } from '$lib/i18n';
	import { PERSON } from '$lib/site';

	let { children } = $props();

	const lang = $derived(langFromPathname(page.url.pathname));
	const current = $derived(routeFromPathname(page.url.pathname).key);
	const strings = $derived(t(lang));

	const links = $derived([
		{ key: 'home', href: path(lang, 'home'), label: strings.nav.home },
		{ key: 'projects', href: path(lang, 'projects'), label: strings.nav.projects },
		{ key: 'about', href: path(lang, 'about'), label: strings.nav.about },
		{ key: 'contact', href: path(lang, 'contact'), label: strings.nav.contact }
	] as const);

	injectAnalytics();
	injectSpeedInsights();
</script>

<a class="skip" href="#main">{strings.a11y.skipToContent}</a>

<div class="shell">
	<header class="header">
		<a class="brand" href={path(lang, 'home')}>
			<span class="brand-name">Alex Herrera</span>
			<span class="brand-role">{strings.home.role}</span>
		</a>

		<div class="controls">
			<nav aria-label={strings.nav.menu}>
				<ul>
					{#each links as link (link.key)}
						<li>
							<a
								href={link.href}
								aria-current={current === link.key ||
								(link.key === 'projects' && current === 'project')
									? 'page'
									: undefined}
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="tools">
				<LangSwitch {lang} />
				<ThemeToggle {lang} />
			</div>
		</div>
	</header>

	<main id="main" aria-label={strings.a11y.mainLandmark}>
		{@render children()}
	</main>

	<footer class="footer">
		<p>© {new Date().getFullYear()} {PERSON.name}</p>
		<p class="built">{strings.footer.builtWith}</p>
	</footer>
</div>

<style>
	.skip {
		position: absolute;
		left: 0.5rem;
		top: -3rem;
		z-index: 50;
		padding: 0.5rem 0.9rem;
		border-radius: var(--radius-sm);
		background: var(--ink);
		color: var(--ink-inverted);
		font-size: 0.875rem;
		text-decoration: none;
		transition: top 120ms ease;
	}

	.skip:focus {
		top: 0.5rem;
	}

	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	.header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
		padding: 0.85rem clamp(1rem, 4vw, 2.5rem);
		border-bottom: 1px solid var(--line);
		background: color-mix(in oklab, var(--paper) 88%, transparent);
		backdrop-filter: blur(10px);
	}

	.brand {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		line-height: 1.2;
	}

	.brand-name {
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.brand-role {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--ink-faint);
		letter-spacing: 0.02em;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	nav ul {
		display: flex;
		align-items: center;
		gap: 1rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	nav a {
		font-size: 0.9375rem;
		color: var(--ink-muted);
		text-decoration: none;
		padding-block: 0.25rem;
		border-bottom: 1.5px solid transparent;
		transition: color 120ms ease;
	}

	nav a:hover {
		color: var(--ink);
	}

	nav a[aria-current='page'] {
		color: var(--ink);
		border-bottom-color: var(--ink);
	}

	.tools {
		display: flex;
		gap: 0.5rem;
	}

	main {
		flex: 1;
	}

	.footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		justify-content: space-between;
		padding: 2rem clamp(1rem, 4vw, 2.5rem);
		border-top: 1px solid var(--line);
		color: var(--ink-faint);
		font-size: 0.8125rem;
	}

	.footer p {
		margin: 0;
	}

	@media (max-width: 46rem) {
		.header {
			gap: 0.6rem;
		}

		.controls {
			width: 100%;
			justify-content: space-between;
			gap: 0.75rem;
		}

		nav ul {
			gap: 0.9rem;
		}

		nav a {
			font-size: 0.875rem;
		}

		.built {
			flex-basis: 100%;
		}
	}
</style>
