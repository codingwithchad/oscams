export type Availability = 'live' | 'seasonal';

interface Located {
	id: string;
	name: string;
	lat: number;
	lon: number;
	source: string;
	status: 'pending' | 'approved';
	availability?: Availability;
	expected_return?: string;
	seasonal_note?: string;
	page_url?: string;
	attribution_text?: string;
	location_precision?: 'exact' | 'approximate';
	tags?: string[];
}

export interface Camera extends Located {
	feed_url?: string;
	feed_type: 'image' | 'video' | 'stream';
	embed_mode?: 'direct' | 'iframe' | 'proxy' | 'link';
	refresh_seconds?: number;
	description?: string;
	route?: string;
	milepost?: number;
}

export interface WeatherSource extends Located {
	kind: 'forecast' | 'station' | 'pass-conditions';
	provider?: 'nws' | 'wsdot-weather' | 'wsdot-pass';
	provider_ref?: string;
	requires_key?: string;
	elevation_ft?: number;
}

export interface Place {
	lat: number;
	lon: number;
	label: string;
}

export type Nearby<T> = T & { distance: number };

export interface Conditions {
	id: string;
	name: string;
	kind: WeatherSource['kind'];
	source: string;
	attribution?: string;
	page_url?: string;
	distance: number;
	state: 'ok' | 'dormant' | 'error';
	note?: string;
	rows: { label: string; value: string }[];
}
