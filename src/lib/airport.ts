export interface Row {
	label: string;
	value: string;
}

const field = (xml: string, tag: string) =>
	xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim() ?? null;
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Delays the FAA currently reports for one airport. The FAA feed lists only airports that have a
 * ground stop, ground delay, general delay or closure, so no entry means no reported delay.
 */
export function faaRows(xml: string, code: string): Row[] {
	const flat = xml.replace(/>\s+</g, '><');
	const rows: Row[] = [];
	const mine = (block: string) => field(block, 'ARPT') === code;

	for (const m of flat.matchAll(/<Program>(.*?)<\/Program>/g)) {
		if (!mine(m[1])) continue;
		const until = field(m[1], 'End_Time');
		rows.push({
			label: 'Ground stop',
			value: [field(m[1], 'Reason'), until ? `until ${until}` : null].filter(Boolean).join(', ')
		});
	}
	for (const m of flat.matchAll(/<Ground_Delay>(.*?)<\/Ground_Delay>/g)) {
		if (!mine(m[1])) continue;
		const avg = field(m[1], 'Avg');
		const max = field(m[1], 'Max');
		const why = field(m[1], 'Reason');
		rows.push({
			label: 'Ground delay',
			value: [avg ? `averaging ${avg}` : null, max ? `up to ${max}` : null, why ? `(${why})` : null]
				.filter(Boolean)
				.join(' ')
		});
	}
	for (const m of flat.matchAll(/<Delay>(.*?)<\/Delay>/g)) {
		if (!mine(m[1])) continue;
		const type = m[1].match(/<Arrival_Departure Type="([^"]+)"/)?.[1] ?? 'Flight';
		const min = field(m[1], 'Min');
		const max = field(m[1], 'Max');
		const trend = field(m[1], 'Trend');
		const why = field(m[1], 'Reason');
		rows.push({
			label: `${titleCase(type.toLowerCase())} delays`,
			value: [
				min && max ? `${min} to ${max}` : (min ?? max),
				trend ? trend.toLowerCase() : null,
				why ? `(${why})` : null
			]
				.filter(Boolean)
				.join(', ')
		});
	}
	for (const m of flat.matchAll(/<Airport>(.*?)<\/Airport>/g)) {
		if (!mine(m[1])) continue;
		const why = field(m[1], 'Reason') ?? '';
		// Notices that only restrict general aviation are not a closure for airline passengers.
		if (/NON SKED|\bGA\b/.test(why)) continue;
		const reopen = field(m[1], 'Reopen');
		rows.push({
			label: 'Closure',
			value: [why.slice(0, 80), reopen ? `reopens ${reopen}` : null].filter(Boolean).join(', ')
		});
	}
	return rows.length ? rows : [{ label: 'Delays', value: 'none reported by the FAA' }];
}

interface Observation {
	properties?: {
		textDescription?: string | null;
		temperature?: { value: number | null };
		visibility?: { value: number | null };
		windSpeed?: { value: number | null };
		windGust?: { value: number | null };
	};
}

/** Airport weather from the National Weather Service station at the airport (METAR). */
export function observationRows(obs: Observation): Row[] {
	const p = obs.properties;
	if (!p) return [];
	const rows: Row[] = [];
	if (p.textDescription) rows.push({ label: 'Sky', value: p.textDescription });
	if (p.temperature?.value != null)
		rows.push({ label: 'Temperature', value: `${Math.round(p.temperature.value * 1.8 + 32)}°F` });
	if (p.visibility?.value != null) {
		const miles = p.visibility.value / 1609.344;
		rows.push({
			label: 'Visibility',
			value: miles >= 10 ? '10+ mi' : `${miles.toFixed(miles < 3 ? 1 : 0)} mi`
		});
	}
	if (p.windSpeed?.value != null) {
		const mph = Math.round(p.windSpeed.value * 0.621371);
		const gust =
			p.windGust?.value != null ? `, gusts ${Math.round(p.windGust.value * 0.621371)}` : '';
		rows.push({ label: 'Wind', value: `${mph} mph${gust}` });
	}
	return rows;
}
