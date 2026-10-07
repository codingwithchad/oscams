import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Every file in data/ must match its schema, and the files must agree with each other. This is what
// makes a data-only pull request safe to review: if these pass, the data is well formed.

const root = process.cwd();
const FOLDERS: Record<string, string> = {
	cameras: 'camera',
	'weather-sources': 'weather-source',
	places: 'place',
	collections: 'collection',
	drives: 'drive',
	passes: 'pass'
};

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

const data: Record<string, { file: string; item: Record<string, any> }[]> = {};
for (const [folder, schemaName] of Object.entries(FOLDERS)) {
	const validate = ajv.compile(json(path.join(root, 'schema', `${schemaName}.schema.json`)));
	data[folder] = readdirSync(path.join(root, 'data', folder))
		.filter((f) => f.endsWith('.json'))
		.map((file) => ({ file, item: json(path.join(root, 'data', folder, file)) }));
	describe(`data/${folder}`, () => {
		it('every file matches its schema and is named after its id', () => {
			const problems: string[] = [];
			for (const { file, item } of data[folder]) {
				if (!validate(item)) problems.push(`${file}: ${ajv.errorsText(validate.errors)}`);
				if (item.id !== file.replace(/\.json$/, ''))
					problems.push(`${file}: id "${item.id}" must match the file name`);
			}
			expect(problems).toEqual([]);
		});
	});
}

describe('data agrees with itself', () => {
	const ids = (folder: string) => new Set(data[folder].map((d) => d.item.id as string));

	it('camera feed addresses are secure and unique', () => {
		const seen = new Map<string, string>();
		const problems: string[] = [];
		for (const { file, item } of data.cameras) {
			if (!item.feed_url) continue;
			if (!/^https:\/\//.test(item.feed_url)) problems.push(`${file}: feed_url must be https`);
			if (seen.has(item.feed_url))
				problems.push(`${file}: same feed as ${seen.get(item.feed_url)}`);
			seen.set(item.feed_url, file);
		}
		expect(problems).toEqual([]);
	});

	it('coordinates are in the Pacific Northwest (catches swapped latitude and longitude)', () => {
		const problems: string[] = [];
		for (const folder of ['cameras', 'weather-sources', 'places', 'passes']) {
			for (const { file, item } of data[folder]) {
				if (!(item.lat >= 41 && item.lat <= 49.5 && item.lon >= -125.5 && item.lon <= -116))
					problems.push(`${folder}/${file}: ${item.lat}, ${item.lon}`);
			}
		}
		expect(problems).toEqual([]);
	});

	it('references point at things that exist', () => {
		const problems: string[] = [];
		const places = ids('places');
		const collections = ids('collections');
		for (const { file, item } of data.places)
			if (item.collection && !collections.has(item.collection))
				problems.push(`places/${file}: unknown collection ${item.collection}`);
		for (const { file, item } of data.collections)
			for (const p of item.also ?? [])
				if (!places.has(p)) problems.push(`collections/${file}: unknown place ${p}`);
		for (const { file, item } of data.passes)
			if (!places.has(item.place)) problems.push(`passes/${file}: unknown place ${item.place}`);
		for (const { file, item } of data.drives)
			for (const end of [item.from, item.to])
				if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(end) && !places.has(end))
					problems.push(`drives/${file}: unknown place ${end}`);
		expect(problems).toEqual([]);
	});

	it('cameras that need a provider or are seasonal say so', () => {
		const problems: string[] = [];
		for (const { file, item } of data.cameras) {
			if (!item.feed_url && !item.provider && item.availability !== 'seasonal')
				problems.push(`cameras/${file}: needs feed_url, provider or seasonal availability`);
		}
		expect(problems).toEqual([]);
	});
});
