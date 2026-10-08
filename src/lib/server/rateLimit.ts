const hits = new Map<string, number[]>();

/** Allow at most `limit` calls per `windowMs` for a key (for example a visitor's address). Returns false when over. */
export function allow(key: string, limit: number, windowMs = 60_000, now = Date.now()): boolean {
	const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	if (recent.length >= limit) {
		hits.set(key, recent);
		return false;
	}
	recent.push(now);
	hits.set(key, recent);
	if (hits.size > 5000)
		for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
	return true;
}
