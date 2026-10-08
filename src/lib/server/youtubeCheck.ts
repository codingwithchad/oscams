/** What YouTube says about a link someone suggested, so the maintainer can see it at a glance. */
export interface YoutubeCheck {
	videoId: string;
	title?: string;
	channel?: string;
	embeddable: boolean;
	live: boolean;
}

export const youtubeId = (link: string) =>
	link.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/)?.[1];

export async function checkYoutube(link: string): Promise<YoutubeCheck | null> {
	const videoId = youtubeId(link);
	if (!videoId || !/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(link)) return null;
	const watch = `https://www.youtube.com/watch?v=${videoId}`;
	try {
		const [oembed, page] = await Promise.all([
			fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`, {
				signal: AbortSignal.timeout(8000)
			}),
			fetch(watch, {
				headers: { 'accept-language': 'en-US,en;q=0.9' },
				signal: AbortSignal.timeout(8000)
			}).then((r) => r.text())
		]);
		const info = oembed.ok
			? ((await oembed.json()) as { title?: string; author_name?: string })
			: null;
		return {
			videoId,
			title: info?.title,
			channel: info?.author_name,
			embeddable: oembed.ok,
			live: /"isLiveNow":true/.test(page)
		};
	} catch {
		return null;
	}
}
