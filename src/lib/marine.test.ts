import { describe, expect, it } from 'vitest';
import { localStamp, parseBuoy, upcomingTides } from './marine';

const BUOY = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
2026 10 07 17 56  MM   MM   MM   1.5    11   7.6 289     MM    MM  13.6    MM   MM   MM    MM`;

describe('marine', () => {
	it('reads waves and water temperature, skipping missing values', () => {
		const rows = parseBuoy(BUOY);
		expect(rows).toEqual([
			{ label: 'Waves', value: '4.9 ft · 11 s · from WNW' },
			{ label: 'Water', value: '56°F' }
		]);
	});

	it('returns nothing for an empty file', () => {
		expect(parseBuoy('')).toEqual([]);
	});

	it('lists only upcoming tides', () => {
		const preds = [
			{ t: '2026-10-07 04:39', v: '0.283', type: 'L' as const },
			{ t: '2026-10-07 11:19', v: '8.484', type: 'H' as const },
			{ t: '2026-10-08 05:25', v: '0.358', type: 'L' as const }
		];
		expect(upcomingTides(preds, '2026-10-07 10:00')).toEqual([
			{ label: 'High', value: '8.5 ft at 11:19 AM' },
			{ label: 'Low', value: '0.4 ft at 5:25 AM tomorrow' }
		]);
	});

	it('formats local time stamps', () => {
		expect(localStamp(new Date('2026-10-07T18:00:00Z'), 'America/Los_Angeles')).toBe(
			'2026-10-07 11:00'
		);
	});
});
