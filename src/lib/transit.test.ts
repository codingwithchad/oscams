import { describe, expect, it } from 'vitest';
import { borderRows, ferryRows, parseDotNetDate } from './transit';

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
});
