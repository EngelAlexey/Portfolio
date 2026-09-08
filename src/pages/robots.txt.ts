import type { APIRoute } from 'astro';
import { absolute } from '../lib/site';

// El comodin ya los permitiria a todos. Nombrarlos es la unica forma de que la
// intencion quede escrita: estos rastreadores son los que alimentan respuestas
// de IA, y varios se consultan uno por uno antes de indexar.
const AI_AGENTS = [
	'GPTBot',
	'OAI-SearchBot',
	'ChatGPT-User',
	'ClaudeBot',
	'Claude-User',
	'Claude-SearchBot',
	'PerplexityBot',
	'Perplexity-User',
	'Google-Extended',
	'Applebot-Extended',
	'meta-externalagent',
	'CCBot'
];

export const GET: APIRoute = () => {
	const ai = AI_AGENTS.map((agent) => `User-agent: ${agent}`).join('\n');

	const body = `User-agent: *
Allow: /

${ai}
Allow: /

Sitemap: ${absolute('/sitemap.xml')}
`;

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
