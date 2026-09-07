import { BRANDS, TOOLS, type Tool } from './brands';
import type { AreaId } from './areas';

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
	'next.js': 'nextdotjs',
	'next.js 16': 'nextdotjs',
	'react 19': 'react',
	'node.js': 'nodedotjs',
	nodejs: 'nodedotjs',
	'tailwind css': 'tailwindcss',
	'vercel ai sdk': 'vercel',
	'upstash vector': 'upstash',
	'drizzle orm': 'drizzle',
	'github actions': 'githubactions',
	java: 'openjdk',
	claude: 'anthropic',
	gemini: 'googlegemini',
	'cisco packet tracer': 'cisco',
	'cloudflare turnstile': 'cloudflare',
	'cohere rerank': 'cohere',
	'sql server': 'sqlserver',
	'power bi': 'powerbi',
	'auth.js': 'authjs',
	'amazon web services': 'aws'
};

const LETTERED: Record<string, string> = {
	aws: 'AWS',
	azure: 'AZ',
	authjs: 'AJ',
	cohere: 'CO',
	powerbi: 'BI',
	sqlserver: 'SQL'
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

function fromBrand(slug: string, label: string): Tool {
	return {
		slug,
		label,
		area: areaBySlug.get(slug) ?? 'fullstack',
		monogram: monogramFor(label),
		d: BRANDS[slug]
	};
}

export type StackItem = Tool & { lettered: boolean };

export function toolFor(label: string): StackItem {
	const key = label.toLowerCase().trim();
	const slug = ALIASES[key] ?? key.replace(/[^a-z0-9]+/g, '');

	if (BRANDS[slug]) return { ...fromBrand(slug, label), lettered: false };

	const letters = LETTERED[slug];
	return {
		slug: key.replace(/[^a-z0-9]+/g, '-'),
		label,
		area: areaBySlug.get(slug) ?? 'fullstack',
		monogram: letters ?? monogramFor(label),
		d: null,
		lettered: Boolean(letters)
	};
}
