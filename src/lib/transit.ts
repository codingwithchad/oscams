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
