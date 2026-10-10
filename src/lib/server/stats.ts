import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Our own visit counter: counts, never people. No cookies and nothing stored on the visitor's device.
// To tell visitors apart within one day, the server mixes the visitor's address and browser name with a random
// value that changes every day and is never saved, and keeps only that scrambled result, only for that day. So
// nobody (us included) can turn it back into an address or link a visitor across days.
// Counts are saved to a small file every few minutes (STATS_FILE), which survives restarts where the disk does.

export const EVENTS = [
	'viewer-open',
	'viewer-next',
	'viewer-swipe',
	'watch-live',
	'follow-trip',
	'reverse-trip',
	'leave-later',
	'install',
	'use-location'
] as const;
export type EventName = (typeof EVENTS)[number];

export interface Day {
	visitors: number;
	views: Record<string, number>;
	/** Which places and collections were opened (by id). */
	places: Record<string, number>;
	/** "from page > to page" for moves inside the site. */
	flows: Record<string, number>;
	/** Other sites that sent visitors (host names only). */
	sources: Record<string, number>;
	events: Record<string, number>;
	searches: { found: number; notFound: number };
}

interface Saved {
	since: string;
	days: Record<string, Day>;
}

const KEEP_DAYS = 60;
const FILE = process.env.STATS_FILE ?? path.resolve(process.cwd(), '.stats', 'stats.json');

let saved: Saved = load();
let salt = { day: '', value: '' };
let seen = new Set<string>();

function load(): Saved {
	try {
		const data = JSON.parse(readFileSync(FILE, 'utf8')) as Saved;
		if (data?.days && data.since) return data;
	} catch {
		// first start, or the host wiped the disk
	}
	return { since: new Date().toISOString(), days: {} };
}

/** The day in Pacific time, so "today" matches the people using it. */
export const dayOf = (ms = Date.now()) =>
	new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

function today(): Day {
	const day = dayOf();
	if (salt.day !== day) {
		salt = { day, value: randomBytes(16).toString('hex') };
		seen = new Set();
	}
	return (saved.days[day] ??= {
		visitors: 0,
		views: {},
		places: {},
		flows: {},
		sources: {},
		events: {},
		searches: { found: 0, notFound: 0 }
	});
}

const bump = (table: Record<string, number>, key: string) => (table[key] = (table[key] ?? 0) + 1);

// Bots, link previews and monitoring are not visitors.
const NOT_A_PERSON =
	/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|curl|wget|python|go-http|node|axios|headless|monitor|uptime|lighthouse/i;

export function isPerson(userAgent: string): boolean {
	return Boolean(userAgent) && !NOT_A_PERSON.test(userAgent);
}

/** A page was shown. `page` is a short name ("home", "trip", "place"...), `from` the page they came from on our site. */
export function recordView(opts: {
	address: string;
	userAgent: string;
	page: string;
	from?: string | null;
	source?: string | null;
	place?: string | null;
}) {
	const day = today();
	const visitor = createHash('sha256')
		.update(`${salt.value}|${opts.address}|${opts.userAgent}`)
		.digest('hex')
		.slice(0, 16);
	if (!seen.has(visitor)) {
		seen.add(visitor);
		day.visitors++;
	}
	bump(day.views, opts.page);
	if (opts.place) bump(day.places, opts.place);
	if (opts.from && opts.from !== opts.page) bump(day.flows, `${opts.from} > ${opts.page}`);
	if (opts.source) bump(day.sources, opts.source);
}

export function recordEvent(name: EventName) {
	bump(today().events, name);
}

export function recordSearch(found: boolean) {
	today().searches[found ? 'found' : 'notFound']++;
}

/** The counts for the dashboard, newest day first. */
export function statsReport() {
	today();
	const days = Object.entries(saved.days).sort(([a], [b]) => b.localeCompare(a));
	return { since: saved.since, days };
}

function save() {
	const cutoff = dayOf(Date.now() - KEEP_DAYS * 86_400_000);
	for (const day of Object.keys(saved.days)) if (day < cutoff) delete saved.days[day];
	try {
		mkdirSync(path.dirname(FILE), { recursive: true });
		writeFileSync(`${FILE}.tmp`, JSON.stringify(saved));
		renameSync(`${FILE}.tmp`, FILE);
	} catch (err) {
		console.warn(`[stats] could not save: ${(err as Error).message}`);
	}
}

let started = false;
/** Save every five minutes, and once more the moment the host asks the server to stop. Hosts kill the process
 * a few seconds after their stop signal, before adapter-node's own shutdown finishes, so save on the signal
 * itself (adapter-node still handles the rest of the shutdown). */
export function startStats() {
	if (started) return;
	started = true;
	setInterval(save, 5 * 60 * 1000).unref();
	for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, save);
	process.on('exit', save);
}

/** For tests: start over. */
export function resetStats() {
	saved = { since: new Date().toISOString(), days: {} };
	salt = { day: '', value: '' };
	seen = new Set();
}

/** A short name for a page of the site, and the place or collection it is about. Null for pages we do not count. */
export function pageOf(url: URL): { page: string; place: string | null } | null {
	const p = url.pathname.replace(/\/__data\.json$/, '').replace(/\/$/, '') || '/';
	const q = url.searchParams;
	if (p === '/') return { page: 'home', place: null };
	if (p === '/search')
		return q.get('place')
			? { page: 'place', place: q.get('place') }
			: { page: q.get('q') ? 'search' : 'search-empty', place: null };
	if (p === '/trip')
		return { page: q.get('from') && q.get('to') ? 'trip' : 'trip-form', place: null };
	const collection = p.match(/^\/collections\/([a-z0-9-]+)$/);
	if (collection) return { page: 'collection', place: `collection:${collection[1]}` };
	const named = ['/passes', '/places', '/nearby', '/about', '/contribute'].find((n) => n === p);
	return named ? { page: named.slice(1), place: null } : null;
}
