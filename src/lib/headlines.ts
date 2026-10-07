/** Reports that only appear because you are going to that ferry, airport or crossing; they come first. */
const DESTINATION_KINDS = new Set(['ferry', 'airport', 'border']);

export interface HasKind {
	kind: string;
}

/**
 * Pick the few reports worth showing up front; the rest go behind "more reports".
 * - place: the nearest forecast, then the nearest other reports (the list is already nearest first).
 * - trip: the forecasts at the start and the end of the drive, then the first other report on the way.
 * The result keeps the original order.
 */
export function pickHeadlines<T extends HasKind>(
	items: T[],
	mode: 'place' | 'trip',
	count = 3
): { primary: T[]; more: T[] } {
	if (items.length <= count) return { primary: items, more: [] };
	const chosen = new Set<T>();
	const forecasts = items.filter((i) => i.kind === 'forecast');
	if (forecasts[0]) chosen.add(forecasts[0]);
	if (mode === 'trip' && forecasts.length > 1) chosen.add(forecasts[forecasts.length - 1]);
	for (const item of items) {
		if (chosen.size >= count) break;
		if (DESTINATION_KINDS.has(item.kind)) chosen.add(item);
	}
	for (const item of items) {
		if (chosen.size >= count) break;
		if (item.kind !== 'forecast') chosen.add(item);
	}
	for (const item of items) {
		if (chosen.size >= count) break;
		chosen.add(item);
	}
	return { primary: items.filter((i) => chosen.has(i)), more: items.filter((i) => !chosen.has(i)) };
}
