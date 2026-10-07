import { getCatalog } from '../../lib/server/catalog';
import type { PageServerLoad } from './$types';

/** Every place we cover, grouped the way the home page groups them. */
export const load: PageServerLoad = () => {
	const { places, collections } = getCatalog();
	const toRow = (p: (typeof places)[number]) => ({ id: p.id, name: p.name, blurb: p.blurb ?? '' });
	const groups = collections
		.map((c) => ({
			id: c.id,
			name: c.name,
			places: places.filter((p) => p.collection === c.id || c.also?.includes(p.id)).map(toRow)
		}))
		.filter((g) => g.places.length);
	const general = places.filter((p) => !p.collection).map(toRow);
	return {
		groups: general.length
			? [{ id: 'places', name: 'Places', places: general }, ...groups]
			: groups,
		total: places.length
	};
};
