import { parseWindy, type WindyView, type WindyWebcam } from '../windy';
import type { Camera } from '../types';
import { cached } from './cache';

const API = 'https://api.windy.com/webcams/api/v3/webcams';
const FIVE_MINUTES = 5 * 60 * 1000;

/** Ask Windy for the camera's current image link. Cached so we stay a light user of their API. */
export async function resolveWindy(camera: Camera): Promise<WindyView | null> {
	const key = process.env.WINDY_API_KEY;
	const id = camera.provider_ref;
	if (!key || !id) return null;
	try {
		return await cached(`windy:${id}`, FIVE_MINUTES, async () => {
			const res = await fetch(`${API}/${encodeURIComponent(id)}?include=images,urls`, {
				headers: { 'x-windy-api-key': key },
				signal: AbortSignal.timeout(8000)
			});
			if (!res.ok) throw new Error(`windy ${res.status}`);
			return parseWindy((await res.json()) as WindyWebcam, id);
		});
	} catch (err) {
		console.warn(`[windy] ${camera.id}: ${(err as Error).message}`);
		return null;
	}
}
