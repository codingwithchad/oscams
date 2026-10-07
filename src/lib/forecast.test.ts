import { describe, expect, it } from 'vitest';
import { hourlyRows, type HourlyPeriod } from './forecast';

const hour = (startIso: string, temp: number, short: string, pop: number | null): HourlyPeriod => ({
	startTime: startIso,
	endTime: new Date(new Date(startIso).getTime() + 3600_000).toISOString(),
	temperature: temp,
	temperatureUnit: 'F',
	windSpeed: '5 mph',
	windDirection: 'NW',
	shortForecast: short,
	probabilityOfPrecipitation: { value: pop }
});

const periods = [
	hour('2026-10-07T20:00:00Z', 60, 'Sunny', 0),
	hour('2026-10-07T21:00:00Z', 45, 'Light Snow', 60),
	hour('2026-10-07T22:00:00Z', 33, 'Snow', 80),
	hour('2026-10-07T23:00:00Z', 31, 'Snow', 90)
];

describe('hourlyRows', () => {
	it('picks the hour you will arrive in, then the next hours', () => {
		const rows = hourlyRows(periods, new Date('2026-10-07T21:40:00Z').getTime());
		expect(rows.map((r) => r.value)).toEqual([
			'45°F, Light Snow, 60% precip, wind NW 5 mph',
			'33°F, Snow, 80% precip, wind NW 5 mph',
			'31°F, Snow, 90% precip, wind NW 5 mph'
		]);
		expect(rows[0].label).toBe('About 2:40 PM');
	});

	it('hides a low chance of precipitation and returns nothing past the forecast', () => {
		expect(hourlyRows(periods, new Date('2026-10-07T20:10:00Z').getTime())[0].value).toBe(
			'60°F, Sunny, wind NW 5 mph'
		);
		expect(hourlyRows(periods, new Date('2026-10-08T05:00:00Z').getTime())).toEqual([]);
	});
});
