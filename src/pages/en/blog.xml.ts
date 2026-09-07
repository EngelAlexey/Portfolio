import type { APIRoute } from 'astro';
import { feed } from '../../lib/feed';

export const GET: APIRoute = async () =>
	new Response(await feed('en'), {
		headers: { 'content-type': 'application/rss+xml; charset=utf-8' }
	});
