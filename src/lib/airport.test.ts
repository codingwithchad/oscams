import { describe, expect, it } from 'vitest';
import { faaRows, observationRows } from './airport';

const XML = `<AIRPORT_STATUS_INFORMATION>
<Delay_type><Name>Ground Stop Programs</Name><Ground_Stop_List><Program><ARPT>MIA</ARPT><Reason>thunderstorms</Reason><End_Time>5:00 pm EDT</End_Time></Program></Ground_Stop_List></Delay_type>
<Delay_type><Name>Ground Delay Programs</Name><Ground_Delay_List><Ground_Delay><ARPT>SEA</ARPT><Reason>low ceilings</Reason><Avg>35 minutes</Avg><Max>1 hour</Max></Ground_Delay></Ground_Delay_List></Delay_type>
<Delay_type><Name>General Arrival/Departure Delay Info</Name><Arrival_Departure_Delay_List><Delay><ARPT>SEA</ARPT><Reason>WX:Fog</Reason><Arrival_Departure Type="Departure"><Min>16 minutes</Min><Max>30 minutes</Max><Trend>Increasing</Trend></Arrival_Departure></Delay></Arrival_Departure_Delay_List></Delay_type>
<Delay_type><Name>Airport Closures</Name><Airport_Closure_List><Airport><ARPT>PAE</ARPT><Reason>!PAE 10/004 AD AP CLSD TO NON SKED TRANSIENT GA ACFT</Reason><Start>x</Start><Reopen>y</Reopen></Airport></Airport_Closure_List></Delay_type>
</AIRPORT_STATUS_INFORMATION>`;

describe('faaRows', () => {
	it('lists delays for the airport only', () => {
		expect(faaRows(XML, 'SEA')).toEqual([
			{ label: 'Ground delay', value: 'averaging 35 minutes up to 1 hour (low ceilings)' },
			{ label: 'Departure delays', value: '16 minutes to 30 minutes, increasing, (WX:Fog)' }
		]);
	});

	it('says none reported when the airport is not in the feed, and ignores general aviation closures', () => {
		expect(faaRows(XML, 'PAE')).toEqual([{ label: 'Delays', value: 'none reported by the FAA' }]);
	});
});

describe('observationRows', () => {
	it('converts a weather observation to US units', () => {
		const rows = observationRows({
			properties: {
				textDescription: 'Fog/Mist',
				temperature: { value: 11 },
				visibility: { value: 1207 },
				windSpeed: { value: 5.5 }
			}
		});
		expect(rows).toEqual([
			{ label: 'Sky', value: 'Fog/Mist' },
			{ label: 'Temperature', value: '52°F' },
			{ label: 'Visibility', value: '0.7 mi' },
			{ label: 'Wind', value: '3 mph' }
		]);
	});
});
