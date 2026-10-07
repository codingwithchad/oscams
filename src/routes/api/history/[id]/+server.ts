import { error, json } from '@sveltejs/kit';
import { listFrames, recordingSince } from '../../../../lib/server/history';
import type { RequestHandler } from './$types';

/** The timestamps of the saved pictures for one camera, oldest first. */
export const GET: RequestHandler = ({ params }) => {
	const frames = listFrames(params.id);
	if (!frames) error(404, 'No history for this camera');
	return json(
		{ frames, since: recordingSince() },
		{ headers: { 'cache-control': 'public, max-age=60' } }
	);
};
