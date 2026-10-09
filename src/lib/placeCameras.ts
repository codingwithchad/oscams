/**
 * A themed place (for example "Seattle sights") lists only cameras carrying one of its `camera_tags`,
 * so a few landmark cameras are not buried under every road camera in the city. Ordinary places
 * list every camera within their radius.
 */
export function forPlace<T extends { tags?: string[] }>(
	cameras: T[],
	place: { camera_tags?: string[] }
): T[] {
	const wanted = place.camera_tags;
	if (!wanted?.length) return cameras;
	return cameras.filter((c) => c.tags?.some((t) => wanted.includes(t)));
}

/**
 * The cover photo for a place card: the nearest camera whose picture we can show directly (not a provider camera
 * whose link has to be looked up first), through our own server when the camera asks for it.
 */
export function coverPicture(
	cameras: { id: string; name: string; feed_url?: string; max_width?: number; mirror?: boolean }[]
): { url: string; name: string } | null {
	const c = cameras.find((x) => x.feed_url);
	if (!c?.feed_url) return null;
	return { url: c.max_width || c.mirror ? `/img/${c.id}` : c.feed_url, name: c.name };
}
