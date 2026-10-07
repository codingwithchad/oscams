import { beforeEach, describe, expect, it } from 'vitest';
import { loadRecents, rememberRecent } from './recents';

const store = new Map<string, string>();
beforeEach(() => {
	store.clear();
	(globalThis as unknown as { localStorage: Storage }).localStorage = {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v)
	} as Storage;
});

describe('recents', () => {
	it('keeps newest first without duplicates', () => {
		rememberRecent({ kind: 'place', id: 'a' });
		rememberRecent({ kind: 'search', q: 'Everett', label: 'Everett' });
		rememberRecent({ kind: 'place', id: 'a' });
		expect(loadRecents()).toEqual([
			{ kind: 'place', id: 'a' },
			{ kind: 'search', q: 'Everett', label: 'Everett' }
		]);
	});

	it('caps the list and survives bad data', () => {
		for (let i = 0; i < 12; i++) rememberRecent({ kind: 'place', id: `p${i}` });
		expect(loadRecents()).toHaveLength(8);
		store.set('oscams:recents', 'not json');
		expect(loadRecents()).toEqual([]);
	});
});
