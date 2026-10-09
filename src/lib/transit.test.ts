import { describe, expect, it } from 'vitest';
import {
	borderGlance,
	borderRows,
	ferryGlance,
	ferryRows,
	nextSailingGlance,
	parseDotNetDate
} from './transit';

describe('transit', () => {
	it('reads WSDOT dates', () => {
		expect(parseDotNetDate('/Date(1791401400000-0700)/')).toBe(1791401400000);
		expect(parseDotNetDate('nope')).toBeNull();
	});

	it('lists upcoming sailings with drive-up space and skips past ones', () => {
		const space = {
			DepartingSpaces: [
				{
					Departure: '/Date(1000-0700)/',
					SpaceForArrivalTerminals: [
						{ TerminalName: 'Clinton', DisplayDriveUpSpace: true, DriveUpSpaceCount: 5 }
					]
				},
				{
					Departure: '/Date(1791401400000-0700)/',
					SpaceForArrivalTerminals: [
						{ TerminalName: 'Clinton', DisplayDriveUpSpace: true, DriveUpSpaceCount: 82 }
					]
				},
				{
					Departure: '/Date(1791402600000-0700)/',
					IsCancelled: true,
					SpaceForArrivalTerminals: [{ TerminalName: 'Clinton' }]
				}
			]
		};
		expect(ferryRows(space, 1791400000000)).toEqual([
			{ label: '12:30 PM', value: 'to Clinton · 82 drive-up spaces' },
			{ label: '12:50 PM', value: 'to Clinton · cancelled' }
		]);
	});

	it('handles reservation-only routes', () => {
		const space = {
			DepartingSpaces: [
				{
					Departure: '/Date(1791401400000-0700)/',
					SpaceForArrivalTerminals: [
						{
							TerminalName: 'Lopez -> Anacortes',
							DisplayDriveUpSpace: true,
							DriveUpSpaceCount: 9,
							DisplayReservableSpace: true,
							ReservableSpaceCount: null
						}
					]
				}
			]
		};
		expect(ferryRows(space, 0)[0].value).toBe('to Lopez · 9 drive-up spaces');
	});

	it('labels border lanes and handles missing data', () => {
		const readings = [
			{ CrossingName: 'I5', WaitTime: 5 },
			{ CrossingName: 'I5Nexus', WaitTime: 0 },
			{ CrossingName: 'SR543Trucks', WaitTime: -1 }
		];
		expect(borderRows(readings, ['I5', 'I5Nexus', 'SR543Trucks', 'missing'])).toEqual([
			{ label: 'General', value: '5 min' },
			{ label: 'NEXUS', value: 'no wait' },
			{ label: 'Trucks', value: 'no data' }
		]);
	});

	describe('at a glance', () => {
		const T = 1791401400000; // 12:30 PM Pacific
		const sailing = (minutes: number, spaces: number | null) => ({
			Departure: `/Date(${T + minutes * 60_000}-0700)/`,
			SpaceForArrivalTerminals: [
				{
					TerminalName: 'Kingston',
					DisplayDriveUpSpace: spaces !== null,
					DriveUpSpaceCount: spaces
				}
			]
		});

		it('shows the next sailing and its space when there is room', () => {
			expect(ferryGlance({ DepartingSpaces: [sailing(10, 80)] }, T)).toEqual({
				text: 'Next sailing 12:40 PM · 80 drive-up spaces',
				tone: 'ok'
			});
			expect(ferryGlance({ DepartingSpaces: [sailing(10, 6)] }, T)?.tone).toBe('busy');
		});

		it('turns full boats into a boat wait', () => {
			const space = { DepartingSpaces: [sailing(10, 0), sailing(50, 0), sailing(90, 30)] };
			expect(ferryGlance(space, T)).toEqual({
				text: 'Next 2 boats full · space on the 2:00 PM',
				tone: 'full'
			});
			expect(ferryGlance({ DepartingSpaces: [sailing(10, 0), sailing(50, 4)] }, T)?.text).toBe(
				'Next boat full · space on the 1:20 PM'
			);
		});

		it('says when every listed sailing is full, and skips past sailings', () => {
			const space = { DepartingSpaces: [sailing(-30, 50), sailing(10, 0), sailing(50, 0)] };
			expect(ferryGlance(space, T)?.text).toBe('Next 2 sailings full for drive-up cars');
			expect(ferryGlance({ DepartingSpaces: [] }, T)).toBeNull();
		});

		it('summarises the border car and NEXUS lanes', () => {
			const readings = [
				{ CrossingName: 'I5', WaitTime: 35 },
				{ CrossingName: 'I5Nexus', WaitTime: 0 },
				{ CrossingName: 'I5Trucks', WaitTime: 90 }
			];
			expect(borderGlance(readings, ['I5', 'I5Nexus', 'I5Trucks'])).toEqual({
				text: 'Into the US: Cars 35 min · NEXUS no wait',
				tone: 'busy'
			});
			expect(borderGlance([{ CrossingName: 'I5', WaitTime: -1 }], ['I5'])?.tone).toBe('info');
			expect(borderGlance([], ['I5'])).toBeNull();
		});

		it('falls back to the next scheduled sailing when WSF has no space count', () => {
			const at = (m: number) => ({ DepartingTime: `/Date(${T + m * 60_000}-0700)/` });
			const combos = [
				{ ArrivingTerminalName: 'Vashon Island', Times: [at(-5), at(25)] },
				{ ArrivingTerminalName: 'Southworth', Times: [at(15)] }
			];
			expect(nextSailingGlance(combos, T)).toEqual({
				text: 'Next sailing 12:45 PM to Southworth · no space count',
				tone: 'info'
			});
			expect(nextSailingGlance([combos[0]], T)?.text).toBe(
				'Next sailing 12:55 PM · no space count'
			);
		});
	});
});
