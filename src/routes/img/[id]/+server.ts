import { error } from '@sveltejs/kit';
import sharp from 'sharp';
import { getCatalog } from '../../../lib/server/catalog';
import { cached } from '../../../lib/server/cache';
import type { RequestHandler } from './$types';

const MINUTE = 60_000;

/**
 * A smaller copy of a camera picture, for sources that publish very large images (some are 2 MB).
 * Only cameras whose data sets `max_width` are served, and only from the address in their own file.
 */
export const GET: RequestHandler = async ({ params }) => {
	const camera = getCatalog().cameras.find((c) => c.id === params.id);
	if (!camera?.feed_url || !camera.max_width || camera.feed_type !== 'image')
		error(404, 'Unknown camera');
	const url = camera.feed_url;
	const width = camera.max_width;
	try {
		const body = await cached(`img:${camera.id}`, MINUTE, async () => {
			const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
			if (!res.ok) throw new Error(`upstream ${res.status}`);
			const input = Buffer.from(await res.arrayBuffer());
			return sharp(input)
				.rotate()
				.resize({ width, withoutEnlargement: true })
				.jpeg({ quality: 72, mozjpeg: true })
				.toBuffer();
		});
		return new Response(new Uint8Array(body), {
			headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=60' }
		});
	} catch (err) {
		console.warn(`[img] ${camera.id}: ${(err as Error).message}`);
		error(502, 'Camera picture unavailable');
	}
};
