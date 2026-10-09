import { getCatalog } from '../../lib/server/catalog';
import { cacheBytes } from '../../lib/server/cache';

/** Used by the host to check the app is up and the data loaded. */
export const GET = ({ request }: { request: Request }) => {
	const { cameras, weather, places } = getCatalog();
	return new Response(
		JSON.stringify({
			ok: true,
			cameras: cameras.length,
			weather: weather.length,
			places: places.length,
			// Whether each key is set (never the key itself). Without them some cameras and reports show as offline.
			// How many addresses the proxies in front of the app put in X-Forwarded-For (never the addresses
			// themselves). Rate limits trust that many entries from the right; see TRUSTED_PROXIES.
			forwarded_hops: (request.headers.get('x-forwarded-for') ?? '')
				.split(',')
				.filter((s) => s.trim()).length,
			cached_picture_mb: Math.round(cacheBytes() / 1048576),
			keys: { windy: Boolean(process.env.WINDY_API_KEY), wsdot: Boolean(process.env.WSDOT_CODE) }
		}),
		{
			headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
		}
	);
};
