const store = new Map<string, { at: number; value: unknown }>();
const MAX_ENTRIES = 2000;

/** Tiny in-memory cache so upstream APIs are hit at most once per `ttlMs` per key. */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
	const hit = store.get(key);
	if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
	const value = await load();
	if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
	store.set(key, { at: Date.now(), value });
	return value;
}
