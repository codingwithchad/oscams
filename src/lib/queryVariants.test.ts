import { describe, expect, it } from 'vitest';
import { queryVariants, similarity } from './queryVariants';

const lower = (q: string) => queryVariants(q).map((v) => v.toLowerCase());

describe('queryVariants', () => {
	it('always starts with what was typed', () => {
		expect(queryVariants('Space Needle')[0]).toBe('Space Needle');
		expect(queryVariants('  Space   Needle  ')[0]).toBe('Space Needle');
	});

	it('finds Westfield Southcenter from words split the wrong way', () => {
		expect(lower('West Field South Center Mall')).toContain('westfield southcenter');
		expect(lower('West Field Southcenter')).toContain('westfield southcenter');
	});

	it('drops a trailing generic word and never repeats itself', () => {
		const v = lower('Alderwood Mall');
		expect(v).toContain('alderwood');
		expect(new Set(v).size).toBe(v.length);
	});

	it('handles one word and empty text', () => {
		expect(queryVariants('Seattle')).toEqual(['Seattle']);
		expect(queryVariants('')).toEqual([]);
	});

	it('stays small', () => {
		expect(queryVariants('a b c d e f g h i j k l').length).toBeLessThanOrEqual(6);
	});
});

describe('similarity', () => {
	it('sees through split words and filler words', () => {
		expect(similarity('West Field South Center Mall', 'Westfield Southcenter')).toBe(1);
		expect(similarity('alderwood mall', 'Alderwood Mall')).toBe(1);
	});

	it('ranks the real match above a nearby but different place', () => {
		const typed = 'West Field South Center Mall';
		expect(similarity(typed, 'Westfield Southcenter')).toBeGreaterThan(
			similarity(typed, 'Southcenter Library Connection')
		);
		expect(similarity(typed, 'Westfield Southcenter')).toBeGreaterThan(
			similarity(typed, 'Del Amo Fashion Center')
		);
	});

	it('gives zero for empty text', () => {
		expect(similarity('', 'x')).toBe(0);
	});
});
