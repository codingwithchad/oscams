import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Place } from '../types';

type PlaceRow = [name: string, lat: number, lon: number, type: string];
type ZipRow = [zip: string, lat: number, lon: number, near: string];

interface Index {
	towns: Map<string, PlaceRow>;
	zips: Map<string, ZipRow>;
}

let index: Index | null = null;

function load(): Index {
	if (index) return index;
	const dir = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
	const towns = new Map<string, PlaceRow>();
	const zips = new Map<string, ZipRow>();
	try {
		const raw = JSON.parse(readFileSync(path.join(dir, 'gazetteer', 'wa.json'), 'utf8')) as {
			places: PlaceRow[];
			zips: ZipRow[];
		};
		// Cities and towns win over unincorporated areas that share a name.
		const rank = (t: string) => (t === 'city' || t === 'town' ? 0 : 1);
		for (const row of raw.places) {
			const key = normalize(row[0]);
			const old = towns.get(key);
			if (!old || rank(row[3]) < rank(old[3])) towns.set(key, row);
		}
		for (const row of raw.zips) zips.set(row[0], row);
	} catch (err) {
		console.warn(`[gazetteer] not loaded: ${(err as Error).message}`);
	}
	return (index = { towns, zips });
}

const normalize = (s: string) =>
	s
		.toLowerCase()
		.replace(/\./g, '')
		.replace(/^(city|town) of /, '')
		.replace(/\s+/g, ' ')
		.trim();

const STATE = /^(.*?)[,\s]+(wa|washington)$/i;
const OTHER_STATE = /,\s*(?!wa\b|washington\b)[a-z .]{2,}$/i;

/**
 * Look up a Washington town or ZIP code without going online. Returns null when the text is not
 * one of those (so the caller can try an online search), and for places in other states.
 */
export function lookupWashington(query: string): Place | null {
	const q = query.trim();
	const idx = load();

	const zip = q.match(/^(\d{5})(?:-\d{4})?$/);
	if (zip) {
		const row = idx.zips.get(zip[1]);
		return row ? { lat: row[1], lon: row[2], label: `${row[0]}, ${row[3]}` } : null;
	}

	if (OTHER_STATE.test(q) && !STATE.test(q)) return null;
	const name = normalize((STATE.exec(q)?.[1] ?? q).replace(/,$/, ''));
	const row = idx.towns.get(name);
	return row ? { lat: row[1], lon: row[2], label: `${row[0]}, WA` } : null;
}

/** Towns whose names start with what has been typed so far, for the as-you-type list (instant, no outside service). */
export function suggestTowns(
	prefix: string,
	limit = 3
): { label: string; sub: string; lat: number; lon: number }[] {
	const key = normalize(prefix);
	if (key.length < 2) return [];
	return [...load().towns.entries()]
		.filter(([name]) => name.startsWith(key))
		.map(([, row]) => row)
		.sort(
			(a, b) =>
				(a[3] === 'city' || a[3] === 'town' ? 0 : 1) -
					(b[3] === 'city' || b[3] === 'town' ? 0 : 1) || a[0].localeCompare(b[0])
		)
		.slice(0, limit)
		.map((row) => ({ label: row[0], sub: 'WA', lat: row[1], lon: row[2] }));
}
