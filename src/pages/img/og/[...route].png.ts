import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard } from '../../../lib/og/card';
import { OG_CARD } from '../../../lib/og/paths';
import { cardSpecs, type CardSpec } from '../../../lib/og/specs';

/**
 * The list that produces these routes is the same list `ogCardPath` builds the
 * meta-tag URLs from, so a card cannot go missing or stale: there is no second
 * list to fall out of step with.
 */
export const getStaticPaths: GetStaticPaths = async () =>
	(await cardSpecs()).map((spec) => ({ params: { route: spec.route }, props: { spec } }));

export const GET: APIRoute = ({ props }) =>
	new Response(new Uint8Array(renderCard((props as { spec: CardSpec }).spec)), {
		headers: { 'content-type': OG_CARD.type }
	});
