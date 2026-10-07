import { assets, immutable } from '$app/manifest';
import { self as sw } from '$app/service-worker';

// Offline strategy:
//  - App code and icons: cached at install, served cache-first.
//  - Pages (home, searches): network first, last good copy saved for when signal drops.
//  - Camera images: network first, last good image saved for when signal drops.
//  - /api: always network (the age label simply disappears offline).

const VERSION = 'v1';
const SHELL = `oscams-shell-${VERSION}-${immutable.length}`;
const PAGES = `oscams-pages-${VERSION}`;
const IMAGES = `oscams-images-${VERSION}`;
const MAX_PAGES = 40;
const MAX_IMAGES = 120;
const NETWORK_TIMEOUT_MS = 6000;

// Build paths come without a leading slash; make them absolute so they match request URLs.
const absolute = (p: string) => (p.startsWith('/') ? p : `/${p}`);

const shellPaths = [
	...immutable.map((a) => absolute(a.path)),
	...assets.map((a) => absolute(a.path)).filter((p) => /\.(png|svg|webmanifest)$/.test(p))
];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const shell = await caches.open(SHELL);
			await shell.addAll(shellPaths);
			// Save the home page so there is always something to open offline.
			try {
				const home = await fetch('/', { cache: 'no-cache' });
				if (home.ok) await (await caches.open(PAGES)).put('/', home);
			} catch {
				// installed while offline: home page gets saved on first visit
			}
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const name of await caches.keys()) {
				if (![SHELL, PAGES, IMAGES].includes(name)) await caches.delete(name);
			}
			await sw.clients.claim();
		})()
	);
});

async function trim(cacheName: string, max: number) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

function withTimeout(request: Request): Promise<Response> {
	return fetch(request, { signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) });
}

async function networkFirst(
	request: Request,
	cacheName: string,
	key: Request | string,
	max: number
) {
	const cache = await caches.open(cacheName);
	try {
		const response = await withTimeout(request);
		// opaque (cross-origin image) responses have status 0 and are still fine to keep
		if (response.ok || response.type === 'opaque') {
			await cache.put(key, response.clone());
			void trim(cacheName, max);
		}
		return response;
	} catch (err) {
		const saved = await cache.match(key);
		if (saved) return saved;
		throw err;
	}
}

const OFFLINE_PAGE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · OS Cams</title>
<body style="font:16px system-ui;padding:32px;max-width:480px;margin:auto">
<h1>You're offline</h1>
<p>This view hasn't been saved on your phone yet. Open it once with a connection and it will be here next time.</p>
<p><a href="/">Go to the home page</a></p>`;

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	if (url.origin === sw.location.origin) {
		if (url.pathname.startsWith('/api/')) return;

		if (shellPaths.includes(url.pathname)) {
			event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
			return;
		}

		if (request.mode === 'navigate') {
			event.respondWith(
				networkFirst(request, PAGES, request, MAX_PAGES).catch(async () => {
					const home = await caches.match('/');
					return (
						home ??
						new Response(OFFLINE_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } })
					);
				})
			);
		}
		return;
	}

	// Camera pictures from other sites. Ignore our cache-busting ?t= so one saved copy is reused.
	if (request.destination === 'image') {
		const clean = new URL(request.url);
		clean.searchParams.delete('t');
		event.respondWith(networkFirst(request, IMAGES, clean.toString(), MAX_IMAGES));
	}
});
