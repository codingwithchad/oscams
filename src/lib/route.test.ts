import { describe, expect, it } from 'vitest';
import {
	alongRoute,
	cumulativeMiles,
	projectOnRoute,
	thinStops,
	thinToTarget,
	type LatLon
} from './route';
import { distanceMiles } from './geo';

// A straight road running due north for about 10 miles.
const road: LatLon[] = [
	[47.0, -122.0],
	[47.05, -122.0],
	[47.1, -122.0],
	[47.145, -122.0]
];

describe('route', () => {
	it('measures the route', () => {
		const cum = cumulativeMiles(road);
		expect(cum[0]).toBe(0);
		expect(cum[3]).toBeGreaterThan(9.9);
		expect(cum[3]).toBeLessThan(10.2);
	});

	it('finds where a point is along the road', () => {
		const cum = cumulativeMiles(road);
		const p = projectOnRoute({ lat: 47.05, lon: -121.99 }, road, cum);
		expect(p.along).toBeGreaterThan(3.4);
		expect(p.along).toBeLessThan(3.6);
		expect(p.off).toBeGreaterThan(0.4);
		expect(p.off).toBeLessThan(0.6);
	});

	it('orders items by distance along the road and drops ones past the destination or far off', () => {
		const items = [
			{ id: 'late', lat: 47.12, lon: -122.0 },
			{ id: 'early', lat: 47.01, lon: -122.0 },
			{ id: 'far-off-road', lat: 47.05, lon: -121.8 },
			{ id: 'past-end', lat: 47.25, lon: -122.0 },
			{ id: 'behind-start', lat: 46.9, lon: -122.0 }
		];
		expect(alongRoute(items, road).map((r) => r.item.id)).toEqual(['early', 'late']);
	});

	it('keeps something just past the end and something near the destination but off the road', () => {
		const items = [
			{ id: 'just-past', lat: 47.16, lon: -122.0 },
			{ id: 'resort', lat: 47.14, lon: -122.03 }
		];
		const ids = alongRoute(items, road).map((r) => r.item.id);
		expect(ids).toContain('just-past');
		expect(ids).toContain('resort');
	});

	it('keeps real positions for roadside items near the destination and puts off-road ones last', () => {
		const items = [
			{ id: 'resort', lat: 47.14, lon: -122.03 },
			{ id: 'roadside', lat: 47.13, lon: -122.0 }
		];
		const out = alongRoute(items, road);
		expect(out.map((r) => r.item.id)).toEqual(['roadside', 'resort']);
		expect(out[0].along).toBeLessThan(out[1].along);
	});
});

describe('thinning', () => {
	const stops = Array.from({ length: 20 }, (_, i) => ({ id: i, along: i * 0.5, keep: i === 3 }));

	it('spaces cameras out but always keeps marked ones', () => {
		const out = thinStops(stops, 2);
		expect(out.map((s) => s.id)).toEqual([0, 3, 7, 11, 15, 19]);
	});

	it('leaves short lists alone and thins long ones to the target', () => {
		expect(thinToTarget(stops, 30)).toBe(stops);
		expect(thinToTarget(stops, 8).length).toBeLessThanOrEqual(8);
	});
});

describe('alongRoute with the segment grid', () => {
	it('finds exactly what checking every segment finds', () => {
		// A wiggly 120-mile road and 3000 points scattered around it.
		let seed = 7;
		const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
		const road: LatLon[] = [];
		for (let i = 0; i <= 2000; i++) road.push([47 + i * 0.0008, -122 + Math.sin(i / 40) * 0.05]);
		const points = Array.from({ length: 3000 }, (_, i) => ({
			id: i,
			lat: 46.95 + rand() * 1.7,
			lon: -122.2 + rand() * 0.4
		}));
		const cum = cumulativeMiles(road);
		const end = { lat: road[road.length - 1][0], lon: road[road.length - 1][1] };
		const brute = points
			.map((item) => ({ item, ...projectOnRoute(item, road, cum) }))
			.filter(
				(r) =>
					(r.off <= 1.5 && r.along <= cum[cum.length - 1] + 2) || distanceMiles(r.item, end) <= 2.5
			)
			.map((r) => r.item.id)
			.sort((a, b) => a - b);
		const fast = alongRoute(points, road)
			.map((r) => r.item.id)
			.sort((a, b) => a - b);
		expect(brute.length).toBeGreaterThan(100);
		expect(fast).toEqual(brute);
	});
});
