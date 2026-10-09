// Add USGS river cameras (the HIVIS network, served by the National Imagery Management System API) in our regions
// as camera data files. Public domain US government imagery; no key needed.
// Usage: node scripts/import-usgs-cameras.mjs [--write]
// Only cameras USGS shows publicly and that sent a picture in the last three days are added; ones we already have
// are skipped. Each camera links to its streamgage page, which has the live water-level graph.
import { existsSync, writeFileSync } from 'node:fs';
import { fileFor, loadAll, regionAt, regions } from './lib/data.mjs';

const write = process.argv.includes('--write');
const res = await fetch('https://api.waterdata.usgs.gov/nims/v0/cameras', {
	headers: { 'User-Agent': 'WhatsUpAhead (https://github.com/codingwithchad/whatsupahead)' }
});
if (!res.ok) throw new Error(`USGS returned ${res.status}`);
const cameras = await res.json();

const states = new Set(regions.filter((r) => r.country === 'US').map((r) => r.abbr));
const slug = (s) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.slice(0, 60)
		.replace(/^-+|-+$/g, '');
const existing = loadAll('cameras');
const haveUrls = new Set(existing.map((c) => c.feed_url));
const ids = new Set(existing.map((c) => c.id));
const threeDays = Date.now() - 3 * 86_400_000;

let added = 0;
for (const c of cameras) {
	if (!states.has(c.stateAbrv) || c.hideCam) continue;
	if (!c.newestImageDT || Date.parse(c.newestImageDT) < threeDays) continue;
	// USGS keeps the latest picture under a fixed name in each size; 720 pixels wide suits a phone.
	const feed = `${c.smallDir}${c.camId}_newest.jpg`;
	if (haveUrls.has(feed)) continue;
	let id = `usgs-${slug(c.camName)}`;
	if (ids.has(id)) id = `usgs-${slug(c.camId)}`;
	ids.add(id);
	const lat = Number(c.lat);
	const lon = Number(c.lng);
	// Gauges right on a state line can sit just outside the regions we cover.
	if (!regionAt(lat, lon)) continue;
	const camera = {
		id,
		name: c.camName,
		description: c.camDesc || undefined,
		lat,
		lon,
		feed_url: feed,
		feed_type: 'image',
		source: 'USGS',
		status: 'approved',
		approved_by: 'codingwithchad',
		page_url: `https://waterdata.usgs.gov/monitoring-location/${c.nwisId}/`,
		embed_mode: 'direct',
		refresh_seconds: 900,
		tags: ['river'],
		attribution_text: 'U.S. Geological Survey',
		created_at: new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
	};
	const file = fileFor('cameras', id, lat, lon);
	if (existsSync(file)) continue;
	added++;
	if (write) writeFileSync(file, JSON.stringify(camera, null, 2) + '\n');
	else console.log(`would add ${c.camName} (${c.stateAbrv})`);
}
console.log(`${write ? 'Added' : 'Would add'} ${added} USGS river cameras.`);
