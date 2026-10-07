import { describe, expect, it } from 'vitest';
import { allowedKinds } from './kinds';

describe('allowedKinds', () => {
	it('hides ferry, airport and border reports for an ordinary place', () => {
		const kinds = allowedKinds(null);
		expect(kinds.has('forecast')).toBe(true);
		expect(kinds.has('river')).toBe(true);
		expect(kinds.has('ferry')).toBe(false);
		expect(kinds.has('airport')).toBe(false);
		expect(kinds.has('border')).toBe(false);
		expect(allowedKinds({ collection: undefined }).has('ferry')).toBe(false);
	});

	it('shows the matching kind when the place is in that collection', () => {
		expect(allowedKinds({ collection: 'ferries' }).has('ferry')).toBe(true);
		expect(allowedKinds({ collection: 'ferries' }).has('airport')).toBe(false);
		expect(allowedKinds({ collection: 'airports' }).has('airport')).toBe(true);
		expect(allowedKinds({ collection: 'border' }).has('border')).toBe(true);
	});

	it('lets a place opt in explicitly', () => {
		expect(allowedKinds({ include_kinds: ['ferry'] }).has('ferry')).toBe(true);
	});
});
