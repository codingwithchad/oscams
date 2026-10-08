import type { Handle } from '@sveltejs/kit/hooks';
import { getCatalog } from './lib/server/catalog';
import { startHistory } from './lib/server/history';
import { dev } from '$app/env';

// Load secrets (e.g. WSDOT_CODE) from a local .env file when present. In production, set real environment variables.
try {
	process.loadEnvFile('.env');
} catch {
	// no .env file: rely on the real environment
}

// Read all the data files when the server starts so the first visitor does not wait for them.
getCatalog();

// Start saving the pass-camera pictures that power the replay. Off in development; set HISTORY=off to disable anywhere.
if (!dev && process.env.HISTORY !== 'off') startHistory();

// A missing key does not stop the app, but those cameras and reports show as offline, so say so loudly in the logs.
for (const [name, what] of [
	['WSDOT_CODE', 'WSDOT road reports, ferry space, border waits and weather stations'],
	['WINDY_API_KEY', 'the Windy.com cameras (resorts, Westport, Seattle sights and more)']
] as const) {
	if (!process.env[name])
		console.warn(`[config] ${name} is not set: ${what} will show as unavailable.`);
}

/**
 * The address people should use, for example "whatsupahead.com". When set, every other address (such as the
 * free host's own *.onrender.com address, or www.) forwards there, so old links and posts keep working.
 * Set it only after the domain is connected and its HTTPS certificate is ready.
 */
const CANONICAL_HOST = process.env.CANONICAL_HOST?.trim().toLowerCase();

const SECURITY_HEADERS: Record<string, string> = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'x-frame-options': 'SAMEORIGIN',
	'permissions-policy': 'geolocation=(self), camera=(), microphone=()',
	'strict-transport-security': 'max-age=31536000'
};

export const handle: Handle = async ({ event, resolve }) => {
	if (
		CANONICAL_HOST &&
		event.url.pathname !== '/healthz' &&
		['GET', 'HEAD'].includes(event.request.method)
	) {
		const host = (
			event.request.headers.get('x-forwarded-host') ??
			event.request.headers.get('host') ??
			''
		).toLowerCase();
		if (host && host !== CANONICAL_HOST && !/^(localhost|127\.|\[::1\])/.test(host)) {
			return new Response(null, {
				status: 301,
				headers: { location: `https://${CANONICAL_HOST}${event.url.pathname}${event.url.search}` }
			});
		}
	}
	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS))
		if (!response.headers.has(name)) response.headers.set(name, value);
	return response;
};
