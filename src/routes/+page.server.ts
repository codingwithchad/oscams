import { isDormant, nearby } from '../lib/geo';
import { getCatalog } from '../lib/server/catalog';
import type { PageServerLoad } from './$types';

const DEFAULT_RADIUS = 25;

export const load: PageServerLoad = () => {
	const { places, cameras } = getCatalog();
	return {
		places: places.map((p) => ({
			id: p.id,
			name: p.name,
			region: p.region,
			blurb: p.blurb,
			liveCameras: nearby(cameras, p, p.radius_miles ?? DEFAULT_RADIUS).filter(
				(c) => !isDormant(c) && c.feed_url
			).length
		}))
	};
};
