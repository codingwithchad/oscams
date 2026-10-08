import { getCatalog } from '../../lib/server/catalog';
import type { PageServerLoad } from './$types';

/**
 * Every place we cover as a tree: region (state) at the top, then the kinds of place (mountain passes,
 * ferries, airfields...), then the places themselves.
 */
export const load: PageServerLoad = () => {
	const { places, collections } = getCatalog();
	const row = (p: (typeof places)[number]) => ({ id: p.id, name: p.name, blurb: p.blurb ?? '' });

	const groups = [
		{ id: 'places', name: 'Featured places', match: (p: (typeof places)[number]) => !p.collection },
		...collections.map((c) => ({
			id: c.id,
			name: c.name,
			match: (p: (typeof places)[number]) =>
				p.collection === c.id || Boolean(c.also?.includes(p.id))
		}))
	];

	const regionNames = [...new Set(places.map((p) => p.state ?? 'Washington'))].sort((a, b) =>
		a.localeCompare(b)
	);
	const regions = regionNames.map((name) => {
		const inRegion = places.filter((p) => (p.state ?? 'Washington') === name);
		return {
			name,
			total: inRegion.length,
			groups: groups
				.map((g) => ({ id: g.id, name: g.name, places: inRegion.filter(g.match).map(row) }))
				.filter((g) => g.places.length)
		};
	});
	return { regions, total: places.length };
};
