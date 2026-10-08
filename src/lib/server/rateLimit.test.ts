import { describe, expect, it } from 'vitest';
import { allow } from './rateLimit';

describe('allow', () => {
	it('lets calls through up to the limit, then says no', () => {
		const key = 'test-a';
		const results = Array.from({ length: 5 }, () => allow(key, 3, 1000, 0));
		expect(results).toEqual([true, true, true, false, false]);
	});

	it('lets calls through again after the window passes', () => {
		const key = 'test-b';
		for (let i = 0; i < 3; i++) allow(key, 3, 1000, 0);
		expect(allow(key, 3, 1000, 500)).toBe(false);
		expect(allow(key, 3, 1000, 1500)).toBe(true);
	});

	it('counts each visitor separately', () => {
		allow('test-c', 1, 1000, 0);
		expect(allow('test-c', 1, 1000, 1)).toBe(false);
		expect(allow('test-d', 1, 1000, 1)).toBe(true);
	});
});
