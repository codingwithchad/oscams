import { localClock } from './format';

export interface Row {
	label: string;
	value: string;
}

/** WSDOT dates look like "/Date(1791401400000-0700)/". Returns milliseconds since 1970. */
export function parseDotNetDate(text: string): number | null {
	const m = text.match(/\/Date\((-?\d+)/);
	return m ? Number(m[1]) : null;
}

interface SpaceForArrival {
	TerminalName: string;
	DisplayDriveUpSpace?: boolean;
	DriveUpSpaceCount?: number | null;
	DisplayReservableSpace?: boolean;
	ReservableSpaceCount?: number | null;
	MaxSpaceCount?: number;
}

export interface TerminalSpace {
	DepartingSpaces?: {
		Departure: string;
		IsCancelled?: boolean;
		VesselName?: string;
		SpaceForArrivalTerminals?: SpaceForArrival[];
	}[];
}

// Washington State Ferries sail in Pacific time.
const clock = (ms: number) => localClock(ms, 'America/Los_Angeles');

/** The next few sailings from a terminal, with drive-up space when WSF reports it. */
export function ferryRows(space: TerminalSpace, nowMs: number, count = 3): Row[] {
	const rows: Row[] = [];
	for (const dep of space.DepartingSpaces ?? []) {
		const ms = parseDotNetDate(dep.Departure);
		if (ms === null || ms < nowMs) continue;
		const arrival = dep.SpaceForArrivalTerminals?.[0];
		const where = arrival ? `to ${arrival.TerminalName.replace(/ -> .*/, '')}` : '';
		let detail = '';
		if (dep.IsCancelled) detail = 'cancelled';
		else if (arrival?.DisplayDriveUpSpace && arrival.DriveUpSpaceCount != null) {
			detail = `${arrival.DriveUpSpaceCount} drive-up spaces`;
			if (arrival.DisplayReservableSpace && arrival.ReservableSpaceCount != null)
				detail += `, ${arrival.ReservableSpaceCount} reservable`;
		} else if (arrival?.DisplayReservableSpace && arrival.ReservableSpaceCount != null)
			detail = `${arrival.ReservableSpaceCount} reservable spaces`;
		rows.push({ label: clock(ms), value: [where, detail].filter(Boolean).join(' · ') });
		if (rows.length >= count) break;
	}
	return rows;
}

export interface BorderReading {
	CrossingName: string;
	WaitTime: number;
}

const LANES: [suffix: string, label: string][] = [
	['TrucksFast', 'FAST trucks'],
	['Trucks', 'Trucks'],
	['Nexus', 'NEXUS']
];

function laneLabel(name: string): string {
	for (const [suffix, label] of LANES) if (name.endsWith(suffix)) return label;
	return 'General';
}

/** Wait times, in minutes, for the requested crossings. WSDOT reports -1 when a lane has no data. */
export function borderRows(readings: BorderReading[], wanted: string[]): Row[] {
	return wanted
		.map((name) => readings.find((r) => r.CrossingName === name))
		.filter((r): r is BorderReading => Boolean(r))
		.map((r) => ({
			label: laneLabel(r.CrossingName),
			value: r.WaitTime < 0 ? 'no data' : r.WaitTime === 0 ? 'no wait' : `${r.WaitTime} min`
		}));
}

/** One line for a place card, read before opening the place. `tone` colours it: ok, busy or full. */
export interface Glance {
	text: string;
	/** ok, busy and full colour the line; info is plain (we know the time but not how full it is). */
	tone: 'ok' | 'busy' | 'full' | 'info';
}

/** WSF's schedule for today from one terminal, one entry per destination. */
export interface ScheduleCombo {
	ArrivingTerminalName: string;
	Times: { DepartingTime: string }[];
}

function upcomingScheduled(combos: ScheduleCombo[], nowMs: number) {
	return combos
		.flatMap((c) =>
			c.Times.map((t) => ({ to: c.ArrivingTerminalName, ms: parseDotNetDate(t.DepartingTime) }))
		)
		.filter((x): x is { to: string; ms: number } => x.ms !== null && x.ms >= nowMs)
		.sort((a, b) => a.ms - b.ms);
}

/** The next few scheduled sailings, for terminals where WSF publishes no drive-up space. */
export function scheduleRows(combos: ScheduleCombo[], nowMs: number, count = 3): Row[] {
	return upcomingScheduled(combos, nowMs)
		.slice(0, count)
		.map((x) => ({ label: clock(x.ms), value: `to ${x.to}` }));
}

/** The next scheduled sailing, for terminals where WSF publishes no drive-up space. */
export function nextSailingGlance(combos: ScheduleCombo[], nowMs: number): Glance | null {
	const next = upcomingScheduled(combos, nowMs)[0];
	if (!next) return null;
	return {
		text: `Next sailing ${clock(next.ms)}${combos.length > 1 ? ` to ${next.to}` : ''} · no space count`,
		tone: 'info'
	};
}

/**
 * The ferry line at a glance, from drive-up space on the next sailings: how many boats are already full (a
 * "two-boat wait") and the first sailing with room. WSF publishes no live wait time, but this is what it means.
 */
export function ferryGlance(space: TerminalSpace, nowMs: number): Glance | null {
	const upcoming = (space.DepartingSpaces ?? [])
		.map((dep) => ({ dep, ms: parseDotNetDate(dep.Departure) }))
		.filter((x): x is { dep: (typeof x)['dep']; ms: number } => x.ms !== null && x.ms >= nowMs)
		.filter((x) => !x.dep.IsCancelled)
		.slice(0, 6);
	if (!upcoming.length) return null;
	const spaces = (x: (typeof upcoming)[number]) => {
		const a = x.dep.SpaceForArrivalTerminals?.[0];
		return a?.DisplayDriveUpSpace && a.DriveUpSpaceCount != null ? a.DriveUpSpaceCount : null;
	};
	// Terminals with several destinations (Anacortes, Seattle) say which boat they mean.
	const dest = (x: (typeof upcoming)[number]) =>
		x.dep.SpaceForArrivalTerminals?.[0]?.TerminalName.replace(/ -> .*/, '') ?? '';
	const several = new Set(upcoming.map(dest)).size > 1;
	const to = (x: (typeof upcoming)[number]) => (several && dest(x) ? ` to ${dest(x)}` : '');
	const first = upcoming[0];
	const firstSpaces = spaces(first);
	if (firstSpaces === null)
		return { text: `Next sailing ${clock(first.ms)}${to(first)}`, tone: 'ok' };
	const full = upcoming.findIndex((x) => (spaces(x) ?? 1) > 0);
	if (full === 0)
		return {
			text: `Next sailing ${clock(first.ms)}${to(first)} · ${firstSpaces} drive-up spaces`,
			tone: firstSpaces < 15 ? 'busy' : 'ok'
		};
	if (full === -1)
		return { text: `Next ${upcoming.length} sailings full for drive-up cars`, tone: 'full' };
	const open = upcoming[full];
	return {
		text: `${full === 1 ? 'Next boat full' : `Next ${full} boats full`} · space on the ${clock(open.ms)}${to(open)}`,
		tone: 'full'
	};
}

/** The border wait at a glance: the car lane, plus NEXUS when it is reported. */
export function borderGlance(readings: BorderReading[], wanted: string[]): Glance | null {
	const reported = wanted
		.map((name) => readings.find((r) => r.CrossingName === name))
		.filter((r): r is BorderReading => Boolean(r));
	const rows = reported
		.filter((r) => r.WaitTime >= 0)
		.filter((r) => /^(General|NEXUS)$/.test(laneLabel(r.CrossingName)));
	if (!rows.length)
		return reported.length ? { text: 'No wait time reported right now', tone: 'info' } : null;
	const car = rows.find((r) => laneLabel(r.CrossingName) === 'General');
	const text = rows
		.map(
			(r) =>
				`${laneLabel(r.CrossingName) === 'General' ? 'Cars' : 'NEXUS'} ${r.WaitTime === 0 ? 'no wait' : `${r.WaitTime} min`}`
		)
		.join(' · ');
	const minutes = car?.WaitTime ?? rows[0].WaitTime;
	return {
		text: `Into the US: ${text}`,
		tone: minutes >= 45 ? 'full' : minutes >= 20 ? 'busy' : 'ok'
	};
}
