import { distanceMiles } from '../geo';
import { regionAt } from '../regions';
import type { WeatherSource } from '../types';

/**
 * A National Weather Service forecast for any point in a covered US region, for places that have no forecast
 * source in data/weather-sources nearby. Lets a new region show forecasts before anyone adds data files for it.
 */
export function autoForecast(at: {
	lat: number;
	lon: number;
	label?: string;
}): WeatherSource | null {
	if (regionAt(at.lat, at.lon)?.country !== 'US') return null;
	const lat = at.lat.toFixed(4);
	const lon = at.lon.toFixed(4);
	return {
		id: `nws-auto-${lat}-${lon}`,
		name: `${at.label?.split(',')[0] ?? 'Local'} forecast`,
		lat: Number(lat),
		lon: Number(lon),
		kind: 'forecast',
		provider: 'nws',
		provider_ref: `${lat},${lon}`,
		source: 'National Weather Service',
		page_url: `https://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lon}`,
		status: 'approved',
		attribution_text: 'National Weather Service'
	};
}

/** The sources, plus an automatic forecast for the point when none of them is a forecast within `miles`. */
export function withForecast<T extends WeatherSource>(
	sources: T[],
	at: { lat: number; lon: number; label?: string },
	miles: number
): (T | WeatherSource)[] {
	const has = sources.some((s) => s.kind === 'forecast' && distanceMiles(s, at) <= miles);
	const auto = has ? null : autoForecast(at);
	return auto ? [auto, ...sources] : sources;
}
