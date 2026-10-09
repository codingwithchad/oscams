const store = new Map<string, { at: number; value: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 2000;

/**
 * Tiny in-memory cache so upstream APIs are hit at most once per `ttlMs` per key.
 * If many requests ask for the same thing while it is being fetched, they all wait for that one
 * fetch instead of each starting their own. Failures are shared with the waiters but never kept.
 */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
	const hit = store.get(key);
	if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
	const pending = inFlight.get(key);
	if (pending) return pending as Promise<T>;

	const promise = (async () => {
		try {
			const value = await load();
			if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
			store.set(key, { at: Date.now(), value });
			return value;
		} finally {
			inFlight.delete(key);
		}
	})();
	inFlight.set(key, promise);
	return promise;
}

/**
 * Like `cached`, for many keys at once: fresh entries come from memory and all the missing ones are loaded in
 * one call (for APIs that answer many ids per request). Missing keys that `load` does not return stay missing.
 */
export async function cachedMany<T>(
	keys: string[],
	ttlMs: number,
	load: (missing: string[]) => Promise<Map<string, T>>
): Promise<Map<string, T>> {
	const out = new Map<string, T>();
	const missing: string[] = [];
	for (const key of new Set(keys)) {
		const hit = store.get(key);
		if (hit && Date.now() - hit.at < ttlMs) out.set(key, hit.value as T);
		else missing.push(key);
	}
	if (missing.length) {
		for (const [key, value] of await load(missing)) {
			if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
			store.set(key, { at: Date.now(), value });
			out.set(key, value);
		}
	}
	return out;
}

/** For tests: forget everything. */
export function clearCache() {
	store.clear();
	inFlight.clear();
}
