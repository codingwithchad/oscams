import { error, json } from '@sveltejs/kit';
import { getCatalog } from '../../../../../lib/server/catalog';
import { cached } from '../../../../../lib/server/cache';
import type { RequestHandler } from './$types';

/** When did this camera's image last change? Read from the feed's Last-Modified header. */
export const GET: RequestHandler = async ({ params }) => {
	const camera = getCatalog().cameras.find((c) => c.id === params.id);
	if (!camera?.feed_url || camera.feed_type !== 'image') error(404, 'Unknown camera');
	const url = camera.feed_url;
	const modified = await cached(`age:${camera.id}`, 30_000, async () => {
		try {
			const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
			const header = res.headers.get('last-modified');
			const time = header ? new Date(header) : null;
			return time && !Number.isNaN(time.getTime()) ? time.toISOString() : null;
		} catch {
			return null;
		}
	});
	return json({ modified }, { headers: { 'cache-control': 'public, max-age=30' } });
};
