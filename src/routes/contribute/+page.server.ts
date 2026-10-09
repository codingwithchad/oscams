import { fail } from '@sveltejs/kit';
import { REPO_URL } from '../../lib/brand';
import { allow, visitorAddress } from '../../lib/server/rateLimit';
import { checkYoutube } from '../../lib/server/youtubeCheck';
import type { Actions } from './$types';

const clean = (v: FormDataEntryValue | null, max: number) =>
	String(v ?? '')
		.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
		.trim()
		.slice(0, max);

const DAY = 24 * 60 * 60_000;
const DAILY_LIMIT = 30;

/** The public repository the suggestions go to, taken from the project's own address. */
const repo = REPO_URL.replace('https://github.com/', '');

export const actions: Actions = {
	suggest: async ({ request, getClientAddress, fetch }) => {
		const form = await request.formData();
		// A hidden field real visitors never fill in; bots usually do.
		if (clean(form.get('website'), 100)) return { sent: true };

		const link = clean(form.get('link'), 400);
		const where = clean(form.get('where'), 200);
		const owner = clean(form.get('owner'), 200);
		const terms = clean(form.get('terms'), 800);
		const name = clean(form.get('name'), 60);
		const values = { link, where, owner, terms, name };

		const who = visitorAddress(request, getClientAddress);
		if (!allow(`contribute:${who}`, 5, 60 * 60_000))
			return fail(429, {
				error: 'That is a lot of suggestions at once. Please try again later.',
				values
			});

		if (!/^https?:\/\/\S+$/.test(link))
			return fail(400, {
				error: 'Please paste the web address of the camera or its page.',
				values
			});
		if (!where) return fail(400, { error: 'Tell us where the camera is.', values });

		const token = process.env.GITHUB_ISSUES_TOKEN;
		if (!token)
			return fail(503, {
				error: 'Suggestions are not switched on yet. Please check back soon.',
				values
			});

		// However many visitors there are, never file more than this many issues a day (stops a flood of spam).
		if (!allow('contribute:all', DAILY_LIMIT, DAY))
			return fail(429, {
				error: 'We have had a lot of suggestions today. Please try again tomorrow.',
				values
			});

		const yt = await checkYoutube(link);
		const lines = [
			'Sent from the Add a camera page on the website.',
			'',
			`**Where is it?** ${where}`,
			`**Who runs it?** ${owner || '(not given)'}`,
			`**Link:** ${link}`,
			`**Does the owner allow public reuse?** ${terms || '(not given)'}`,
			`**From:** ${name || '(no name)'}`
		];
		if (yt)
			lines.push(
				'',
				'**YouTube check**',
				`- Title: ${yt.title ?? 'unknown'}`,
				`- Channel: ${yt.channel ?? 'unknown'}`,
				`- Embedding allowed: ${yt.embeddable ? 'yes' : 'NO'}`,
				`- Live right now: ${yt.live ? 'yes' : 'no'}`
			);
		lines.push(
			'',
			'_Not yet checked by a maintainer. Nothing is added until the owner and terms are confirmed._'
		);

		try {
			const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
				method: 'POST',
				headers: {
					authorization: `Bearer ${token}`,
					accept: 'application/vnd.github+json',
					'content-type': 'application/json',
					'user-agent': 'WhatsUpAhead'
				},
				body: JSON.stringify({
					title: `Camera suggestion: ${where}`.slice(0, 120),
					body: lines.join('\n'),
					labels: ['data']
				}),
				signal: AbortSignal.timeout(10000)
			});
			if (!res.ok) throw new Error(`github ${res.status}`);
		} catch (err) {
			console.warn(`[contribute] could not file the suggestion (${(err as Error).message})`);
			return fail(502, {
				error: 'Sorry, that did not go through. Please try again in a bit.',
				values
			});
		}
		return { sent: true };
	}
};
