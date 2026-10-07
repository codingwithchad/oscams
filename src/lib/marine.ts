export interface Row {
	label: string;
	value: string;
}

const M_TO_FT = 3.28084;
const CARDINALS = [
	'N',
	'NNE',
	'NE',
	'ENE',
	'E',
	'ESE',
	'SE',
	'SSE',
	'S',
	'SSW',
	'SW',
	'WSW',
	'W',
	'WNW',
	'NW',
	'NNW'
];

export const cardinal = (deg: number) => CARDINALS[Math.round((deg % 360) / 22.5) % 16];

/** Read the newest row of an NDBC buoy "realtime2" text file. "MM" means missing. */
export function parseBuoy(text: string): Row[] {
	const lines = text.trim().split('\n');
	const header = lines
		.find((l) => l.startsWith('#YY'))
		?.replace('#', '')
		.trim()
		.split(/\s+/);
	const row = lines
		.find((l) => !l.startsWith('#'))
		?.trim()
		.split(/\s+/);
	if (!header || !row) return [];
	const get = (name: string) => {
		const v = row[header.indexOf(name)];
		return v === undefined || v === 'MM' ? null : Number(v);
	};
	const rows: Row[] = [];
	const height = get('WVHT');
	const period = get('DPD');
	const dir = get('MWD');
	if (height !== null) {
		const parts = [`${(height * M_TO_FT).toFixed(1)} ft`];
		if (period !== null) parts.push(`${Math.round(period)} s`);
		if (dir !== null) parts.push(`from ${cardinal(dir)}`);
		rows.push({ label: 'Waves', value: parts.join(' · ') });
	}
	const wind = get('WSPD');
	const gust = get('GST');
	const windDir = get('WDIR');
	if (wind !== null) {
		const mph = Math.round(wind * 2.23694);
		rows.push({
			label: 'Wind',
			value: `${mph} mph${windDir !== null ? ` ${cardinal(windDir)}` : ''}${gust !== null ? `, gusts ${Math.round(gust * 2.23694)}` : ''}`
		});
	}
	const water = get('WTMP');
	if (water !== null) rows.push({ label: 'Water', value: `${Math.round(water * 1.8 + 32)}°F` });
	return rows;
}

export interface TidePrediction {
	t: string; // "2026-10-07 11:19" in the station's local time
	v: string;
	type: 'H' | 'L';
}

/** Next few high and low tides after `nowLocal` ("YYYY-MM-DD HH:MM", station local time). */
export function upcomingTides(predictions: TidePrediction[], nowLocal: string, count = 4): Row[] {
	return predictions
		.filter((p) => p.t > nowLocal)
		.slice(0, count)
		.map((p) => {
			const [date, time] = p.t.split(' ');
			const [h, m] = time.split(':').map(Number);
			const clock = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
			const day = date === nowLocal.slice(0, 10) ? '' : ' tomorrow';
			return {
				label: p.type === 'H' ? 'High' : 'Low',
				value: `${Number(p.v).toFixed(1)} ft at ${clock}${day}`
			};
		});
}

/** "YYYY-MM-DD HH:MM" for `date` in the given time zone. */
export function localStamp(date: Date, timeZone: string): string {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		})
			.formatToParts(date)
			.map((p) => [p.type, p.value])
	);
	return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
