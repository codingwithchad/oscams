import { pacificClock } from './format';

export interface Row {
	label: string;
	value: string;
}

interface Point {
	validTime: string;
	primary: number;
}

export interface GaugeInfo {
	flood?: { categories?: Record<string, { stage: number }> };
}

export interface StageFlow {
	observed?: { data?: Point[] };
	forecast?: { data?: Point[] };
}

const valid = (p: Point | undefined): p is Point => Boolean(p) && p!.primary > -900;
const ft = (n: number) => `${n.toFixed(1)} ft`;

/** The word for how high the river is against the official flood stages. */
export function floodStatus(
	level: number,
	cats: Record<string, { stage: number }> | undefined
): string {
	const stage = (name: string) => cats?.[name]?.stage;
	for (const name of ['major', 'moderate', 'minor'] as const) {
		const s = stage(name);
		if (s !== undefined && level >= s) return `${name} flooding`;
	}
	const action = stage('action');
	if (action !== undefined && level >= action) return 'action stage (near flood stage)';
	return action !== undefined ? `${ft(action - level)} below the action stage (${action} ft)` : '';
}

const weekday = (ms: number) =>
	new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' }).format(
		new Date(ms)
	);

/** River level now, which way it is heading, the forecast high, and where flood stage starts. */
export function riverRows(gauge: GaugeInfo, flow: StageFlow, nowMs: number): Row[] {
	const observed = (flow.observed?.data ?? []).filter(valid);
	const latest = observed[observed.length - 1];
	if (!latest) return [];
	const cats = gauge.flood?.categories;
	const rows: Row[] = [];

	const sixHoursAgo = nowMs - 6 * 3600_000;
	const earlier = observed.find((p) => new Date(p.validTime).getTime() >= sixHoursAgo);
	const change = earlier ? latest.primary - earlier.primary : 0;
	const trend =
		Math.abs(change) < 0.3
			? 'steady'
			: change > 0
				? `rising ${ft(change)}`
				: `falling ${ft(-change)}`;
	rows.push({ label: 'Level', value: `${ft(latest.primary)}, ${trend} over 6 h` });

	const status = floodStatus(latest.primary, cats);
	if (status) rows.push({ label: 'Flood stage', value: status });

	const upcoming = (flow.forecast?.data ?? []).filter(
		(p) => valid(p) && new Date(p.validTime).getTime() > nowMs
	);
	if (upcoming.length) {
		const high = upcoming.reduce((a, b) => (b.primary > a.primary ? b : a));
		const t = new Date(high.validTime).getTime();
		rows.push({
			label: 'Forecast high',
			value: `${ft(high.primary)} ${weekday(t)} ${pacificClock(t)}`
		});
	}
	return rows;
}
