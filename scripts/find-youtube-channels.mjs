// Search YouTube for live, embeddable streams for each destination in scripts/youtube-destinations.json,
// and list the channels behind them so the owner can be checked once and harvested later.
// Usage: node --env-file=.env scripts/find-youtube-channels.mjs [destination name]
// Costs about 100 of the 10,000 daily YouTube quota units per destination.
import { readFileSync } from 'node:fs';

const key = process.env.YOU_TUBE_DATA_API_KEY;
if (!key) {
	console.error('Needs YOU_TUBE_DATA_API_KEY (see .env.example).');
	process.exit(1);
}
const only = process.argv[2]?.toLowerCase();
const destinations = JSON.parse(readFileSync('scripts/youtube-destinations.json', 'utf8')).filter(
	(d) => !only || d.name.toLowerCase() === only
);

const api = async (path, params) => {
	const res = await fetch(
		`https://www.googleapis.com/youtube/v3/${path}?${new URLSearchParams({ ...params, key })}`,
		{ signal: AbortSignal.timeout(15000) }
	);
	if (!res.ok)
		throw new Error(`YouTube returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
	return res.json();
};

const channels = new Map();
for (const d of destinations) {
	const search = await api('search', {
		part: 'snippet',
		type: 'video',
		eventType: 'live',
		videoEmbeddable: 'true',
		maxResults: '25',
		regionCode: 'US',
		q: `${d.name} live webcam`
	});
	const word = d.name.split(/[ .]/)[0].toLowerCase();
	const hits = search.items.filter((i) =>
		`${i.snippet.title} ${i.snippet.description} ${i.snippet.channelTitle}`
			.toLowerCase()
			.includes(word)
	);
	console.log(`\n## ${d.name}: ${hits.length} of ${search.items.length} results mention it`);
	for (const i of hits.slice(0, 8)) {
		console.log(`  ${i.snippet.title}`);
		console.log(`    ${i.snippet.channelTitle}  https://www.youtube.com/watch?v=${i.id.videoId}`);
		const c = channels.get(i.snippet.channelId) ?? {
			title: i.snippet.channelTitle,
			where: new Set()
		};
		c.where.add(d.name);
		channels.set(i.snippet.channelId, c);
	}
}
console.log('\n# Channels to review');
for (const [id, c] of channels)
	console.log(`${c.title}\thttps://www.youtube.com/channel/${id}\t${[...c.where].join(', ')}`);
