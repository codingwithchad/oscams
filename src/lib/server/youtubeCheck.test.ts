import { describe, expect, it } from 'vitest';
import { youtubeId } from './youtubeCheck';

describe('youtubeId', () => {
	it('reads the id from the usual link shapes', () => {
		for (const link of [
			'https://www.youtube.com/watch?v=ywLLbC8AUyQ',
			'https://www.youtube.com/live/ywLLbC8AUyQ?si=abc',
			'https://youtu.be/ywLLbC8AUyQ',
			'https://www.youtube.com/embed/ywLLbC8AUyQ'
		])
			expect(youtubeId(link)).toBe('ywLLbC8AUyQ');
	});

	it('is undefined for other sites', () => {
		expect(youtubeId('https://example.com/camera')).toBeUndefined();
	});
});
