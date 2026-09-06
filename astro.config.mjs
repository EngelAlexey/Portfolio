// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

/**
 * Every canonical, hreflang, Open Graph and sitemap URL is built from this.
 * Set `PUBLIC_SITE_URL` in Vercel when the custom domain lands — no code change.
 */
const SITE_URL = (process.env.PUBLIC_SITE_URL ?? 'https://alexherrera.vercel.app').replace(
	/\/+$/,
	''
);

export default defineConfig({
	site: SITE_URL,
	output: 'static',
	outDir: './dist',
	trailingSlash: 'never',
	// Both languages carry their own prefix, so the root is not a page: it sends
	// visitors to the primary audience. Static output turns this into a real
	// redirect page, so no server configuration is involved.
	redirects: {
		'/': '/es'
	},
	build: {
		// `/es/contacto`, not `/es/contacto/`.
		format: 'file'
	},
	// MDX only, and only so a write-up can place its architecture diagram at the
	// right point in the narrative. It adds no client runtime, and there is no UI
	// framework integration: the interactive pieces are a few kilobytes of the
	// site's own script, most of them moving an attribute that CSS then resolves.
	integrations: [mdx()],
	vite: {
		plugins: [tailwindcss()]
	}
});
