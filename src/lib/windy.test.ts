import { describe, expect, it } from 'vitest';
import { parseWindy } from './windy';

describe('parseWindy', () => {
	it('uses the API image url untouched and links to Windy', () => {
		const view = parseWindy(
			{
				status: 'active',
				lastUpdatedOn: '2026-10-07T18:47:28.000Z',
				images: {
					current: {
						preview: 'https://imgproxy.windy.com/_/preview/plain/current/1/original.jpg?v=2'
					},
					sizes: { preview: { width: 400, height: 224 } }
				},
				urls: {
					detail: 'https://windy.com/webcams/1',
					provider: 'https://www.experiencewestport.com/cam'
				}
			},
			'1'
		);
		expect(view).toEqual({
			url: 'https://imgproxy.windy.com/_/preview/plain/current/1/original.jpg?v=2',
			width: 400,
			height: 224,
			modified: '2026-10-07T18:47:28.000Z',
			link: 'https://windy.com/webcams/1',
			owner: 'experiencewestport.com'
		});
	});

	it('returns null when there is no image or the camera is inactive', () => {
		expect(parseWindy({ status: 'active' }, '1')).toBeNull();
		expect(
			parseWindy({ status: 'inactive', images: { current: { preview: 'x' } } }, '1')
		).toBeNull();
	});
});
