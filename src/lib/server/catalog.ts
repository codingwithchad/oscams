import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Camera, Collection, Drive, FeaturedPlace, WeatherSource } from '../types';

function dataDir(): string {
	return process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
}

/** Read every JSON file in a data subfolder. Bad files are skipped with a warning. */
export function readFolder<T extends { id: string }>(folder: string): T[] {
	const dir = path.join(dataDir(), folder);
	let names: string[];
	try {
		names = readdirSync(dir).filter((n) => n.endsWith('.json'));
	} catch {
		return [];
	}
	const items: T[] = [];
	for (const name of names) {
		try {
			const item = JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as T;
			if (item.id !== name.replace(/\.json$/, '')) {
				console.warn(`[catalog] ${folder}/${name}: id does not match filename, skipped`);
				continue;
			}
			items.push(item);
		} catch (err) {
			console.warn(`[catalog] ${folder}/${name}: ${(err as Error).message}`);
		}
	}
	return items;
}

let cache: {
	cameras: Camera[];
	weather: WeatherSource[];
	places: FeaturedPlace[];
	collections: Collection[];
	drives: Drive[];
} | null = null;

/** Approved items only. Loaded once per server start. */
export function getCatalog() {
	if (!cache) {
		cache = {
			collections: readFolder<Collection>('collections').sort(
				(a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)
			),
			drives: readFolder<Drive>('drives').sort(
				(a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)
			),
			places: readFolder<FeaturedPlace>('places').sort(
				(a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)
			),
			cameras: readFolder<Camera & { status: string }>('cameras').filter(
				(c) => c.status === 'approved'
			),
			weather: readFolder<WeatherSource & { status: string }>('weather-sources').filter(
				(w) => w.status === 'approved'
			)
		};
	}
	return cache;
}
