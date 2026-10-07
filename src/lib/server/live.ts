import type { Camera } from '../types';
import { resolveWindy } from './windy';

/** Cameras whose picture link comes from a provider get it filled in now. */
export async function withLiveLinks<T extends Camera>(cameras: T[]): Promise<T[]> {
	return Promise.all(
		cameras.map(async (c) => {
			if (c.provider !== 'windy') return c;
			const v = await resolveWindy(c);
			if (!v) return { ...c, feed_url: undefined };
			return {
				...c,
				feed_url: v.url,
				view: { link: v.link, owner: v.owner, modified: v.modified, width: v.width }
			};
		})
	);
}
