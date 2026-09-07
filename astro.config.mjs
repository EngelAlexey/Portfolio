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
	integrations: [mdx()],
	vite: {
		plugins: [tailwindcss()],
		build: {
			// The 0 was here to stop fonts and images being inlined as base64, but it
			// also switched off stylesheet inlining, so 310-byte sheets shipped as
			// their own request. A function says only the first thing: false keeps
			// assets external, undefined lets CSS fall back to the 4 KB default.
			assetsInlineLimit: (/** @type {string} */ file) =>
				/\.(woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico|pdf)$/i.test(file) ? false : undefined
		}
	}
});
