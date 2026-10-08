import { getCatalog } from '../../lib/server/catalog';

/** Used by the host to check the app is up and the data loaded. */
export const GET = () => {
	const { cameras, weather, places } = getCatalog();
	return new Response(
		JSON.stringify({
			ok: true,
			cameras: cameras.length,
			weather: weather.length,
			places: places.length,
			// Whether each key is set (never the key itself). Without them some cameras and reports show as offline.
			keys: { windy: Boolean(process.env.WINDY_API_KEY), wsdot: Boolean(process.env.WSDOT_CODE) }
		}),
		{
			headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
		}
	);
};
