import { pacificClock } from './format';

export interface Row {
	label: string;
	value: string;
}

export interface HourlyPeriod {
	startTime: string;
	endTime: string;
	temperature: number;
	temperatureUnit: string;
	windSpeed: string;
	windDirection: string;
	shortForecast: string;
	probabilityOfPrecipitation?: { value: number | null };
}

function describe(p: HourlyPeriod): string {
	const chance = p.probabilityOfPrecipitation?.value;
	return [
		`${p.temperature}°${p.temperatureUnit}`,
		p.shortForecast,
		chance != null && chance >= 20 ? `${chance}% precip` : null,
		`wind ${p.windDirection} ${p.windSpeed}`
	]
		.filter(Boolean)
		.join(', ');
}

/** The forecast for the hour containing `atMs`, then the next hours. Empty if that time is not covered. */
export function hourlyRows(periods: HourlyPeriod[], atMs: number, count = 3): Row[] {
	const i = periods.findIndex((p) => new Date(p.endTime).getTime() > atMs);
	if (i === -1) return [];
	return periods.slice(i, i + count).map((p, n) => ({
		label:
			n === 0
				? `About ${pacificClock(Math.max(atMs, new Date(p.startTime).getTime()))}`
				: pacificClock(new Date(p.startTime).getTime()),
		value: describe(p)
	}));
}
