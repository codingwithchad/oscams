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
