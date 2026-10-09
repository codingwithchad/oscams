// Find live, embeddable YouTube streams near a point, so you can pick ones to add as camera files.
// Usage: node --env-file=.env scripts/find-youtube-cams.mjs <lat> <lon> [radius_km] [search words]
// Example: node --env-file=.env scripts/find-youtube-cams.mjs 47.6 -120.66 50 "town square"
// Costs about 101 of the 10,000 daily YouTube quota units per run. Radius can be at most 1000 km.
import { readdirSync, readFileSync } from 'node:fs';

const [lat, lon, radius = '50', ...words] = process.argv.slice(2);
const key = process.env.YOU_TUBE_DATA_API_KEY;
if (!lat || !lon || !key) {
	console.error(
		'Usage: node --env-file=.env scripts/find-youtube-cams.mjs <lat> <lon> [radius_km] [search words]  (needs YOU_TUBE_DATA_API_KEY)'
	);
	process.exit(1);
}

const api = async (path, params) => {
	const res = await fetch(
		`https://www.googleapis.com/youtube/v3/${path}?${new URLSearchParams({ ...params, key })}`,
		{ signal: AbortSignal.timeout(15000) }
	);
	if (!res.ok)
		throw new Error(`YouTube returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
	return res.json();
};

const search = await api('search', {
	part: 'snippet',
	type: 'video',
	eventType: 'live',
	videoEmbeddable: 'true',
	location: `${lat},${lon}`,
	locationRadius: `${Math.min(Number(radius), 1000)}km`,
	maxResults: '50',
	q: words.join(' ') || 'webcam'
});
const ids = search.items.map((i) => i.id.videoId).filter(Boolean);
if (!ids.length) {
	console.log('No live embeddable streams found. Try a bigger radius or different words.');
	process.exit(0);
}

// Already in the app? Match on video id or channel id inside existing feed urls.
const known = readdirSync('data/cameras')
	.filter((f) => f.endsWith('.json'))
	.map((f) => JSON.parse(readFileSync(`data/cameras/${f}`, 'utf8')).feed_url ?? '')
	.join('\n');

const details = await api('videos', { part: 'snippet,recordingDetails', id: ids.join(',') });
for (const v of details.items) {
	const loc = v.recordingDetails?.location;
	const dup =
		known.includes(v.id) || known.includes(v.snippet.channelId) ? '  (ALREADY ADDED)' : '';
	console.log(`${v.snippet.title}${dup}`);
	console.log(
		`  channel: ${v.snippet.channelTitle}  https://www.youtube.com/channel/${v.snippet.channelId}`
	);
	console.log(`  link:    https://www.youtube.com/watch?v=${v.id}`);
	console.log(
		`  position: ${loc ? `${loc.latitude},${loc.longitude}` : 'not set by the owner (look it up yourself)'}`
	);
	console.log(
		`  add:     node scripts/add-youtube-camera.mjs https://www.youtube.com/watch?v=${v.id} --lat ${loc?.latitude ?? '<lat>'} --lon ${loc?.longitude ?? '<lon>'} --use-channel\n`
	);
}
