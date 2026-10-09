import { describe, expect, it } from 'vitest';
import { regionAt, timeZoneAt } from './regions';

describe('regions', () => {
	it('finds the region a point is in', () => {
		expect(regionAt(47.61, -122.33)?.abbr).toBe('WA');
		expect(regionAt(45.33, -121.71)?.abbr).toBe('OR');
		expect(regionAt(43.6, -116.2)).toBeUndefined();
	});

	it('follows the Columbia River between Washington and Oregon', () => {
		expect(regionAt(45.669, -121.89)?.abbr).toBe('OR'); // Cascade Locks
		expect(regionAt(45.696, -121.885)?.abbr).toBe('WA'); // Stevenson
		expect(regionAt(45.705, -121.52)?.abbr).toBe('OR'); // Hood River
		expect(regionAt(45.73, -121.49)?.abbr).toBe('WA'); // White Salmon
		expect(regionAt(45.6, -121.18)?.abbr).toBe('OR'); // The Dalles
		expect(regionAt(46.188, -123.83)?.abbr).toBe('OR'); // Astoria
		expect(regionAt(45.631, -122.67)?.abbr).toBe('WA'); // Vancouver
		expect(regionAt(45.52, -122.68)?.abbr).toBe('OR'); // Portland
		expect(regionAt(46.14, -122.94)?.abbr).toBe('WA'); // Longview
	});

	it('gives local time zones, including the part of Oregon on Mountain time', () => {
		expect(timeZoneAt(47.61, -122.33)).toBe('America/Los_Angeles');
		expect(timeZoneAt(45.33, -121.71)).toBe('America/Los_Angeles');
		expect(timeZoneAt(43.98, -117.0)).toBe('America/Boise');
	});

	it('the data scripts put files in the same region as the app', async () => {
		// The scripts' plain JavaScript copy of regionAt (loaded by path so the type checker leaves it alone).
		const script = '../../scripts/lib/data.mjs';
		const { regionAt: scriptRegionAt } = await import(/* @vite-ignore */ script);
		const points: [number, number][] = [
			[46.0, -123.92], // Seaside
			[45.8918, -123.9615], // Cannon Beach
			[45.669, -121.885], // Cascade Locks
			[45.705, -121.52], // Hood River
			[46.188, -123.83], // Astoria
			[45.631, -122.67], // Vancouver
			[45.73, -121.49], // White Salmon
			[47.61, -122.33], // Seattle
			[44.06, -121.31] // Bend
		];
		for (const [lat, lon] of points)
			expect(scriptRegionAt(lat, lon)?.abbr, `${lat},${lon}`).toBe(regionAt(lat, lon)?.abbr);
	});
});
