import { isDormant, nearby, parseLatLon } from '../../lib/geo';
import { forPlace } from '../../lib/placeCameras';
import { getCatalog } from '../../lib/server/catalog';
import type { PageServerLoad } from './$types';

const RADIUS = 60;
const LIMIT = 15;

/** The places we cover that are closest to where you are. */
export const load: PageServerLoad = ({ url }) => {
	const point = parseLatLon(url.searchParams.get('ll') ?? '');
	if (!point) return { point: null, results: [] as never[] };
	const { places, cameras, collections } = getCatalog();
	const label = (id: string | undefined) => collections.find((c) => c.id === id)?.name ?? null;
	const results = nearby(places, point, RADIUS)
		.slice(0, LIMIT)
		.map((p) => ({
			id: p.id,
			name: p.name,
			kind: label(p.collection),
			distance: p.distance,
			liveCameras: nearby(forPlace(cameras, p), p, p.radius_miles ?? 10).filter(
				(c) => !isDormant(c) && (c.feed_url || c.provider)
			).length
		}));
	return { point, results };
};
