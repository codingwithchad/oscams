import { isDormant } from '../geo';
import type { Conditions, Nearby, WeatherSource } from '../types';
import { cached } from './cache';

const USER_AGENT = 'oscams (https://github.com/codingwithchad/oscams)';
const TEN_MINUTES = 10 * 60 * 1000;
const WSDOT = 'https://wsdot.wa.gov/Traffic/api';

type Row = { label: string; value: string };

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
	const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
	if (!res.ok) throw new Error(`upstream ${res.status}`);
	return (await res.json()) as T;
}

const show = (v: unknown, unit = '') =>
	v === null || v === undefined || v === '' ? null : `${v}${unit}`;

function compact(rows: [string, string | null][]): Row[] {
	return rows
		.filter((r): r is [string, string] => r[1] !== null)
		.map(([label, value]) => ({ label, value }));
}

async function fetchNws(src: WeatherSource): Promise<Row[]> {
	const ref = (src.provider_ref ?? `${src.lat},${src.lon}`).replace(/\s/g, '');
	const headers = { 'User-Agent': USER_AGENT, Accept: 'application/geo+json' };
	const point = await getJson<{ properties: { forecast: string } }>(
		`https://api.weather.gov/points/${ref}`,
		headers
	);
	const forecast = await getJson<{
		properties: {
			periods: {
				name: string;
				temperature: number;
				temperatureUnit: string;
				windSpeed: string;
				windDirection: string;
				shortForecast: string;
			}[];
		};
	}>(point.properties.forecast, headers);
	return forecast.properties.periods.slice(0, 3).map((p) => ({
		label: p.name,
		value: `${p.temperature}°${p.temperatureUnit}, ${p.shortForecast}, wind ${p.windDirection} ${p.windSpeed}`
	}));
}

function wsdotKey(src: WeatherSource): string {
	const name = src.requires_key ?? 'WSDOT_CODE';
	const key = process.env[name];
	if (!key) throw new Error(`${name} is not set`);
	return key;
}

async function fetchWsdotPass(src: WeatherSource): Promise<Row[]> {
	const key = encodeURIComponent(wsdotKey(src));
	const p = await getJson<{
		RoadCondition?: string;
		WeatherCondition?: string;
		TemperatureInFahrenheit?: number | null;
		TravelAdvisoryActive?: boolean;
		RestrictionOne?: { TravelDirection: string; RestrictionText: string };
		RestrictionTwo?: { TravelDirection: string; RestrictionText: string };
	}>(
		`${WSDOT}/MountainPassConditions/MountainPassConditionsREST.svc/GetMountainPassConditionAsJson?AccessCode=${key}&PassConditionID=${encodeURIComponent(src.provider_ref ?? '')}`
	);
	return compact([
		['Road', show(p.RoadCondition)],
		['Weather', show(p.WeatherCondition)],
		['Temperature', show(p.TemperatureInFahrenheit, '°F')],
		[p.RestrictionOne?.TravelDirection ?? 'Restriction', show(p.RestrictionOne?.RestrictionText)],
		[p.RestrictionTwo?.TravelDirection ?? 'Restriction', show(p.RestrictionTwo?.RestrictionText)],
		['Travel advisory', p.TravelAdvisoryActive ? 'Active' : null]
	]);
}

async function fetchWsdotStation(src: WeatherSource): Promise<Row[]> {
	const key = encodeURIComponent(wsdotKey(src));
	const w = await getJson<{
		TemperatureInFahrenheit?: number | null;
		WindSpeedInMPH?: number | null;
		WindGustSpeedInMPH?: number | null;
		WindDirectionCardinal?: string | null;
		RelativeHumidity?: number | null;
		PrecipitationInInches?: number | null;
		Visibility?: number | null;
		SkyCoverage?: string | null;
	}>(
		`${WSDOT}/WeatherInformation/WeatherInformationREST.svc/GetCurrentWeatherInformationByStationIDAsJson?AccessCode=${key}&StationID=${encodeURIComponent(src.provider_ref ?? '')}`
	);
	return compact([
		['Temperature', show(w.TemperatureInFahrenheit, '°F')],
		['Wind', show(w.WindSpeedInMPH, ` mph ${w.WindDirectionCardinal ?? ''}`.trimEnd())],
		['Gusts', show(w.WindGustSpeedInMPH, ' mph')],
		['Humidity', show(w.RelativeHumidity, '%')],
		['Precipitation', show(w.PrecipitationInInches, ' in')],
		['Visibility', show(w.Visibility, ' mi')],
		['Sky', show(w.SkyCoverage === 'N/A' ? null : w.SkyCoverage)]
	]);
}

const adapters: Record<
	NonNullable<WeatherSource['provider']>,
	(s: WeatherSource) => Promise<Row[]>
> = {
	nws: fetchNws,
	'wsdot-pass': fetchWsdotPass,
	'wsdot-weather': fetchWsdotStation
};

/** Fetch live values for one source. Never throws: problems come back as state "error". */
export async function getConditions(src: Nearby<WeatherSource>): Promise<Conditions> {
	const base = {
		id: src.id,
		name: src.name,
		kind: src.kind,
		source: src.source,
		attribution: src.attribution_text,
		page_url: src.page_url,
		distance: src.distance,
		returns: src.expected_return
	};
	if (isDormant(src)) return { ...base, state: 'dormant', note: src.seasonal_note, rows: [] };
	const adapter = src.provider ? adapters[src.provider] : undefined;
	if (!adapter)
		return { ...base, state: 'error', note: 'No way to fetch this source yet.', rows: [] };
	try {
		const rows = await cached(`wx:${src.id}`, TEN_MINUTES, () => adapter(src));
		if (!rows.length)
			return {
				...base,
				state: 'dormant',
				note: src.seasonal_note ?? 'No current readings.',
				rows: []
			};
		return { ...base, state: 'ok', rows };
	} catch (err) {
		console.warn(`[conditions] ${src.id}: ${(err as Error).message}`);
		return { ...base, state: 'error', note: 'Could not load right now. Try again soon.', rows: [] };
	}
}
