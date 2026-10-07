import { error } from '@sveltejs/kit';
import { isDormant, nearby } from '../../../lib/geo';
import { getCatalog } from '../../../lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const { collections, places, cameras } = getCatalog();
	const collection = collections.find((c) => c.id === params.id);
	if (!collection) error(404, 'Unknown collection');
	return {
		collection,
		places: places
			.filter((p) => p.collection === collection.id)
			.map((p) => {
				const live = nearby(cameras, p, p.radius_miles ?? 2).filter(
					(c) => !isDormant(c) && c.feed_url && c.feed_type === 'image'
				);
				return {
					id: p.id,
					name: p.name,
					blurb: p.blurb,
					liveCameras: live.length,
					cover: live[0] ? { url: live[0].feed_url as string, name: live[0].name } : null
				};
			})
	};
};
