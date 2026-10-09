// Check a YouTube live stream and turn it into a camera data file (status "pending" until the owner approves it).
// Usage: node scripts/add-youtube-camera.mjs <youtube link> --lat 47.98 --lon -122.22 [--name "Everett boat launch"]
//          [--source "Port of Everett"] [--page https://owner.example/camera] [--tags marina,everett] [--use-channel] [--approx] [--write]
// Without --write it only reports what it found. Nothing is added unless every check passes.
import { existsSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const link = args.find((a) => !a.startsWith('--') && /youtu/.test(a));
const flag = (name) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);

if (!link || flag('lat') === undefined || flag('lon') === undefined) {
	console.error(
		'Usage: node scripts/add-youtube-camera.mjs <youtube link> --lat 47.98 --lon -122.22 [--name "..."] [--source "Owner"] [--page url] [--tags a,b] [--use-channel] [--write]'
	);
	process.exit(1);
}

const idMatch = link.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
if (!idMatch) {
	console.error('Could not find a YouTube video id in that link.');
	process.exit(1);
}
const videoId = idMatch[1];
const lat = Number(flag('lat'));
const lon = Number(flag('lon'));
if (!(lat >= 45 && lat <= 49.5 && lon >= -125 && lon <= -116)) {
	console.error(
		`Position ${lat}, ${lon} is outside Washington. Check the order: latitude first (about 47), then longitude (about -122).`
	);
	process.exit(1);
}

const problems = [];
const notes = [];

// 1. Can it be embedded? YouTube answers 200 if the owner allows it, 401/403 if embedding is turned off.
const oembed = await fetch(
	`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
	{ signal: AbortSignal.timeout(15000) }
);
let info = null;
if (oembed.ok) info = await oembed.json();
else
	problems.push(
		`Embedding is not allowed or the video is unavailable (YouTube said ${oembed.status}).`
	);

// 2. Is it live right now, and which channel owns it?
const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
	headers: { 'accept-language': 'en-US,en;q=0.9' },
	signal: AbortSignal.timeout(15000)
}).then((r) => r.text());
const live = /"isLiveNow":true/.test(page);
const channelId = page.match(/"channelId":"(UC[\w-]{22})"/)?.[1];
if (!live)
	problems.push(
		'This is not a live stream right now (it may be a recording, or the stream is off).'
	);

console.log(`Title:    ${info?.title ?? '(unknown)'}`);
console.log(`Channel:  ${info?.author_name ?? '(unknown)'} ${info?.author_url ?? ''}`);
console.log(`Embeds:   ${oembed.ok ? 'yes' : 'NO'}`);
console.log(`Live now: ${live ? 'yes' : 'NO'}`);
if (channelId) console.log(`Channel id: ${channelId}`);

const name = flag('name') ?? info?.title ?? '';
const source = flag('source') ?? info?.author_name ?? '';
if (!name) problems.push('Give it a name with --name "..."');
if (!source) problems.push('Give the owner with --source "..."');

notes.push(
	'Check by hand before you send this: the channel should be the owner of the camera (a port, city, park, resort or business), not someone re-streaming it.'
);
notes.push(
	"A live stream gets a new video address whenever the owner restarts it. Add --use-channel to follow the channel's current live stream instead."
);

if (problems.length) {
	console.log('\nNot added:');
	for (const p of problems) console.log(`  - ${p}`);
	process.exit(2);
}

const slug = name
	.toLowerCase()
	.replace(/[^a-z0-9]+/g, '-')
	.replace(/^-|-$/g, '');
const file = `data/cameras/${slug}.json`;
const useChannel = has('use-channel');
if (useChannel && !channelId) {
	console.error('Could not read the channel id, so --use-channel cannot be used for this one.');
	process.exit(2);
}
const camera = {
	id: slug,
	name,
	description: `Live view from ${source}'s YouTube channel.`,
	lat,
	lon,
	...(has('approx') ? { location_precision: 'approximate' } : {}),
	feed_type: 'stream',
	feed_url: useChannel
		? `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}`
		: `https://www.youtube-nocookie.com/embed/${videoId}`,
	embed_mode: 'iframe',
	source,
	status: 'pending',
	...(flag('page')
		? { page_url: flag('page') }
		: { page_url: `https://www.youtube.com/watch?v=${videoId}` }),
	license_or_terms: `Published by ${source} on YouTube with embedding turned on; shown through YouTube's official player, only after a tap.`,
	tags: (flag('tags') ?? '')
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean),
	attribution_text: `${source} (via YouTube)`,
	created_at: new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
};

console.log('\nAll checks passed.');
if (!has('write')) {
	console.log(`Dry run. Add --write to create ${file}:\n`);
	console.log(JSON.stringify(camera, null, 2));
} else if (existsSync(file)) {
	console.error(`${file} already exists.`);
	process.exit(2);
} else {
	writeFileSync(file, JSON.stringify(camera, null, 2) + '\n');
	console.log(
		`Wrote ${file} with status "pending". The owner of the app approves it after checking the source.`
	);
}
for (const n of notes) console.log(`\nNote: ${n}`);
