import { describe, expect, it } from 'vitest';
import { findMapsLink, parseDirections } from './mapsLink';

const EVERETT_TO_LEAVENWORTH =
	'https://www.google.com/maps/dir/Everett,+Washington/Leavenworth,+Washington+98826/@47.7814749,-121.7647207,118618m/data=!3m2!1e3!4b1!4m13!4m12!1m5!1m1!1s0x5490006404f52f5b:0x72449f271b24790!2m2!1d-122.207417!2d47.9782457!1m5!1m1!1s0x549a4d92a4f8f98d:0xa14f95fb0abfef7e!2m2!1d-120.6614765!2d47.5962326?entry=tts';

describe('Google Maps directions links', () => {
	it('reads the start and destination with their coordinates', () => {
		expect(parseDirections(EVERETT_TO_LEAVENWORTH)).toEqual([
			{ lat: 47.9782457, lon: -122.207417, label: 'Everett' },
			{ lat: 47.5962326, lon: -120.6614765, label: 'Leavenworth' }
		]);
	});

	it('keeps stops along the way, in order, including spots typed as coordinates', () => {
		const link =
			'https://www.google.com/maps/dir/Seattle,+WA/47.4245,-121.4175/Leavenworth,+WA/@47.6,-121.5,9z/data=!4m14!4m13!1m5!1m1!1s0x1:0x2!2m2!1d-122.33!2d47.61!1m0!1m5!1m1!1s0x3:0x4!2m2!1d-120.66!2d47.6';
		expect(parseDirections(link)).toEqual([
			{ lat: 47.61, lon: -122.33, label: 'Seattle' },
			{ lat: 47.4245, lon: -121.4175, label: 'Pinned spot' },
			{ lat: 47.6, lon: -120.66, label: 'Leavenworth' }
		]);
	});

	it('refuses links that are not directions, or start at "your location"', () => {
		expect(parseDirections('https://www.google.com/maps/place/Leavenworth')).toBeNull();
		expect(parseDirections('https://evil.example/maps/dir/A/B/')).toBeNull();
		expect(
			parseDirections(
				'https://www.google.com/maps/dir//Leavenworth,+WA/data=!4m5!4m4!1m0!1m1!2m2!1d-120.66!2d47.6'
			)
		).toBeNull();
	});

	it('finds the link inside shared text', () => {
		expect(
			findMapsLink('Directions to Leavenworth: https://maps.app.goo.gl/5B4iW2kJe9juf25J9.')
		).toBe('https://maps.app.goo.gl/5B4iW2kJe9juf25J9');
		expect(findMapsLink('no link here')).toBeNull();
	});
});
