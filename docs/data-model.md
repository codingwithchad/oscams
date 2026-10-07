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
