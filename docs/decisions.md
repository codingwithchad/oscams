# Decisions

## 2026-10-07: Stack

- **Installable web app (PWA), mobile-first.** No app stores, shareable by link. Car integration (Android Auto / CarPlay) is a possible later add-on; camera images are not expected to be allowed on car screens while driving.
- **TypeScript everywhere, SvelteKit.** One language for pages and server code. Chosen for small, fast pages on weak mountain signal.
- **Single Node server (SvelteKit adapter-node).** Target is about 1,000 users on one small server. Camera and weather files are read into memory, and upstream fetches (WSDOT, NWS) are cached so load on providers stays low.
- **Files in git remain the source of truth** for cameras and weather sources (see data-model.md).
- **Secrets stay in environment variables**, never in the repo.

## 2026-10-07: Trip mode is the differentiator

Windy.com already offers a map of cameras, so OS Cams focuses on the drive: enter From and To, get the cameras (and conditions) along the road in the order you will pass them, stopping at the destination. "Follow my trip" uses the phone's location to hide cameras already passed and show the next one ahead.

- Route comes from the free OSRM demo server (cached). Replace with a paid or self-hosted router before heavy use.
- Corridor 1.5 mi either side of the road, 2 mi buffer past the destination, 2.5 mi radius around the destination for places like resorts that sit off the road.
- Follow mode needs the page open and the screen on (it asks for a screen wake lock). It is meant for passengers and pre-trip checks, not for a driver to study.

## 2026-10-07: Home page order and "Places"

Home order: Plan a drive, Ferries & border, Places, search, install help. The three Places shown are: places this device viewed recently first (kept in the phone's localStorage, no accounts), then the places most viewed by everyone (anonymous in-memory counters that reset when the server restarts). Remaining places are under "All places". Recent free-text searches show as small chips under the search box.

## 2026-10-07: Forecasts are for when you arrive

On a trip, each forecast source shows the hourly forecast for the time you will be there: the time you leave (Now, +1 h, +2 h, +3 h; `?in=` minutes) plus the driving time to that point along the route. Live station readings (temperature, wind, border waits, ferry space) stay "now". Search by place still shows the current forecast.

Other camera sources were investigated for US 2 (USGS HIVIS river cameras, AlertWest, third-party lists). Only the cameras already added are confirmed; USGS HIVIS (for example the Bolt Creek camera near Skykomish) is a lead but its data API was not worked out yet.

## 2026-10-07: One start card, and filling in drives

The home page opens with one card with two modes: "One place" (search, recent searches, use my location) and "A drive" (From/To plus popular drives). The chosen mode is remembered on the device.

Long drives (I-5 has a camera every half mile) show spaced-out key cameras by default, up to 40, always keeping cameras from other sources; "Show all" lists every one. Trip weather shows forecasts at both ends plus a few roadside stations, and ferry, border and airport reports only when the drive ends there.

Drives are filled in with `scripts/import-wsdot-route.mjs`, which adds every working WSDOT camera and reporting weather station within about 0.6 miles of the route (it downloads each picture first and skips dead ones). Current drives: Everett to Stevens Pass, Seattle, Bellevue; Seattle to Bellevue, Tacoma, Snoqualmie Pass.
