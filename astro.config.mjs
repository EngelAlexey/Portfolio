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
		build: { assetsInlineLimit: 0 }
	}
});
