import { describe, expect, it } from 'vitest';
import { forPlace } from './placeCameras';

const cams = [
	{ id: 'road', tags: ['road'] },
	{ id: 'view', tags: ['scenic', 'city'] },
	{ id: 'none' }
];

describe('forPlace', () => {
	it('lists everything for an ordinary place', () => {
		expect(forPlace(cams, {})).toHaveLength(3);
		expect(forPlace(cams, { camera_tags: [] })).toHaveLength(3);
	});

	it('keeps only tagged cameras for a themed place', () => {
		expect(forPlace(cams, { camera_tags: ['scenic'] }).map((c) => c.id)).toEqual(['view']);
		expect(forPlace(cams, { camera_tags: ['nothing'] })).toEqual([]);
	});
});
