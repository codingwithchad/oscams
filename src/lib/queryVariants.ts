/**
 * Other ways a person might have meant what they typed, to try when the exact words find nothing.
 * People split or join words differently from the official name ("West Field South Center Mall" is
 * Westfield Southcenter), and add generic words like "mall" that the map data leaves out.
 */
export function queryVariants(query: string, max = 6): string[] {
	const q = query.trim().replace(/\s+/g, ' ');
	const tokens = q.split(' ');
	const out = [q];

	// Join neighbouring words in pairs, starting from the first or the second word.
	const joinPairs = (words: string[], start: number) => {
		const joined: string[] = [];
		for (let i = 0; i < words.length; i++) {
			if (i >= start && (i - start) % 2 === 0 && i + 1 < words.length) {
				joined.push(words[i] + words[i + 1]);
				i++;
			} else joined.push(words[i]);
		}
		return joined.join(' ');
	};
	const forms = (words: string[]) =>
		words.length < 2 ? [] : [joinPairs(words, 0), joinPairs(words, 1), words.join('')];

	out.push(...forms(tokens));
	const stripped = q.replace(/\s+(mall|plaza|shopping (center|centre))$/i, '');
	if (stripped !== q && stripped.length > 2) {
		out.push(stripped, ...forms(stripped.split(' ')));
	}

	const seen = new Set<string>();
	return out
		.filter((v) => {
			const key = v.toLowerCase();
			if (!v || seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.slice(0, max);
}

const GENERIC = /\b(mall|plaza|shopping|the|of|in|at)\b/g;

/** Lower-case letters and numbers only, without filler words, so "West Field South Center Mall" and "Westfield Southcenter" compare as alike. */
export function squash(text: string): string {
	return text
		.toLowerCase()
		.replace(GENERIC, ' ')
		.replace(/[^a-z0-9]/g, '');
}

/** How alike two names are, from 0 to 1 (Dice coefficient on pairs of letters). */
export function similarity(a: string, b: string): number {
	const x = squash(a);
	const y = squash(b);
	if (!x || !y) return 0;
	if (x === y) return 1;
	const pairs = (s: string) => {
		const m = new Map<string, number>();
		for (let i = 0; i < s.length - 1; i++)
			m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1);
		return m;
	};
	const px = pairs(x);
	const py = pairs(y);
	let shared = 0;
	for (const [k, n] of px) shared += Math.min(n, py.get(k) ?? 0);
	return (2 * shared) / (Math.max(x.length - 1, 0) + Math.max(y.length - 1, 0) || 1);
}
