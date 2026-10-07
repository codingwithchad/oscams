# Camera data model

Cameras are data, never code. Adding or removing a camera never requires a code change.

Each camera is one JSON file in `data/cameras/`, named `<id>.json`, validated by `schema/camera.schema.json`.

| Field | Required | Notes |
|---|---|---|
| id | yes | Slug, matches filename |
| name | yes | |
| lat, lon | yes | Decimal degrees |
| feed_url | yes | The raw feed |
| feed_type | yes | `image`, `video`, or `stream` |
| source | yes | Operator, e.g. WSDOT |
| status | yes | `pending` or `approved` |
| created_at | yes | ISO 8601 |
| approved_by | if approved | |
| submitted_by | no | |
| page_url | no | Attribution link |
| refresh_seconds | no | For image feeds |

## Approval

The app only shows `approved` cameras. New submissions arrive as `pending`. Approval means changing `status` and setting `approved_by`.

Future submission paths (web form, GitHub PR) write this same format. Not built yet.

## Optional fields

`description`, `elevation_m`, `heading`, `route`, `milepost`, `embed_mode` (`direct`, `iframe`, `proxy`, `link`), `license_or_terms`, `attribution_text`, `tags`.

Tags are free-form labels such as `road`, `mountain`, `summit`, `surf`, `weather`. They are optional and only used for filtering.

## Locations are derived, not stored

A camera does not belong to an area. Search returns every approved camera within a radius of the searched point, so nearby places overlap naturally (a park and a beach next to it can share cameras). There is no `area` field.

## Not stored here

Live health data (last checked, is live) changes constantly and does not belong in git. It will live in a separate store later.

## Seasonal cameras

Some cameras are off for part of the year (ski resort cams in the off-season). Set `availability: seasonal` with `expected_return` (YYYY-MM) and a `seasonal_note`. `feed_url` is then optional, but `page_url` is required so we keep the link in the data.

The app should show these as a clearly labeled placeholder ("not broken, back in November"), not as an error and not as a bare link. When the feed is live, set `availability: live` and add `feed_url`.

`location_precision: approximate` marks coordinates that are a best guess (e.g. the base area) until exact positions are known.

## Weather sources

Conditions are data too. Each file in `data/weather-sources/` (schema: `schema/weather-source.schema.json`) points at one place to get conditions for a location: an NWS forecast, a WSDOT weather station, or WSDOT pass conditions. Search returns nearby weather sources the same way it returns nearby cameras.

The files only say where to look. The app fetches live values at view time. API keys are never stored: `requires_key` names an environment variable (e.g. `WSDOT_CODE`).

Same seasonal rule as cameras: if a source is quiet in the off-season, mark it `seasonal` and show a clear "not broken" placeholder.

NWAC avalanche-center stations (Brooks Chair, Tye Mill/Skyline, Grace Lakes, Berne) are a possible later addition. They publish readings only, no cameras, and we have not confirmed a usable API.
