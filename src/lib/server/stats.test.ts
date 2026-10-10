import { beforeEach, describe, expect, it } from 'vitest';
import {
	isPerson,
	pageOf,
	recordEvent,
	recordSearch,
	recordView,
	resetStats,
	statsReport
} from './stats';

const PHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';

beforeEach(() => resetStats());

describe('visit counter', () => {
	it('names pages and the place they are about', () => {
		const at = (p: string) => pageOf(new URL(`https://whatsupahead.com${p}`));
		expect(at('/')).toEqual({ page: 'home', place: null });
		expect(at('/search?place=stevens-pass')).toEqual({ page: 'place', place: 'stevens-pass' });
		expect(at('/search/__data.json?q=Everett')).toEqual({ page: 'search', place: null });
		expect(at('/trip?from=Seattle&to=mount-hood')).toEqual({ page: 'trip', place: null });
		expect(at('/collections/ferries')).toEqual({ page: 'collection', place: 'collection:ferries' });
		expect(at('/stats')).toBeNull();
		expect(at('/img/some-camera')).toBeNull();
	});

	it('counts each visitor once a day, and keeps nothing that identifies them', () => {
		recordView({ address: '203.0.113.9', userAgent: PHONE, page: 'home' });
		recordView({
			address: '203.0.113.9',
			userAgent: PHONE,
			page: 'place',
			place: 'x',
			from: 'home'
		});
		recordView({ address: '198.51.100.7', userAgent: PHONE, page: 'home', source: 'reddit.com' });
		const [[, day]] = statsReport().days;
		expect(day.visitors).toBe(2);
		expect(day.views).toEqual({ home: 2, place: 1 });
		expect(day.flows).toEqual({ 'home > place': 1 });
		expect(day.sources).toEqual({ 'reddit.com': 1 });
		expect(JSON.stringify(statsReport())).not.toContain('203.0.113.9');
	});

	it('counts taps and searches, and tells bots from people', () => {
		recordEvent('viewer-next');
		recordEvent('viewer-next');
		recordSearch(false);
		const [[, day]] = statsReport().days;
		expect(day.events).toEqual({ 'viewer-next': 2 });
		expect(day.searches).toEqual({ found: 0, notFound: 1 });
		expect(isPerson(PHONE)).toBe(true);
		expect(isPerson('Googlebot/2.1')).toBe(false);
		expect(isPerson('facebookexternalhit/1.1')).toBe(false);
		expect(isPerson('')).toBe(false);
	});
});
