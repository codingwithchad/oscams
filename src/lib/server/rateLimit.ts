const hits = new Map<string, { windowMs: number; times: number[] }>();

/** Allow at most `limit` calls per `windowMs` for a key (for example a visitor's address). Returns false when over. */
export function allow(key: string, limit: number, windowMs = 60_000, now = Date.now()): boolean {
	const recent = (hits.get(key)?.times ?? []).filter((t) => now - t < windowMs);
	const allowed = recent.length < limit;
	if (allowed) recent.push(now);
	hits.set(key, { windowMs, times: recent });
	if (hits.size > 5000)
		for (const [k, v] of hits) if (!v.times.some((t) => now - t < v.windowMs)) hits.delete(k);
	return allowed;
}

/**
 * The visitor's address, for rate limits. Behind a proxy the left of X-Forwarded-For is whatever the visitor
 * chose to send, so count from the right instead: each proxy we sit behind adds one real entry there.
 * TRUSTED_PROXIES is how many proxies are in front of the app (Render: 1). Without the header (local runs),
 * the connection's own address is used.
 */
export function visitorAddress(request: Request, connection: () => string): string {
	const proxies = Math.max(1, Number(process.env.TRUSTED_PROXIES) || 1);
	const list = (request.headers.get('x-forwarded-for') ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return list.length >= proxies ? list[list.length - proxies] : connection();
}
