import { describe, expect, it } from 'vitest';
import { driveMinutes, toDrivingRoute } from './routing';

const geometry = {
	coordinates: [[-122.3, 47.6] as [number, number], [-121.7, 47.9] as [number, number]]
};

describe('driveMinutes', () => {
	it('reads OSRM seconds as minutes divided by 60', () => {
		// 60 miles in 75 minutes
		const r = toDrivingRoute({ distance: 60 * 1609.344, duration: 75 * 60, geometry });
		expect(r.miles).toBeCloseTo(60, 5);
		expect(r.minutes).toBeCloseTo(75, 5);
	});

	it('keeps normal steps exactly as given', () => {
		const minutes = driveMinutes({
			duration: 3600,
			legs: [
				{
					steps: [
						{ distance: 40000, duration: 2400 },
						{ distance: 20000, duration: 1200 }
					]
				}
			]
		});
		expect(minutes).toBeCloseTo(60, 5);
	});

	it('does not let a mapped logging road at walking pace add hours', () => {
		// 9 miles rated at 176 minutes (3 mph), as OSRM did for Wallace Falls Mainline
		const minutes = driveMinutes({
			duration: (60 + 176) * 60,
			legs: [
				{
					steps: [
						{ distance: 51 * 1609.344, duration: 60 * 60 },
						{ distance: 9 * 1609.344, duration: 176 * 60 }
					]
				}
			]
		});
		expect(minutes).toBeLessThan(60 + 25);
		expect(minutes).toBeGreaterThan(60);
	});
});
