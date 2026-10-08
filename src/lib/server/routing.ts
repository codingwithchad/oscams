import type { Point } from '../geo';
import { cached } from './cache';
import type { LatLon } from '../route';

const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const USER_AGENT = 'WhatsUpAhead (https://github.com/codingwithchad/whatsupahead)';

export interface DrivingRoute {
	coords: LatLon[];
	miles: number;
	minutes: number;
}

interface OsrmRoute {
	distance: number;
	duration: number;
	geometry: { coordinates: [number, number][] };
	legs?: { steps?: { distance: number; duration: number }[] }[];
}

const MPH = 0.44704;

/**
 * Drive time in minutes. OSRM's seconds are used as given, except for long slow stretches (under 10 mph over
 * a mile or more), which are unpaved forest-road segments it rates at walking pace; those count as 25 mph.
 */
export function driveMinutes(route: Pick<OsrmRoute, 'duration' | 'legs'>): number {
	const steps = route.legs?.flatMap((l) => l.steps ?? []);
	if (!steps?.length) return route.duration / 60;
	let seconds = 0;
	for (const s of steps) {
		const slow = s.distance >= 1609 && s.duration > s.distance / (10 * MPH);
		seconds += slow ? s.distance / (25 * MPH) : s.duration;
	}
	return seconds / 60;
}

export function toDrivingRoute(route: OsrmRoute): DrivingRoute {
	return {
		coords: route.geometry.coordinates.map(
			([lon, lat]) => [Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5] as LatLon
		),
		miles: route.distance / 1609.344,
		minutes: driveMinutes(route)
	};
}

/** Driving route between two points. Uses the free public OSRM demo server, so results are cached. */
export function drivingRoute(from: Point, to: Point): Promise<DrivingRoute> {
	const key = `route:${from.lat.toFixed(3)},${from.lon.toFixed(3)}>${to.lat.toFixed(3)},${to.lon.toFixed(3)}`;
	return cached(key, 10 * 60 * 1000, async () => {
		const url = `${OSRM}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`;
		const res = await fetch(url, {
			headers: { 'User-Agent': USER_AGENT },
			signal: AbortSignal.timeout(10000)
		});
		if (!res.ok) throw new Error(`routing ${res.status}`);
		const body = (await res.json()) as { code: string; routes?: OsrmRoute[] };
		const route = body.routes?.[0];
		if (body.code !== 'Ok' || !route) throw new Error('no route');
		return toDrivingRoute(route);
	});
}
