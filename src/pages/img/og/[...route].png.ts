import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard } from '../../../lib/og/card';
import { OG_CARD } from '../../../lib/og/paths';
import { cardSpecs, type CardSpec } from '../../../lib/og/specs';

export const getStaticPaths: GetStaticPaths = async () =>
	(await cardSpecs()).map((spec) => ({ params: { route: spec.route }, props: { spec } }));

export const GET: APIRoute = ({ props }) =>
	new Response(new Uint8Array(renderCard((props as { spec: CardSpec }).spec)), {
		headers: { 'content-type': OG_CARD.type }
	});
