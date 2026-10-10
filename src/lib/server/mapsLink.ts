import { allow } from './rateLimit';

// A Google Maps directions link ("Share directions", or the address bar on a computer) turned into the places of
// the drive: start, any stops, destination. Only the places in the link are used; nothing else about the person.

export interface RoutePoint {
	lat: number;
	lon: number;
	label: string;
}

const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

/** The first Google Maps link inside shared text (Android shares "Directions to X ... https://maps.app.goo.gl/..."). */
export function findMapsLink(text: string): string | null {
	const m = text.match(
		/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|(?:www\.)?google\.[a-z.]+\/maps)\/\S+/i
	);
	return m ? m[0].replace(/[).,]+$/, '') : null;
}

const asLatLon = (s: string) => {
	const m = s.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
	return m ? { lat: Number(m[1]), lon: Number(m[2]) } : null;
};

/**
 * Read the places from a full directions address, e.g.
 * https://www.google.com/maps/dir/Everett,+Washington/Leavenworth,+Washington+98826/@47.78,-121.76,118618m/data=...!2m2!1d-122.207417!2d47.9782457...
 * Named places get their coordinates, in order, from the !1d (longitude) !2d (latitude) pairs in the data part;
 * places typed as coordinates are used as they are. Returns null when the address is not a directions link
 * with at least a start and a destination.
 */
export function parseDirections(href: string): RoutePoint[] | null {
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return null;
	}
	if (!/(^|\.)google\.[a-z.]+$/i.test(url.hostname) || !url.pathname.startsWith('/maps/dir/'))
		return null;
	const parts = url.pathname.slice('/maps/dir/'.length).split('/');
	const data = parts.find((p) => p.startsWith('data=')) ?? '';
	const coords = [...data.matchAll(/!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g)].map((m) => ({
		lon: Number(m[1]),
		lat: Number(m[2])
	}));
	const names = parts
		.filter((p) => !p.startsWith('@') && !p.startsWith('data='))
		.map((p) => decodeURIComponent(p.replace(/\+/g, ' ')).trim());

	// When every place has a coordinate pair in the data part they line up one to one; otherwise only the
	// named places have one and places typed as coordinates are skipped over.
	const oneEach = coords.length === names.length;
	const points: RoutePoint[] = [];
	let next = 0;
	for (const [i, name] of names.entries()) {
		if (!name) return null; // "Your location": not in the link, so the app cannot know it
		const typed = asLatLon(name);
		const at = typed ?? (oneEach ? coords[i] : coords[next++]);
		if (!at) return null;
		points.push({ ...at, label: typed ? 'Pinned spot' : name.split(',')[0] });
	}
	return points.length >= 2 ? points : null;
}

/**
 * Turn a shared link into the places of the drive. Short links (maps.app.goo.gl) are looked up once with Google
 * to get the full address; nothing else is ever fetched, so a pasted link cannot make the server visit other sites.
 */
export async function routeFromLink(link: string): Promise<RoutePoint[] | null> {
	let url: URL;
	try {
		url = new URL(link);
	} catch {
		return null;
	}
	if (SHORT_HOSTS.has(url.hostname)) {
		if (url.hostname === 'goo.gl' && !url.pathname.startsWith('/maps')) return null;
		if (!allow('upstream:google-short-links', 30)) return null;
		const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
		const location = res.headers.get('location');
		return location ? parseDirections(location) : null;
	}
	return parseDirections(link);
}
