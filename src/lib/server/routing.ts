import type { Point } from '../geo';
import { cached } from './cache';
import type { LatLon } from '../route';

const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const USER_AGENT = 'oscams (https://github.com/codingwithchad/oscams)';

export interface DrivingRoute {
	coords: LatLon[];
	miles: number;
	minutes: number;
}

/** Driving route between two points. Uses the free public OSRM demo server, so results are cached. */
export function drivingRoute(from: Point, to: Point): Promise<DrivingRoute> {
	const key = `route:${from.lat.toFixed(3)},${from.lon.toFixed(3)}>${to.lat.toFixed(3)},${to.lon.toFixed(3)}`;
	return cached(key, 10 * 60 * 1000, async () => {
		const url = `${OSRM}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
		const res = await fetch(url, {
			headers: { 'User-Agent': USER_AGENT },
			signal: AbortSignal.timeout(10000)
		});
		if (!res.ok) throw new Error(`routing ${res.status}`);
		const body = (await res.json()) as {
			code: string;
			routes?: {
				distance: number;
				duration: number;
				geometry: { coordinates: [number, number][] };
			}[];
		};
		const route = body.routes?.[0];
		if (body.code !== 'Ok' || !route) throw new Error('no route');
		return {
			coords: route.geometry.coordinates.map(
				([lon, lat]) => [Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5] as LatLon
			),
			miles: route.distance / 1609.344,
			minutes: route.duration / 60
		};
	});
}
