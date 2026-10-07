import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cached, clearCache } from './cache';

beforeEach(() => {
	clearCache();
	vi.useRealTimers();
});

describe('cached', () => {
	it('runs the loader once for many simultaneous callers', async () => {
		const load = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 20));
			return 'value';
		});
		const results = await Promise.all(Array.from({ length: 50 }, () => cached('k', 1000, load)));
		expect(load).toHaveBeenCalledTimes(1);
		expect(results.every((r) => r === 'value')).toBe(true);
	});

	it('serves a saved value until it expires, then loads again', async () => {
		vi.useFakeTimers();
		const load = vi.fn(async () => 'v');
		await cached('k', 1000, load);
		await cached('k', 1000, load);
		expect(load).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(1500);
		await cached('k', 1000, load);
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('shares a failure with the people waiting but does not keep it', async () => {
		const load = vi.fn(async () => {
			await new Promise((r) => setTimeout(r, 10));
			throw new Error('upstream down');
		});
		const settled = await Promise.allSettled([cached('k', 1000, load), cached('k', 1000, load)]);
		expect(settled.every((s) => s.status === 'rejected')).toBe(true);
		expect(load).toHaveBeenCalledTimes(1);
		const ok = vi.fn(async () => 'recovered');
		expect(await cached('k', 1000, ok)).toBe('recovered');
	});

	it('keeps different keys separate', async () => {
		const a = await cached('a', 1000, async () => 1);
		const b = await cached('b', 1000, async () => 2);
		expect([a, b]).toEqual([1, 2]);
	});
});
