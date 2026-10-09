import { error } from '@sveltejs/kit';
import sharp from 'sharp';
import { getCatalog } from '../../../lib/server/catalog';
import { cached } from '../../../lib/server/cache';
import type { RequestHandler } from './$types';

const MINUTE = 60_000;

/**
 * Our own copy of a camera picture: smaller, for sources that publish very large images (some are 2 MB), and
 * for owners whose terms say republishers must mirror (download a copy periodically and serve that), like ODOT.
 * Only cameras whose data sets `max_width` or `mirror` are served, and only from the address in their own file.
 */
const MIRROR_WIDTH = 960;
export const GET: RequestHandler = async ({ params }) => {
	const camera = getCatalog().cameras.find((c) => c.id === params.id);
	if (!camera?.feed_url || !(camera.max_width || camera.mirror) || camera.feed_type !== 'image')
		error(404, 'Unknown camera');
	const url = camera.feed_url;
	const width = camera.max_width ?? MIRROR_WIDTH;
	// One download per refresh period, however many people are looking.
	const every = Math.max(MINUTE, (camera.refresh_seconds ?? 60) * 1000);
	try {
		const body = await cached(`img:${camera.id}`, every, async () => {
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
			headers: {
				'content-type': 'image/jpeg',
				'cache-control': `public, max-age=${Math.round(every / 1000)}`
			}
		});
	} catch (err) {
		console.warn(`[img] ${camera.id}: ${(err as Error).message}`);
		error(502, 'Camera picture unavailable');
	}
};
