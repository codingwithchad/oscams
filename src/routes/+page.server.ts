import { isDormant, nearby } from '../lib/geo';
import { getCatalog } from '../lib/server/catalog';
import type { PageServerLoad } from './$types';

const DEFAULT_RADIUS = 25;

export const load: PageServerLoad = () => {
	const { places, cameras } = getCatalog();
	return {
		places: places.map((p) => {
			const live = nearby(cameras, p, p.radius_miles ?? DEFAULT_RADIUS).filter(
				(c) => !isDormant(c) && c.feed_url && c.feed_type === 'image'
			);
			return {
				id: p.id,
				name: p.name,
				region: p.region,
				blurb: p.blurb,
				liveCameras: live.length,
				// The nearest live picture becomes the place's cover photo.
				cover: live[0] ? { url: live[0].feed_url as string, name: live[0].name } : null
			};
		})
	};
};
