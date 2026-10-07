import { isDormant, nearby } from '../../lib/geo';
import { getCatalog } from '../../lib/server/catalog';
import { getConditions } from '../../lib/server/conditions';
import { geocode } from '../../lib/server/geocode';
import { recordView } from '../../lib/server/popularity';
import { withLiveLinks } from '../../lib/server/live';
import type { Camera, Nearby, Place } from '../../lib/types';
import type { PageServerLoad } from './$types';

const DEFAULT_RADIUS = 25;
const MAX_RADIUS = 75;

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const { cameras, weather, places } = getCatalog();
	const placeId = url.searchParams.get('place');
	const featured = places.find((p) => p.id === placeId);
	const q = featured ? featured.name : (url.searchParams.get('q')?.trim() ?? '');
	const asked = Number(url.searchParams.get('r'));
	const radius = Math.min(
		Math.max(asked || featured?.radius_miles || DEFAULT_RADIUS, 1),
		MAX_RADIUS
	);
	const empty = {
		q,
		placeId: featured?.id ?? null,
		radius,
		failed: false,
		cameras: [],
		offline: [],
		conditions: Promise.resolve([])
	};

	let place: Place | null = featured
		? { lat: featured.lat, lon: featured.lon, label: featured.name }
		: null;
	let failed = false;
	if (!place && q) {
		try {
			place = await geocode(q);
		} catch {
			failed = true;
		}
	}
	if (!place) return { ...empty, place: null, failed };

	if (featured) recordView(featured.id);
	setHeaders({ 'cache-control': 'private, max-age=60' });
	const found = await withLiveLinks(nearby(cameras, place, radius));
	const offline = (c: Nearby<Camera>) => isDormant(c) || !c.feed_url;
	return {
		...empty,
		place,
		cameras: found.filter((c) => !offline(c)),
		offline: found.filter(offline),
		// Streamed: the page shows cameras right away while live weather loads.
		conditions: Promise.all(nearby(weather, place, radius).map(getConditions))
	};
};
