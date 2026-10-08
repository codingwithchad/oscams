import { describe, expect, it } from 'vitest';
import { snowStretches, winterDay, type SnowSample } from './snowLine';

const s = (along: number, tempF: number, snowIn = 0, feet = 500): SnowSample => ({
	along,
	feet,
	tempF,
	snowIn
});

describe('snowStretches', () => {
	it('is empty when it is warm all the way', () => {
		expect(snowStretches([s(0, 50), s(10, 45), s(20, 40)])).toEqual([]);
	});

	it('finds where the snow starts, halfway between the last clear and first snowy sample', () => {
		const r = snowStretches([s(0, 45), s(10, 40), s(20, 30, 0.1, 2800), s(30, 28, 0.2, 3500)]);
		expect(r).toEqual([{ level: 'snow', from: 15, to: 30, feet: 2800 }]);
	});

	it('separates cold from snowing', () => {
		const r = snowStretches([s(0, 30), s(10, 30, 0.1), s(20, 50)]);
		expect(r.map((x) => x.level)).toEqual(['cold', 'snow']);
	});

	it('handles going back down: snow ends', () => {
		const r = snowStretches([s(0, 30, 0.1), s(10, 31, 0.1), s(20, 45)]);
		expect(r).toEqual([{ level: 'snow', from: 0, to: 10, feet: 500 }]);
	});
});

describe('winterDay', () => {
	it('is warm at sea level and snowy on a pass', () => {
		expect(winterDay(100).snowIn).toBe(0);
		expect(winterDay(100).tempF).toBeGreaterThan(38);
		expect(winterDay(4000).snowIn).toBeGreaterThan(0);
		expect(winterDay(4000).tempF).toBeLessThan(32);
	});
});
