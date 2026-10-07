import { describe, expect, it } from 'vitest';
import { pickHeadlines } from './headlines';

const mk = (kind: string, id: string) => ({ kind, id });
const list = [
	mk('forecast', 'f1'),
	mk('river', 'r1'),
	mk('station', 's1'),
	mk('river', 'r2'),
	mk('forecast', 'f2'),
	mk('station', 's2')
];

describe('pickHeadlines', () => {
	it('shows everything when there are only a few', () => {
		expect(pickHeadlines(list.slice(0, 3), 'place')).toEqual({
			primary: list.slice(0, 3),
			more: []
		});
	});

	it('place: nearest forecast then nearest others, rest folded away', () => {
		const { primary, more } = pickHeadlines(list, 'place');
		expect(primary.map((i) => i.id)).toEqual(['f1', 'r1', 's1']);
		expect(more.map((i) => i.id)).toEqual(['r2', 'f2', 's2']);
	});

	it('trip: first and last forecast plus one report on the way, in driving order', () => {
		const { primary } = pickHeadlines(list, 'trip');
		expect(primary.map((i) => i.id)).toEqual(['f1', 'r1', 'f2']);
	});

	it('puts the ferry, airport or border report first when you are going there', () => {
		const items = [
			mk('forecast', 'f1'),
			mk('river', 'r1'),
			mk('station', 's1'),
			mk('airport', 'a1')
		];
		expect(pickHeadlines(items, 'place').primary.map((i) => i.id)).toEqual(['f1', 'r1', 'a1']);
	});
});
