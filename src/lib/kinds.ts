import type { FeaturedPlace } from './types';

/** Reports that are about the area itself: shown for any place or drive. */
const EVERYWHERE = ['forecast', 'station', 'river', 'pass-conditions', 'waves', 'tides'];

/** Reports that are only useful if you are going to that kind of place. */
const BY_COLLECTION: Record<string, string> = {
	ferries: 'ferry',
	airports: 'airport',
	border: 'border'
};

/**
 * Which kinds of weather reports to show. Ferry sailings, flight delays and border waits appear only
 * when the place (or the drive's destination) is a ferry terminal, airport or crossing, or when the
 * place's data explicitly opts in with `include_kinds`.
 */
export function allowedKinds(
	place?: Pick<FeaturedPlace, 'collection' | 'include_kinds'> | null
): Set<string> {
	const kinds = new Set(EVERYWHERE);
	const fromCollection = place?.collection ? BY_COLLECTION[place.collection] : undefined;
	if (fromCollection) kinds.add(fromCollection);
	for (const k of place?.include_kinds ?? []) kinds.add(k);
	return kinds;
}
