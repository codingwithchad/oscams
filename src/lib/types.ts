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
	provider?: 'windy';
	provider_ref?: string;
	view?: ProviderView;
	feed_type: 'image' | 'video' | 'stream';
	embed_mode?: 'direct' | 'iframe' | 'proxy' | 'link';
	refresh_seconds?: number;
	description?: string;
	route?: string;
	milepost?: number;
}

export interface WeatherSource extends Located {
	kind: 'forecast' | 'station' | 'pass-conditions' | 'waves' | 'tides' | 'ferry' | 'border';
	provider?:
		'nws' | 'wsdot-weather' | 'wsdot-pass' | 'ndbc' | 'noaa-tides' | 'wsdot-ferry' | 'wsdot-border';
	provider_ref?: string;
	requires_key?: string;
	elevation_ft?: number;
}

export interface FeaturedPlace {
	id: string;
	name: string;
	region?: string;
	blurb?: string;
	lat: number;
	lon: number;
	radius_miles?: number;
	order?: number;
	collection?: string;
}

export interface Collection {
	id: string;
	name: string;
	blurb?: string;
	order?: number;
}

export interface Drive {
	id: string;
	name: string;
	blurb?: string;
	from: string;
	from_label?: string;
	to: string;
	order?: number;
}

export interface Place {
	lat: number;
	lon: number;
	label: string;
}

export type Nearby<T> = T & { distance: number };

/** Extra details for cameras whose picture link comes from a provider API at view time. */
export interface ProviderView {
	link: string;
	owner: string | null;
	modified: string | null;
	width: number;
}

export interface Conditions {
	id: string;
	name: string;
	kind: WeatherSource['kind'];
	source: string;
	attribution?: string;
	page_url?: string;
	distance: number;
	returns?: string;
	state: 'ok' | 'dormant' | 'error';
	note?: string;
	rows: { label: string; value: string }[];
}
