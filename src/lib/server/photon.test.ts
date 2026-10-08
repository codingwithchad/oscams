import { describe, expect, it } from 'vitest';
import { toSuggestion } from './photon';

describe('toSuggestion', () => {
	it('makes a label and a place from a result', () => {
		expect(
			toSuggestion({
				geometry: { coordinates: [-122.26, 47.46] },
				properties: { name: 'Westfield Southcenter', city: 'Tukwila', state: 'Washington' }
			})
		).toEqual({
			label: 'Westfield Southcenter',
			sub: 'Tukwila, WA',
			lat: 47.46,
			lon: -122.26
		});
	});

	it('uses the street address when there is no name', () => {
		expect(
			toSuggestion({
				geometry: { coordinates: [-122.2, 47.9] },
				properties: {
					housenumber: '3000',
					street: '184th St SW',
					city: 'Lynnwood',
					state: 'Washington'
				}
			})?.label
		).toBe('3000 184th St SW');
	});

	it('skips results with no position or no name', () => {
		expect(toSuggestion({ properties: { name: 'x' } })).toBeNull();
		expect(toSuggestion({ geometry: { coordinates: [-122, 47] }, properties: {} })).toBeNull();
	});
});
