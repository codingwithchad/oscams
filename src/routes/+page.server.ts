import { isDormant, nearby } from '../lib/geo';
import { getCatalog } from '../lib/server/catalog';
import { viewCount } from '../lib/server/popularity';
import type { PageServerLoad } from './$types';

const DEFAULT_RADIUS = 25;

export const load: PageServerLoad = () => {
	const { places, cameras, collections, drives } = getCatalog();
	const cards = places.map((p) => {
		const live = nearby(cameras, p, p.radius_miles ?? DEFAULT_RADIUS).filter(
			(c) => !isDormant(c) && (c.feed_url || c.provider) && c.feed_type === 'image'
		);
		const direct = live.find((c) => c.feed_url);
		return {
			id: p.id,
			name: p.name,
			region: p.region,
			blurb: p.blurb,
			collection: p.collection ?? null,
			liveCameras: live.length,
			// The nearest live picture becomes the place's cover photo.
			cover: direct ? { url: direct.feed_url as string, name: direct.name } : null
		};
	});
	// Most viewed across everyone first; ties keep the order set in the data files.
	const popular = cards
		.filter((c) => !c.collection)
		.map((c, i) => ({ c, i }))
		.sort((a, b) => viewCount(b.c.id) - viewCount(a.c.id) || a.i - b.i)
		.map((x) => x.c.id);
	return {
		collections: collections.map((c) => ({
			...c,
			places: places.filter((p) => p.collection === c.id).length
		})),
		drives,
		places: cards,
		popular
	};
};
