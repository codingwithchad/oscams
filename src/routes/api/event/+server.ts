import { EVENTS, isPerson, recordEvent, type EventName } from '../../../lib/server/stats';
import type { RequestHandler } from './$types';

/** A tap worth counting (see EVENTS), sent by the page with navigator.sendBeacon. Only the name is kept. */
export const POST: RequestHandler = async ({ request }) => {
	let name = '';
	try {
		name = String(((await request.json()) as { name?: unknown }).name ?? '').slice(0, 40);
	} catch {
		// not JSON: ignore
	}
	if (isPerson(request.headers.get('user-agent') ?? '') && EVENTS.includes(name as EventName))
		recordEvent(name as EventName);
	return new Response(null, { status: 204 });
};
