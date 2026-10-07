import { describe, expect, it } from 'vitest';
import { distanceMiles, isDormant, nearby, parseLatLon } from './geo';

describe('geo', () => {
	it('computes distance', () => {
		const seattle = { lat: 47.6062, lon: -122.3321 };
		const portland = { lat: 45.5152, lon: -122.6784 };
		expect(distanceMiles(seattle, portland)).toBeGreaterThan(140);
		expect(distanceMiles(seattle, portland)).toBeLessThan(150);
	});

	it('filters by radius and sorts nearest first', () => {
		const center = { lat: 47.7448, lon: -121.089 };
		const items = [
			{ id: 'far', lat: 47.0, lon: -122.0 },
			{ id: 'b', lat: 47.75, lon: -121.0 },
			{ id: 'a', lat: 47.745, lon: -121.09 }
		];
		expect(nearby(items, center, 25).map((i) => i.id)).toEqual(['a', 'b']);
	});

	it('treats seasonal items as dormant until their month', () => {
		const item = { availability: 'seasonal', expected_return: '2026-11' };
		expect(isDormant(item, new Date('2026-10-07'))).toBe(true);
		expect(isDormant(item, new Date('2026-11-02'))).toBe(false);
		expect(isDormant({ availability: 'live' }, new Date('2026-10-07'))).toBe(false);
	});

	it('parses lat,lon text', () => {
		expect(parseLatLon('47.7, -121.1')).toEqual({ lat: 47.7, lon: -121.1 });
		expect(parseLatLon('98115')).toBeNull();
		expect(parseLatLon('95,10')).toBeNull();
	});
});
