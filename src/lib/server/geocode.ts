import { parseLatLon } from '../geo';
import type { Place } from '../types';
import { cached } from './cache';

const USER_AGENT = 'oscams (https://github.com/codingwithchad/oscams)';
const DAY = 24 * 60 * 60 * 1000;

// Nominatim allows at most one request per second, so uncached lookups wait in line.
let lastLookup = Promise.resolve();
function inLine<T>(job: () => Promise<T>): Promise<T> {
	const run = lastLookup.then(job, job);
	lastLookup = run.then(
		() => new Promise<void>((r) => setTimeout(r, 1100)),
		() => new Promise<void>((r) => setTimeout(r, 1100))
	);
	return run;
}

/** Turn "98115", "Westport, WA", "Stevens Pass" or "47.7,-121.1" into a point. */
export async function geocode(query: string): Promise<Place | null> {
	const q = query.trim().slice(0, 200);
	if (!q) return null;
	const direct = parseLatLon(q);
	if (direct) return { ...direct, label: `${direct.lat.toFixed(3)}, ${direct.lon.toFixed(3)}` };

	return cached(`geo:${q.toLowerCase()}`, DAY, () =>
		inLine(async () => {
			const url = new URL('https://nominatim.openstreetmap.org/search');
			url.search = new URLSearchParams({ q, format: 'jsonv2', limit: '1' }).toString();
			const res = await fetch(url, {
				headers: { 'User-Agent': USER_AGENT },
				signal: AbortSignal.timeout(8000)
			});
			if (!res.ok) throw new Error(`geocoder ${res.status}`);
			const hits = (await res.json()) as { lat: string; lon: string; display_name: string }[];
			if (!hits.length) return null;
			const label = hits[0].display_name.split(',').slice(0, 2).join(',').trim();
			return { lat: Number(hits[0].lat), lon: Number(hits[0].lon), label };
		})
	);
}
