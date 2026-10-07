import { nearby } from '../../lib/geo';
import { getCatalog } from '../../lib/server/catalog';
import { getConditions } from '../../lib/server/conditions';
import { geocode } from '../../lib/server/geocode';
import type { PageServerLoad } from './$types';

const DEFAULT_RADIUS = 25;
const MAX_RADIUS = 75;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const radius = Math.min(
		Math.max(Number(url.searchParams.get('r')) || DEFAULT_RADIUS, 1),
		MAX_RADIUS
	);
	if (!q)
		return { q, radius, place: null, failed: false, cameras: [], conditions: Promise.resolve([]) };

	let place = null;
	let failed = false;
	try {
		place = await geocode(q);
	} catch {
		failed = true;
	}
	if (!place)
		return { q, radius, place: null, failed, cameras: [], conditions: Promise.resolve([]) };

	const { cameras, weather } = getCatalog();
	setHeaders({ 'cache-control': 'private, max-age=60' });
	return {
		q,
		radius,
		place,
		failed: false,
		cameras: nearby(cameras, place, radius),
		// Streamed: the page shows cameras right away while live weather loads.
		conditions: Promise.all(nearby(weather, place, radius).map(getConditions))
	};
};
