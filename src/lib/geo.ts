const EARTH_RADIUS_MILES = 3958.8;

export interface Point {
	lat: number;
	lon: number;
}

export function distanceMiles(a: Point, b: Point): number {
	const rad = Math.PI / 180;
	const dLat = (b.lat - a.lat) * rad;
	const dLon = (b.lon - a.lon) * rad;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Items within `radius` miles of `center`, nearest first. */
export function nearby<T extends Point>(
	items: T[],
	center: Point,
	radius: number
): (T & { distance: number })[] {
	return items
		.map((item) => ({ ...item, distance: distanceMiles(center, item) }))
		.filter((item) => item.distance <= radius)
		.sort((a, b) => a.distance - b.distance);
}

/** A seasonal item is dormant until its expected_return month starts. */
export function isDormant(
	item: { availability?: string; expected_return?: string },
	now: Date = new Date()
): boolean {
	if (item.availability !== 'seasonal') return false;
	if (!item.expected_return) return true;
	return now < new Date(`${item.expected_return.slice(0, 7)}-01T00:00:00Z`);
}

export function parseLatLon(text: string): Point | null {
	const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
	if (!m) return null;
	const lat = Number(m[1]);
	const lon = Number(m[2]);
	return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ? { lat, lon } : null;
}
