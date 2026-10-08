import { json } from '@sveltejs/kit';
import { suggestTowns } from '../../../lib/server/gazetteer';
import { photonSearch, type Suggestion } from '../../../lib/server/photon';
import { allow } from '../../../lib/server/rateLimit';
import type { RequestHandler } from './$types';

/** Places that match what has been typed so far: Washington towns first (instant), then other places. */
export const GET: RequestHandler = async ({ url, request, getClientAddress }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const who = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || getClientAddress();
	if (!allow(`suggest:${who}`, 60)) return json({ suggestions: [] }, { status: 429 });
	if (q.length < 2) return json({ suggestions: [] });

	const towns = suggestTowns(q);
	let others: Suggestion[] = [];
	try {
		others = await photonSearch(q, 5);
	} catch {
		// the as-you-type list is a nicety: towns still show if the outside service is down
	}
	const seen = new Set(towns.map((t) => t.label.toLowerCase()));
	const merged = [...towns, ...others.filter((o) => !seen.has(`${o.label}`.toLowerCase()))].slice(
		0,
		6
	);
	return json({ suggestions: merged }, { headers: { 'cache-control': 'private, max-age=300' } });
};
