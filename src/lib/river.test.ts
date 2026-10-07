import { describe, expect, it } from 'vitest';
import { floodStatus, riverRows } from './river';

const cats = {
	action: { stage: 20 },
	minor: { stage: 25 },
	moderate: { stage: 27 },
	major: { stage: 29 }
};
const NOW = new Date('2026-10-07T20:00:00Z').getTime();
const pt = (iso: string, v: number) => ({ validTime: iso, primary: v });

describe('river', () => {
	it('describes the level against flood stages', () => {
		expect(floodStatus(9.87, cats)).toBe('10.1 ft below the action stage (20 ft)');
		expect(floodStatus(21, cats)).toBe('action stage (near flood stage)');
		expect(floodStatus(26, cats)).toBe('minor flooding');
		expect(floodStatus(30, cats)).toBe('major flooding');
	});

	it('shows level, trend and forecast high, ignoring missing readings', () => {
		const rows = riverRows(
			{ flood: { categories: cats } },
			{
				observed: {
					data: [
						pt('2026-10-07T14:00:00Z', 9.15),
						pt('2026-10-07T17:00:00Z', -999),
						pt('2026-10-07T20:00:00Z', 9.87)
					]
				},
				forecast: {
					data: [
						pt('2026-10-07T19:00:00Z', 20),
						pt('2026-10-08T05:00:00Z', 11.2),
						pt('2026-10-08T12:00:00Z', 8)
					]
				}
			},
			NOW
		);
		expect(rows).toEqual([
			{ label: 'Level', value: '9.9 ft, rising 0.7 ft over 6 h' },
			{ label: 'Flood stage', value: '10.1 ft below the action stage (20 ft)' },
			{ label: 'Forecast high', value: '11.2 ft Wed 10:00 PM' }
		]);
	});

	it('returns nothing with no readings', () => {
		expect(riverRows({}, {}, NOW)).toEqual([]);
	});
});
