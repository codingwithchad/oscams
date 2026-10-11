import { describe, expect, it } from 'vitest';
import { toRoute, toSuggestion } from './azureMaps';

describe('toSuggestion', () => {
	it('names a business by its name, with its town and state', () => {
		expect(
			toSuggestion({
				type: 'POI',
				poi: { name: 'Bellevue Square' },
				address: { municipality: 'Bellevue', countrySubdivision: 'WA' },
				position: { lat: 47.6156, lon: -122.2039 }
			})
		).toEqual({ label: 'Bellevue Square', sub: 'Bellevue, WA', lat: 47.6156, lon: -122.2039 });
	});

	it('names a town once, not "Leavenworth, Leavenworth"', () => {
		expect(
			toSuggestion({
				type: 'Geography',
				address: { municipality: 'Leavenworth', countrySubdivision: 'WA' },
				position: { lat: 47.6, lon: -120.66 }
			})
		).toMatchObject({ label: 'Leavenworth', sub: 'WA' });
	});

	it('names an address by its number and street', () => {
		expect(
			toSuggestion({
				type: 'Point Address',
				address: { streetNumber: '100', streetName: 'Main St', municipality: 'Everett' },
				position: { lat: 48, lon: -122.2 }
			})
		).toMatchObject({ label: '100 Main St', sub: 'Everett' });
	});

	it('skips a result without a position', () => {
		expect(toSuggestion({ type: 'POI', poi: { name: 'Nowhere' } })).toBeNull();
	});
});

describe('toRoute', () => {
	it('joins the legs and converts meters and seconds', () => {
		const r = toRoute({
			summary: { lengthInMeters: 60 * 1609.344, travelTimeInSeconds: 75 * 60 },
			legs: [
				{ points: [{ latitude: 47.600001, longitude: -122.3 }] },
				{ points: [{ latitude: 47.9, longitude: -121.7 }] }
			]
		});
		expect(r.miles).toBeCloseTo(60, 5);
		expect(r.minutes).toBeCloseTo(75, 5);
		expect(r.coords).toEqual([
			[47.6, -122.3],
			[47.9, -121.7]
		]);
	});
});
