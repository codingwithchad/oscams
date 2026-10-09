// Shared helpers for the data scripts: read every file in a data folder (including its region subfolders, like
// data/cameras/us-wa/), and pick the region folder a new file belongs in from data/regions.json.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';

export const { regions } = JSON.parse(readFileSync('data/regions.json', 'utf8'));

/** Paths of every JSON file in data/<folder> and its region subfolders. */
export function dataFiles(folder) {
	const dir = `data/${folder}`;
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? readdirSync(`${dir}/${e.name}`)
					.filter((f) => f.endsWith('.json'))
					.map((f) => `${dir}/${e.name}/${f}`)
			: e.name.endsWith('.json')
				? [`${dir}/${e.name}`]
				: []
	);
}

/** Every item in data/<folder>, parsed. */
export const loadAll = (folder) =>
	dataFiles(folder).map((f) => JSON.parse(readFileSync(f, 'utf8')));

// Same rule as src/lib/regions.ts (src/lib/regions.test.ts checks the two agree): inside the outline when a
// region has one (Washington's follows the Columbia River), otherwise inside its box.
function inOutline(outline, lat, lon) {
	let hit = false;
	for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
		const [xi, yi] = outline[i];
		const [xj, yj] = outline[j];
		if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
	}
	return hit;
}

/** The region a point is in, or undefined when outside them all. */
export const regionAt = (lat, lon) =>
	regions.find(
		({ bbox: [w, s, e, n], outline }) =>
			lon >= w && lat >= s && lon <= e && lat <= n && (!outline || inOutline(outline, lat, lon))
	);

/** Where a new file for this point goes, e.g. data/cameras/us-or/<id>.json (the folder is created if needed). */
export function fileFor(folder, id, lat, lon) {
	const region = regionAt(lat, lon);
	if (!region) throw new Error(`${lat}, ${lon} is outside every region in data/regions.json`);
	mkdirSync(`data/${folder}/${region.folder}`, { recursive: true });
	return `data/${folder}/${region.folder}/${id}.json`;
}
