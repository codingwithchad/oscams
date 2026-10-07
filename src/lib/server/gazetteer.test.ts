import { describe, expect, it } from 'vitest';
import { lookupWashington } from './gazetteer';

describe('lookupWashington', () => {
	it('finds towns with or without the state', () => {
		for (const q of ['Snohomish', 'snohomish, wa', 'Snohomish, Washington', 'City of Snohomish']) {
			const p = lookupWashington(q);
			expect(p?.label, q).toBe('Snohomish, WA');
			expect(p?.lat).toBeGreaterThan(47.8);
			expect(p?.lat).toBeLessThan(48.0);
		}
	});

	it('finds ZIP codes and names the nearest town', () => {
		expect(lookupWashington('98290')?.label).toBe('98290, Snohomish');
		expect(lookupWashington('98101')?.label).toBe('98101, Seattle');
		expect(lookupWashington('98595')?.label).toBe('98595, Westport');
	});

	it('leaves other states and unknown text to the online search', () => {
		expect(lookupWashington('Portland, OR')).toBeNull();
		expect(lookupWashington('Boise, Idaho')).toBeNull();
		expect(lookupWashington('90210')).toBeNull();
		expect(lookupWashington('Stevens Pass')).toBeNull();
		expect(lookupWashington('1600 Pennsylvania Ave')).toBeNull();
	});
});
