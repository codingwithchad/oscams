// Anonymous, site-wide view counts per place (no accounts, no cookies). Kept in memory, so they
// reset when the server restarts; that is fine for ordering "what people are looking at".
const views = new Map<string, number>();

export function recordView(placeId: string) {
	views.set(placeId, (views.get(placeId) ?? 0) + 1);
}

export function viewCount(placeId: string): number {
	return views.get(placeId) ?? 0;
}
