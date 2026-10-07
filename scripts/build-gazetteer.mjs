// Build the offline list of Washington towns and ZIP codes from the US Census Bureau Gazetteer files
// (public domain). Run: node scripts/build-gazetteer.mjs [year]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const year = process.argv[2] ?? '2025';
const base = `https://www2.census.gov/geo/docs/maps-data/data/gazetteer/${year}_Gazetteer/${year}_Gaz_`;
const dir = mkdtempSync(join(tmpdir(), 'gaz-'));

async function table(kind) {
	const res = await fetch(`${base}${kind}_national.zip`);
	if (!res.ok) throw new Error(`${kind}: ${res.status}`);
	const zip = join(dir, `${kind}.zip`);
	writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
	const text = execFileSync('unzip', ['-p', zip], { maxBuffer: 1 << 28 }).toString('utf8');
	const [head, ...rows] = text.split('\n').filter(Boolean);
	// The Census changed the separator from a tab to a pipe in newer years; accept either.
	const sep = head.includes('|') ? '|' : '\t';
	const cols = head.split(sep).map((c) => c.trim());
	return rows.map((r) => Object.fromEntries(r.split(sep).map((v, i) => [cols[i], v.trim()])));
}

const KINDS = ['city', 'town', 'village', 'CDP', 'municipality'];
const round = (n) => Math.round(Number(n) * 1e4) / 1e4;

const places = (await table('place'))
	.filter((r) => r.USPS === 'WA')
	.map((r) => {
		const m = r.NAME.match(new RegExp(`^(.*) (${KINDS.join('|')})$`));
		return {
			name: m ? m[1] : r.NAME,
			type: m ? m[2] : '',
			lat: round(r.INTPTLAT),
			lon: round(r.INTPTLONG)
		};
	});

// Washington ZIP codes: 980-986 (west) and 990-994 (east).
const zips = (await table('zcta'))
	.filter((r) => /^(98\d{3}|99[0-4]\d{2})$/.test(r.GEOID))
	.map((r) => ({ zip: r.GEOID, lat: round(r.INTPTLAT), lon: round(r.INTPTLONG) }));

// Give each ZIP the name of the nearest city or town (not a tiny unincorporated area) so results say where it is.
const towns = places.filter((p) => p.type === 'city' || p.type === 'town');
const near = (z) =>
	towns.reduce(
		(best, p) => {
			const d = (p.lat - z.lat) ** 2 + ((p.lon - z.lon) * 0.68) ** 2;
			return d < best.d ? { d, p } : best;
		},
		{ d: Infinity }
	).p.name;
const out = {
	source: `US Census Bureau Gazetteer ${year} (public domain)`,
	places: places.map((p) => [p.name, p.lat, p.lon, p.type]),
	zips: zips.map((z) => [z.zip, z.lat, z.lon, near(z)])
};
writeFileSync('data/gazetteer/wa.json', JSON.stringify(out) + '\n');
console.log(`${places.length} Washington places, ${zips.length} ZIP codes`);
