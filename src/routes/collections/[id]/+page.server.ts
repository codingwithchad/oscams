import { error } from '@sveltejs/kit';
import { isDormant, nearby } from '../../../lib/geo';
import { coverPicture, forPlace } from '../../../lib/placeCameras';
import { getCatalog } from '../../../lib/server/catalog';
import { REGIONS, regionAt } from '../../../lib/regions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const { collections, places, cameras } = getCatalog();
	const collection = collections.find((c) => c.id === params.id);
	if (!collection) error(404, 'Unknown collection');
	// Grouped by state, in the order of data/regions.json, when the collection spans more than one.
	const stateOf = (p: (typeof places)[number]) =>
		p.state ?? regionAt(p.lat, p.lon)?.name ?? 'Other places';
	const rank = (name: string) => {
		const i = REGIONS.findIndex((r) => r.name === name);
		return i === -1 ? REGIONS.length : i;
	};
	const list = places
		.filter((p) => p.collection === collection.id || collection.also?.includes(p.id))
		.map((p) => {
			const live = nearby(forPlace(cameras, p), p, p.radius_miles ?? 2).filter(
				(c) => !isDormant(c) && (c.feed_url || c.provider) && c.feed_type === 'image'
			);
			return {
				id: p.id,
				state: stateOf(p),
				name: p.name,
				blurb: p.blurb,
				liveCameras: live.length,
				cover: coverPicture(live)
			};
		});
	const states = [...new Set(list.map((p) => p.state))].sort((a, b) => rank(a) - rank(b));
	return {
		collection,
		groups: states.map((state) => ({ state, places: list.filter((p) => p.state === state) }))
	};
};
