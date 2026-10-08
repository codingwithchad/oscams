import { describe, expect, it } from 'vitest';
import { samplePoints } from './snow';

describe('samplePoints', () => {
	it('includes both ends and stays under the cap on a long route', () => {
		const route: [number, number][] = [];
		for (let i = 0; i <= 200; i++) route.push([47 + i * 0.01, -122]);
		const pts = samplePoints(route);
		expect(pts.length).toBeLessThanOrEqual(24);
		expect(pts[0].along).toBe(0);
		expect(pts[pts.length - 1].lat).toBeCloseTo(49, 1);
	});
});
