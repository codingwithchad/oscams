const KEY = 'oscams:recents';
const MAX = 8;

export type Recent =
	| { kind: 'place'; id: string }
	| { kind: 'search'; q: string; label: string }
	| { kind: 'trip'; from: string; to: string };

const same = (a: Recent, b: Recent) =>
	a.kind === 'place' && b.kind === 'place'
		? a.id === b.id
		: a.kind === 'search' && b.kind === 'search'
			? a.q.toLowerCase() === b.q.toLowerCase()
			: a.kind === 'trip' &&
				b.kind === 'trip' &&
				a.from.toLowerCase() === b.from.toLowerCase() &&
				a.to.toLowerCase() === b.to.toLowerCase();

/** Places and searches this device has looked at, newest first. Stays on the phone; there are no accounts. */
export function loadRecents(): Recent[] {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		return Array.isArray(raw)
			? (raw as Recent[]).filter(
					(r) => r && (r.kind === 'place' || r.kind === 'search' || r.kind === 'trip')
				)
			: [];
	} catch {
		return [];
	}
}

export function rememberRecent(entry: Recent) {
	try {
		const next = [entry, ...loadRecents().filter((r) => !same(r, entry))].slice(0, MAX);
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		// remembering is optional (private mode can block storage)
	}
}
