import { getCatalog } from '../../lib/server/catalog';

/** Used by the host to check the app is up and the data loaded. */
export const GET = () => {
	const { cameras, weather, places } = getCatalog();
	return new Response(
		JSON.stringify({
			ok: true,
			cameras: cameras.length,
			weather: weather.length,
			places: places.length
		}),
		{
			headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
		}
	);
};
