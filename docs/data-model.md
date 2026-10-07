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
