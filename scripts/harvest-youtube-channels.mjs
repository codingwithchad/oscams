// Add every live, embeddable stream from the owners listed in scripts/youtube-channels.json as pending cameras.
// Usage: node --env-file=.env scripts/harvest-youtube-channels.mjs [--write]
// Without --write it only reports. Costs about 100 YouTube quota units per channel.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

const key = process.env.YOU_TUBE_DATA_API_KEY;
if (!key) {
	console.error('Needs YOU_TUBE_DATA_API_KEY (see .env.example).');
	process.exit(1);
}
const write = process.argv.includes('--write');
const channels = JSON.parse(readFileSync('scripts/youtube-channels.json', 'utf8'));
const known = () =>
	readdirSync('data/cameras')
		.filter((f) => f.endsWith('.json'))
		.map((f) => readFileSync(`data/cameras/${f}`, 'utf8'))
		.join('\n');
const decode = (s) =>
	s
		.replace(/&amp;/g, '&')
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"');

for (const c of channels) {
	const res = await fetch(
		`https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
			part: 'snippet',
			type: 'video',
			eventType: 'live',
			videoEmbeddable: 'true',
			channelId: c.channel,
			maxResults: '50',
			key
		})}`,
		{ signal: AbortSignal.timeout(15000) }
	);
	if (!res.ok)
		throw new Error(`YouTube returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
	const items = (await res.json()).items;
	console.log(`\n## ${c.label}: ${items.length} live now`);
	for (const i of items) {
		const id = i.id.videoId;
		const title = decode(i.snippet.title);
		if (known().includes(id)) {
			console.log(`  already added: ${title}`);
			continue;
		}
		const name = title.toLowerCase().includes(c.label.split(' ')[0].toLowerCase())
			? title
			: `${c.label} - ${title}`;
		try {
			const out = execFileSync(
				'node',
				[
					'scripts/add-youtube-camera.mjs',
					`https://www.youtube.com/watch?v=${id}`,
					'--lat',
					String(c.lat),
					'--lon',
					String(c.lon),
					'--approx',
					'--name',
					name,
					'--source',
					c.label,
					'--tags',
					c.tags.join(','),
					...(write ? ['--write'] : [])
				],
				{ encoding: 'utf8' }
			);
			console.log(`  ${write ? 'wrote' : 'would add'}: ${name}`);
			if (write) console.log(`    ${out.match(/Wrote (\S+)/)?.[1] ?? ''}`);
		} catch (e) {
			console.log(
				`  skipped: ${name} (${(e.stdout ?? '').match(/- (.*)/)?.[1] ?? e.message.split('\n')[0]})`
			);
		}
	}
}
