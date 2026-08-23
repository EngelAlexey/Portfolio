import { BRANDS, TOOLS, type Tool } from './brands';
import type { AreaId } from './areas';

/**
 * Front matter lists stack items as free text, so this maps those strings onto
 * the brand library. A stack can name a product the curated grid does not (a
 * reranker, an ORM), so resolution goes through the full `BRANDS` library, not
 * just the 33 grid tools. Aliases cover the cases where the write-up names a
 * product more precisely than the icon set does.
 */
const ALIASES: Record<string, string> = {
	// Google Cloud family
	'google cloud run': 'googlecloud',
	'cloud run': 'googlecloud',
	'cloud sql': 'googlecloud',
	'google cloud platform': 'googlecloud',
	gcp: 'googlecloud',
	// React / Next / Node spellings
	'react native': 'react',
	'react native (expo)': 'expo',
	'expo sdk 56': 'expo',
	nextjs: 'nextdotjs',
	'next.js': 'nextdotjs',
	'next.js 16': 'nextdotjs',
	'react 19': 'react',
	'node.js': 'nodedotjs',
	nodejs: 'nodedotjs',
	'tailwind css': 'tailwindcss',
	// SvelteKit shares the Svelte mark
	sveltekit: 'svelte',
	// Products named more precisely than the mark
	'vercel ai sdk': 'vercel',
	'upstash vector': 'upstash',
	'cohere rerank': 'cohere',
	'drizzle orm': 'drizzle',
	'github actions': 'githubactions',
	java: 'openjdk',
	claude: 'anthropic',
	gemini: 'googlegemini',
	// Networking concepts share the Cisco mark when the CV names the tool
	'cisco packet tracer': 'cisco'
};

const areaBySlug = new Map<string, AreaId>(TOOLS.map((tool) => [tool.slug, tool.area]));

const monogramFor = (label: string): string =>
	label
		.replace(/[^A-Za-z ]/g, '')
		.split(' ')
		.filter(Boolean)
		.map((word) => word[0])
		.join('')
		.slice(0, 2)
		.toUpperCase() || '·';

/** Build a `Tool` for a slug that has a mark in the library. */
function fromBrand(slug: string, label: string): Tool {
	return {
		slug,
		label,
		area: areaBySlug.get(slug) ?? 'fullstack',
		monogram: monogramFor(label),
		d: BRANDS[slug]
	};
}

/** A `Tool` for any stack string; falls back to a monogram tile with no mark. */
export function toolFor(label: string): Tool {
	const key = label.toLowerCase().trim();

	// Direct slug match (e.g. the stack already says "typescript").
	const asSlug = key.replace(/[^a-z0-9]+/g, '');
	if (BRANDS[asSlug]) return fromBrand(asSlug, label);

	// Alias table for product names that differ from the icon slug.
	const aliased = ALIASES[key];
	if (aliased && BRANDS[aliased]) return fromBrand(aliased, label);

	return {
		slug: key.replace(/[^a-z0-9]+/g, '-'),
		label,
		area: 'fullstack',
		monogram: monogramFor(label),
		d: null
	};
}
