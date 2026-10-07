import { distanceMiles, isDormant, nearby, parseLatLon } from '../../lib/geo';
import { getCatalog } from '../../lib/server/catalog';
import { getConditions } from '../../lib/server/conditions';
import { geocode } from '../../lib/server/geocode';
import { withLiveLinks } from '../../lib/server/live';
import { drivingRoute } from '../../lib/server/routing';
import { alongRoute, cumulativeMiles, projectOnRoute } from '../../lib/route';
import type { Camera, FeaturedPlace, Nearby, Place, WeatherSource } from '../../lib/types';
import type { PageServerLoad } from './$types';

const DEFAULT_DESTINATION_RADIUS = 10;

async function resolve(
	q: string,
	places: FeaturedPlace[]
): Promise<(Place & { featured?: FeaturedPlace }) | null> {
	const text = q.trim();
	if (!text) return null;
	const lower = text.toLowerCase();
	const featured = places.find((p) => p.id === lower || p.name.toLowerCase() === lower);
	if (featured) return { lat: featured.lat, lon: featured.lon, label: featured.name, featured };
	const point = parseLatLon(text);
	if (point) return { ...point, label: 'Your location' };
	return geocode(text);
}

/** Weather sources from the start of the drive to the end, so the strip reads like the road. */
function inDrivingOrder<T extends { lat: number; lon: number }>(
	items: T[],
	coords: [number, number][]
): { item: T; along: number }[] {
	const cum = cumulativeMiles(coords);
	return items
		.map((item) => ({ item, along: projectOnRoute(item, coords, cum).along }))
		.sort((a, b) => a.along - b.along);
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const fromQ = url.searchParams.get('from')?.trim() ?? '';
	const toQ = url.searchParams.get('to')?.trim() ?? '';
	const fromLabel = url.searchParams.get('fl')?.trim().slice(0, 80) ?? '';
	// Minutes until you leave (0 = now), so forecasts can be for the time you will actually be there.
	const leaveIn = Math.min(Math.max(Number(url.searchParams.get('in')) || 0, 0), 12 * 60);
	const base = { fromQ: fromLabel || fromQ, toQ, error: null as string | null };
	if (!fromQ || !toQ) return { ...base, trip: null };

	const { cameras, weather, places } = getCatalog();
	let from, to;
	try {
		[from, to] = await Promise.all([resolve(fromQ, places), resolve(toQ, places)]);
	} catch {
		return {
			...base,
			error: 'The location search is not responding. Try again in a moment.',
			trip: null
		};
	}
	if (!from) return { ...base, error: `Couldn't find “${fromQ}”.`, trip: null };
	if (!to) return { ...base, error: `Couldn't find “${toQ}”.`, trip: null };
	if (fromLabel) from.label = fromLabel;
	base.toQ = to.featured?.name ?? toQ;

	let route;
	try {
		route = await drivingRoute(from, to);
	} catch {
		return {
			...base,
			error: "Couldn't work out a driving route between those two places.",
			trip: null
		};
	}

	setHeaders({ 'cache-control': 'private, max-age=60' });
	const total = route.miles;
	const found = alongRoute(cameras, route.coords);
	const withLinks = await withLiveLinks(found.map((f) => f.item));
	const stops = found.map((f, i) => ({ camera: withLinks[i], along: f.along, off: f.off }));
	const isOffline = (c: Camera) => isDormant(c) || !c.feed_url;

	// Weather: anything along the road, plus anything that serves the destination.
	const radius = to.featured?.radius_miles ?? DEFAULT_DESTINATION_RADIUS;
	const sources = new Map<string, WeatherSource>();
	for (const w of alongRoute(weather, route.coords, { corridor: 3 }))
		sources.set(w.item.id, w.item);
	for (const w of nearby(weather, to, radius)) sources.set(w.id, w);
	const wx: Nearby<WeatherSource>[] = [...sources.values()].map((w) => ({
		...w,
		distance: distanceMiles(w, to)
	}));

	return {
		...base,
		trip: {
			from: from.label,
			to: to.label,
			miles: total,
			minutes: route.minutes,
			leaveIn,
			route: route.coords,
			stops: stops.filter((s) => !isOffline(s.camera)),
			offline: stops
				.filter((s) => isOffline(s.camera))
				.map((s) => ({ ...s.camera, distance: s.along }) as Nearby<Camera>),
			// Streamed: the page shows cameras right away while live weather loads.
			conditions: Promise.all(
				inDrivingOrder(wx, route.coords).map(({ item, along }) => {
					// When you will be there: now (or when you leave) plus the driving time to that point.
					const minutesIn =
						leaveIn + (route.minutes * Math.min(along, total)) / Math.max(total, 0.1);
					return getConditions(item, { at: Date.now() + minutesIn * 60_000 });
				})
			)
		}
	};
};
