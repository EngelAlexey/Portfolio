import { TOOLS, type Tool } from './brands';

/**
 * Front matter lists stack items as free text, so this maps those strings onto
 * the brand marks. Aliases cover the cases where the write-up names a product
 * more precisely than the icon set does.
 */
const ALIASES: Record<string, string> = {
	'google cloud run': 'googlecloud',
	'cloud run': 'googlecloud',
	'cloud sql': 'googlecloud',
	'google cloud platform': 'googlecloud',
	gcp: 'googlecloud',
	'react native': 'react',
	'react native (expo)': 'expo',
	'expo sdk 56': 'expo',
	nextjs: 'nextdotjs',
	'next.js 16': 'nextdotjs',
	'node.js': 'nodedotjs',
	nodejs: 'nodedotjs',
	'react 19': 'react',
	'tailwind css': 'tailwindcss',
	java: 'openjdk',
	claude: 'anthropic',
	gemini: 'googlegemini',
	sveltekit: 'svelte',
	'github actions': 'githubactions'
};

const BY_LABEL = new Map(TOOLS.map((tool) => [tool.label.toLowerCase(), tool]));
const BY_SLUG = new Map(TOOLS.map((tool) => [tool.slug, tool]));

const monogramFor = (label: string): string =>
	label
		.replace(/[^A-Za-z ]/g, '')
		.split(' ')
		.filter(Boolean)
		.map((word) => word[0])
		.join('')
		.slice(0, 2)
		.toUpperCase() || '·';

/** A `Tool` for any stack string; falls back to a monogram tile with no mark. */
export function toolFor(label: string): Tool {
	const key = label.toLowerCase().trim();
	const direct = BY_LABEL.get(key);
	if (direct) return direct;

	const aliased = ALIASES[key];
	const viaAlias = aliased ? BY_SLUG.get(aliased) : undefined;
	if (viaAlias) return { ...viaAlias, label };

	return {
		slug: key.replace(/[^a-z0-9]+/g, '-'),
		label,
		area: 'fullstack',
		monogram: monogramFor(label),
		d: null
	};
}
