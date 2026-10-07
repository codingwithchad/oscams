import { distanceMiles, type Point } from './geo';

export type LatLon = [lat: number, lon: number];

const MILES_PER_DEG_LAT = 69.05;

/** Miles from the start of the route to each vertex. */
export function cumulativeMiles(route: LatLon[]): number[] {
	const cum = [0];
	for (let i = 1; i < route.length; i++) {
		cum.push(
			cum[i - 1] +
				distanceMiles(
					{ lat: route[i - 1][0], lon: route[i - 1][1] },
					{ lat: route[i][0], lon: route[i][1] }
				)
		);
	}
	return cum;
}

export interface Projection {
	/** Miles from the start of the route to the closest point on it. */
	along: number;
	/** Miles from the route to the point. */
	off: number;
}

/** Closest point on the route to `p` (flat-earth maths per segment, fine at road scale). */
export function projectOnRoute(p: Point, route: LatLon[], cum: number[]): Projection {
	let best: Projection = { along: 0, off: Infinity };
	const cosLat = Math.cos((p.lat * Math.PI) / 180);
	for (let i = 0; i < route.length - 1; i++) {
		const [aLat, aLon] = route[i];
		const [bLat, bLon] = route[i + 1];
		const bx = (bLon - aLon) * cosLat * MILES_PER_DEG_LAT;
		const by = (bLat - aLat) * MILES_PER_DEG_LAT;
		const px = (p.lon - aLon) * cosLat * MILES_PER_DEG_LAT;
		const py = (p.lat - aLat) * MILES_PER_DEG_LAT;
		const len2 = bx * bx + by * by;
		const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, (px * bx + py * by) / len2));
		const off = Math.hypot(px - t * bx, py - t * by);
		if (off < best.off) best = { along: cum[i] + t * (cum[i + 1] - cum[i]), off };
	}
	return best;
}

export interface AlongRoute<T> {
	item: T;
	along: number;
	off: number;
}

/**
 * Items on the way, in driving order. An item counts if it is within `corridor` miles of the road
 * and no more than `endBuffer` miles past the destination, or if it sits right at the destination
 * (like a resort camera a little off the road). Anything beyond that is dropped.
 */
export function alongRoute<T extends Point>(
	items: T[],
	route: LatLon[],
	opts: { corridor?: number; endBuffer?: number; destinationRadius?: number } = {}
): AlongRoute<T>[] {
	const { corridor = 1.5, endBuffer = 2, destinationRadius = 2.5 } = opts;
	if (route.length < 2) return [];
	const cum = cumulativeMiles(route);
	const total = cum[cum.length - 1];
	const end = { lat: route[route.length - 1][0], lon: route[route.length - 1][1] };
	const out: AlongRoute<T>[] = [];
	for (const item of items) {
		const { along, off } = projectOnRoute(item, route, cum);
		const atDestination = distanceMiles(item, end) <= destinationRadius;
		const onTheWay = off <= corridor && along <= total + endBuffer;
		if (onTheWay || atDestination)
			out.push({ item, along: onTheWay ? along : Math.max(along, total - 0.01), off });
	}
	return out.sort((a, b) => a.along - b.along || a.off - b.off);
}

/**
 * Thin a long list of stops so the drive shows spaced-out key cameras instead of every one.
 * Stops marked `keep` (other sources, the destination area) are always included.
 */
export function thinStops<T extends { along: number; keep?: boolean }>(
	stops: T[],
	minGap: number
): T[] {
	const out: T[] = [];
	let last = -Infinity;
	for (const s of stops) {
		if (s.keep || s.along - last >= minGap) {
			out.push(s);
			last = s.along;
		}
	}
	return out;
}

/** The smallest spacing (in 0.5 mile steps) that brings the list down to `target` stops or fewer. */
export function thinToTarget<T extends { along: number; keep?: boolean }>(
	stops: T[],
	target: number
): T[] {
	if (stops.length <= target) return stops;
	for (let gap = 0.5; gap <= 20; gap += 0.5) {
		const thinned = thinStops(stops, gap);
		if (thinned.length <= target) return thinned;
	}
	return thinStops(stops, 20);
}
