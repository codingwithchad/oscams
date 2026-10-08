import { isDormant, nearby } from '../../lib/geo';
import { forPlace } from '../../lib/placeCameras';
import { getCatalog } from '../../lib/server/catalog';
import { getConditions } from '../../lib/server/conditions';
import { allowedKinds } from '../../lib/kinds';
import { geocode } from '../../lib/server/geocode';
import { recordView } from '../../lib/server/popularity';
import { withLiveLinks } from '../../lib/server/live';
import type { Camera, Nearby, Place } from '../../lib/types';
import type { PageServerLoad } from './$types';

const DEFAULT_RADIUS = 10;
const CAMERA_LIMIT = 24;
const MAX_RADIUS = 75;

/** Several forecasts a few miles apart say the same thing, so keep only the nearest one. */
function oneForecast<T extends { kind: string }>(sources: T[]): T[] {
	let seen = false;
	return sources.filter((w) => w.kind !== 'forecast' || (seen ? false : (seen = true)));
}

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
	const showAll = url.searchParams.get('all') === '1';
	const empty = {
		note: featured?.note ?? null,
		link: featured?.link ?? null,
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
	// Ferry, airport and border reports only appear when the place itself is one of those.
	const kinds = allowedKinds(featured);
	setHeaders({ 'cache-control': 'private, max-age=60' });
	const found = await withLiveLinks(
		nearby(featured ? forPlace(cameras, featured) : cameras, place, radius)
	);
	const offline = (c: Nearby<Camera>) => isDormant(c) || !c.feed_url;
	const live = found.filter((c) => !offline(c));
	return {
		...empty,
		place,
		cameras: showAll ? live : live.slice(0, CAMERA_LIMIT),
		totalCameras: live.length,
		showingAll: showAll || live.length <= CAMERA_LIMIT,
		offline: found.filter(offline),
		// Streamed: the page shows cameras right away while live weather loads.
		conditions: Promise.all(
			oneForecast(
				nearby(
					weather.filter((w) => kinds.has(w.kind)),
					place,
					featured?.weather_radius_miles ?? radius
				)
			).map((w) => getConditions(w))
		)
	};
};
