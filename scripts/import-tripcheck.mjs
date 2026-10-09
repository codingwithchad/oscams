// Add Oregon DOT (TripCheck) road cameras as camera data files in data/cameras/us-or/.
// Usage: node --env-file=.env scripts/import-tripcheck.mjs [--write]
// Needs ORDOT_CODE_PRIMARY (a TripCheck API subscription key from https://apiportal.odot.state.or.us/).
// Only cameras in Oregon whose picture actually loads are added; ones we already have are skipped. Windy copies of
// the same TripCheck cameras are removed, since the direct picture is bigger and has no Windy limits.
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { dataFiles, fileFor, regionAt } from './lib/data.mjs';
import { readFileSync } from 'node:fs';

const write = process.argv.includes('--write');
const key = process.env.ORDOT_CODE_PRIMARY;
if (!key) {
	console.error('Needs ORDOT_CODE_PRIMARY in .env (TripCheck API subscription key).');
	process.exit(1);
}

const res = await fetch('https://api.odot.state.or.us/tripcheck/Cctv/Inventory', {
	headers: { 'Ocp-Apim-Subscription-Key': key, 'Cache-Control': 'no-cache' }
});
if (!res.ok) throw new Error(`TripCheck returned ${res.status}`);
const inventory = (await res.json()).CCTVInventoryRequest ?? [];

const slug = (s) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.slice(0, 60)
		.replace(/^-+|-+$/g, '');
const km = (a, b) => {
	const r = Math.PI / 180;
	const x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r);
	const y = (b.lat - a.lat) * r;
	return Math.sqrt(x * x + y * y) * 6371;
};
const files = dataFiles('cameras').map((file) => ({
	file,
	cam: JSON.parse(readFileSync(file, 'utf8'))
}));
const haveUrls = new Set(files.map(({ cam }) => (cam.feed_url ?? '').toLowerCase()));
const ids = new Set(files.map(({ cam }) => cam.id));

// TripCheck lists cameras in neighbouring states too; Washington's come from WSDOT, the rest are outside our regions.
const candidates = inventory
	.map((c) => ({
		lat: c.latitude,
		lon: c.longitude,
		// Some TripCheck picture names contain spaces; encode them so the address is valid.
		url: encodeURI(String(c['cctv-url'] ?? '').replace(/^http:/i, 'https:')),
		name: String(c['cctv-other'] || c['device-name'] || '').trim(),
		route: c['route-id'],
		milepost: c.milepoint,
		device: c['device-id']
	}))
	.filter((c) => c.url && c.name && regionAt(c.lat, c.lon)?.abbr === 'OR')
	.filter((c) => !haveUrls.has(c.url.toLowerCase()));

async function isJpeg(url) {
	try {
		const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
		const bytes = new Uint8Array(await r.arrayBuffer());
		return r.ok && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.length > 2000;
	} catch {
		return false;
	}
}

let added = 0;
let dead = 0;
const addedCams = [];
for (let i = 0; i < candidates.length; i += 10) {
	const batch = candidates.slice(i, i + 10);
	const ok = await Promise.all(batch.map((c) => isJpeg(c.url)));
	batch.forEach((c, n) => {
		if (!ok[n]) return void dead++;
		let id = `odot-${slug(c.name)}`;
		if (ids.has(id)) id = `${id}-${c.device}`;
		ids.add(id);
		const camera = {
			id,
			name: c.name,
			lat: c.lat,
			lon: c.lon,
			feed_url: c.url,
			feed_type: 'image',
			source: 'ODOT',
			status: 'approved',
			approved_by: 'codingwithchad',
			page_url: 'https://tripcheck.com/',
			embed_mode: 'direct',
			refresh_seconds: 300,
			tags: ['road'],
			attribution_text: 'Oregon Department of Transportation (TripCheck)',
			created_at: new Date().toISOString().slice(0, 10) + 'T00:00:00Z',
			...(c.route ? { route: c.route.replace(/^([A-Z]+)0*(\d+)/, '$1 $2') } : {}),
			...(typeof c.milepost === 'number' ? { milepost: c.milepost } : {})
		};
		const file = fileFor('cameras', id, c.lat, c.lon);
		if (existsSync(file)) return;
		addedCams.push(camera);
		added++;
		if (write) writeFileSync(file, JSON.stringify(camera, null, 2) + '\n');
	});
}

// Windy copies of TripCheck cameras we now have directly.
const direct = [
	...addedCams,
	...files.map(({ cam }) => cam).filter((c) => /tripcheck\.com/i.test(c.feed_url ?? ''))
];
let removed = 0;
for (const { file, cam } of files) {
	if (cam.provider !== 'windy' || !/TripCheck/.test(cam.source ?? '')) continue;
	if (!direct.some((d) => km(d, cam) < 0.15)) continue;
	removed++;
	if (write) rmSync(file);
}

console.log(
	`${write ? 'Added' : 'Would add'} ${added} TripCheck cameras (${dead} pictures not loading, ${inventory.length} in TripCheck's list). ${write ? 'Removed' : 'Would remove'} ${removed} Windy copies.`
);
