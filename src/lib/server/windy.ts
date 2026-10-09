import { parseWindy, type WindyView, type WindyWebcam } from '../windy';
import type { Camera } from '../types';
import { cached, cachedMany } from './cache';

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

/**
 * Current image links for many Windy cameras with as few requests as possible: Windy answers up to 50 ids per
 * request, and each answer is cached for five minutes. Cameras Windy does not answer for are left out.
 */
export async function resolveWindyMany(cameras: Camera[]): Promise<Map<string, WindyView>> {
	const key = process.env.WINDY_API_KEY;
	const ids = cameras.map((c) => c.provider_ref).filter((id): id is string => Boolean(id));
	if (!key || !ids.length) return new Map();
	try {
		const found = await cachedMany(
			ids.map((id) => `windy:${id}`),
			FIVE_MINUTES,
			async (missing) => {
				const got = new Map<string, WindyView>();
				const wanted = missing.map((k) => k.slice('windy:'.length));
				for (let i = 0; i < wanted.length; i += 50) {
					const batch = wanted.slice(i, i + 50);
					const res = await fetch(
						`${API}?webcamIds=${batch.map(encodeURIComponent).join(',')}&include=images,urls&limit=50`,
						{ headers: { 'x-windy-api-key': key }, signal: AbortSignal.timeout(10000) }
					);
					if (!res.ok) throw new Error(`windy ${res.status}`);
					const body = (await res.json()) as { webcams?: WindyWebcam[] };
					for (const cam of body.webcams ?? []) {
						const id = String(cam.webcamId);
						const view = parseWindy(cam, id);
						if (view) got.set(`windy:${id}`, view);
					}
				}
				return got;
			}
		);
		return new Map([...found].map(([k, v]) => [k.slice('windy:'.length), v]));
	} catch (err) {
		console.warn(`[windy] batch of ${ids.length}: ${(err as Error).message}`);
		return new Map();
	}
}
