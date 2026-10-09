import type { Camera } from '../types';
import { resolveWindyMany } from './windy';

/** Cameras whose picture link comes from a provider get it filled in now (Windy: one request per 50 cameras). */
export async function withLiveLinks<T extends Camera>(cameras: T[]): Promise<T[]> {
	const views = await resolveWindyMany(cameras.filter((c) => c.provider === 'windy'));
	return cameras.map((c) => {
		if (c.provider !== 'windy') return c;
		const v = c.provider_ref ? views.get(c.provider_ref) : undefined;
		if (!v) return { ...c, feed_url: undefined };
		return {
			...c,
			feed_url: v.url,
			view: { link: v.link, owner: v.owner, modified: v.modified, width: v.width }
		};
	});
}
