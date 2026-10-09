import { isDormant, nearby } from '../../lib/geo';
import { forPlace } from '../../lib/placeCameras';
import { getCatalog } from '../../lib/server/catalog';
import { getConditions } from '../../lib/server/conditions';
import { allowedKinds } from '../../lib/kinds';
import { geocode } from '../../lib/server/geocode';
import { withForecast } from '../../lib/server/autoForecast';
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
	// A search that names one of our places ("Mount Hood", "stevens pass") opens that place.
	const typed = url.searchParams.get('q')?.trim().toLowerCase();
	const featured =
		places.find((p) => p.id === placeId) ??
		(typed ? places.find((p) => p.name.toLowerCase() === typed) : undefined);
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
		totalCameras: 0,
		showingAll: true,
		fallback: false,
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
	let live = found.filter((c) => !offline(c));

	// Never leave the page empty: if nothing is close, show the nearest working cameras, labelled by distance.
	let fallback = false;
	if (!live.length) {
		const pool = featured ? forPlace(cameras, featured) : cameras;
		const near = await withLiveLinks(nearby(pool, place, MAX_RADIUS).slice(0, 12));
		live = near.filter((c) => !offline(c)).slice(0, 6);
		fallback = live.length > 0;
	}
	return {
		...empty,
		place,
		fallback,
		cameras: showAll || fallback ? live : live.slice(0, CAMERA_LIMIT),
		totalCameras: live.length,
		showingAll: showAll || fallback || live.length <= CAMERA_LIMIT,
		offline: found.filter(offline),
		// Streamed: the page shows cameras right away while live weather loads.
		conditions: Promise.all(
			oneForecast(
				nearby(
					withForecast(
						weather.filter((w) => kinds.has(w.kind)),
						place,
						featured?.weather_radius_miles ?? radius
					),
					place,
					featured?.weather_radius_miles ?? radius
				)
			).map((w) => getConditions(w))
		)
	};
};
