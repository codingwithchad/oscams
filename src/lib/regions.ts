import data from '../../data/regions.json';

/**
 * The states (later provinces) the app covers, from data/regions.json. Adding a region there, plus its data
 * folders (data/cameras/<folder>/ and so on), is what makes place search, the offline town list and local
 * times work for it.
 */
export interface Region {
	code: string;
	folder: string;
	name: string;
	abbr: string;
	country: string;
	/** [west, south, east, north] */
	bbox: [number, number, number, number];
	time_zone: string;
	zones?: { bbox: [number, number, number, number]; time_zone: string }[];
	zip: string;
	/** Optional state line as [lon, lat] points, for regions whose border is a river rather than the box. */
	outline?: [number, number][];
}

export const REGIONS = data.regions as unknown as Region[];

const inside = (b: [number, number, number, number], lat: number, lon: number) =>
	lon >= b[0] && lat >= b[1] && lon <= b[2] && lat <= b[3];

/** Ray casting: is the point inside the polygon of [lon, lat] points? */
function inOutline(outline: [number, number][], lat: number, lon: number): boolean {
	let hit = false;
	for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
		const [xi, yi] = outline[i];
		const [xj, yj] = outline[j];
		if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
	}
	return hit;
}

/** The region a point is in: inside its outline when it has one, otherwise inside its box. */
export function regionAt(lat: number, lon: number): Region | undefined {
	return REGIONS.find(
		(r) => inside(r.bbox, lat, lon) && (!r.outline || inOutline(r.outline, lat, lon))
	);
}

/** The time zone for local clock times at a point, such as forecast hours. */
export function timeZoneAt(lat: number, lon: number): string {
	const region = regionAt(lat, lon) ?? REGIONS[0];
	return region.zones?.find((z) => inside(z.bbox, lat, lon))?.time_zone ?? region.time_zone;
}

/** One box around every region, for biasing online place search toward the area the app covers. */
export const COVERAGE: [number, number, number, number] = [
	Math.min(...REGIONS.map((r) => r.bbox[0])),
	Math.min(...REGIONS.map((r) => r.bbox[1])),
	Math.max(...REGIONS.map((r) => r.bbox[2])),
	Math.max(...REGIONS.map((r) => r.bbox[3]))
];
export const DEFAULT_TIME_ZONE = REGIONS[0].time_zone;
