import { describe, expect, it } from 'vitest';
import { allow, visitorAddress } from './rateLimit';

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

describe('visitorAddress', () => {
	const req = (xff?: string) =>
		new Request('http://x/', { headers: xff ? { 'x-forwarded-for': xff } : {} });
	const socket = () => '10.0.0.1';

	it('uses the entry the proxy added, not one the visitor made up', () => {
		expect(visitorAddress(req('6.6.6.6, 203.0.113.9'), socket)).toBe('203.0.113.9');
		expect(visitorAddress(req('1.1.1.1, 2.2.2.2, 203.0.113.9'), socket)).toBe('203.0.113.9');
	});

	it('uses the connection address when there is no proxy header', () => {
		expect(visitorAddress(req(), socket)).toBe('10.0.0.1');
	});

	it('keeps a long window when other keys are cleaned up', () => {
		allow('test-day', 1, 24 * 60 * 60_000, 0);
		for (let i = 0; i < 5001; i++) allow(`test-flood-${i}`, 1, 1000, 0);
		allow('test-trigger', 1, 1000, 10_000);
		expect(allow('test-day', 1, 24 * 60 * 60_000, 10_000)).toBe(false);
	});
});
