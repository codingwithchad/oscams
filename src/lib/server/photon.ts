import { cached } from './cache';

// Photon (by Komoot) is a free search service built on OpenStreetMap data that forgives typos and works as
// you type. It is used as the main place search, with Nominatim and Open-Meteo as backups.
const USER_AGENT = 'WhatsUpAhead (https://github.com/codingwithchad/whatsupahead)';
const URL_ = 'https://photon.komoot.io/api/';
// The Pacific Northwest: west, south, east, north. Keeps results here instead of a same-named place elsewhere.
const BBOX = '-125.5,45.5,-116.0,49.5';
const HOUR = 60 * 60 * 1000;

export interface Suggestion {
	label: string;
	sub: string;
	lat: number;
	lon: number;
}

interface Feature {
	geometry?: { coordinates?: [number, number] };
	properties?: {
		name?: string;
		housenumber?: string;
		street?: string;
		city?: string;
		town?: string;
		village?: string;
		district?: string;
		county?: string;
		state?: string;
		postcode?: string;
	};
}

export function toSuggestion(f: Feature): Suggestion | null {
	const p = f.properties ?? {};
	const [lon, lat] = f.geometry?.coordinates ?? [];
	if (typeof lat !== 'number' || typeof lon !== 'number') return null;
	const label = p.name ?? [p.housenumber, p.street].filter(Boolean).join(' ');
	if (!label) return null;
	const where = p.city ?? p.town ?? p.village ?? p.district ?? p.county ?? '';
	const state = p.state === 'Washington' ? 'WA' : p.state === 'Oregon' ? 'OR' : (p.state ?? '');
	return { label, sub: [where, state].filter(Boolean).join(', '), lat, lon };
}

export async function photonSearch(query: string, limit = 5): Promise<Suggestion[]> {
	const q = query.trim().slice(0, 120);
	if (q.length < 2) return [];
	return cached(`photon:${limit}:${q.toLowerCase()}`, HOUR, async () => {
		const url = new URL(URL_);
		url.search = new URLSearchParams({
			q,
			limit: String(limit + 3),
			lang: 'en',
			lat: '47.6',
			lon: '-122.3',
			bbox: BBOX
		}).toString();
		const res = await fetch(url, {
			headers: { 'User-Agent': USER_AGENT },
			signal: AbortSignal.timeout(6000)
		});
		if (!res.ok) throw new Error(`photon ${res.status}`);
		const body = (await res.json()) as { features?: Feature[] };
		const seen = new Set<string>();
		const out: Suggestion[] = [];
		for (const f of body.features ?? []) {
			const s = toSuggestion(f);
			if (!s) continue;
			const key = `${s.label}|${s.sub}`.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(s);
			if (out.length >= limit) break;
		}
		return out;
	});
}
