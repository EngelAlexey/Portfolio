// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { siteUrl } from './site-url.mjs';

export default defineConfig({
	site: siteUrl(),
	output: 'static',
	outDir: './dist',
	trailingSlash: 'never',
	redirects: {
		'/': '/es'
	},
	build: {
		format: 'file'
	},
	markdown: {
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
			defaultColor: false,
			wrap: false
		}
	},
	integrations: [mdx()],
	vite: {
		plugins: [tailwindcss()],
		build: {
			assetsInlineLimit: (/** @type {string} */ file) =>
				/\.(woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico|pdf)$/i.test(file) ? false : undefined
		}
	}
});
