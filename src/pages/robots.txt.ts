import type { APIRoute } from 'astro';
import { absolute } from '../lib/site';

export const GET: APIRoute = () => {
	const body = `User-agent: *
Allow: /

Sitemap: ${absolute('/sitemap.xml')}
`;

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};
