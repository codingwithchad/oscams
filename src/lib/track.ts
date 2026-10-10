/**
 * Count a tap on the site's own visit counter (/stats). Sends only the name of what was tapped: no address typed,
 * no place, nothing about the person. Fire and forget; never blocks or breaks the page.
 */
export function track(name: string) {
	try {
		// Sent as JSON: other sites cannot send that to us without our permission, unlike a plain form post.
		navigator.sendBeacon?.(
			'/api/event',
			new Blob([JSON.stringify({ name })], { type: 'application/json' })
		);
	} catch {
		// counting is never worth an error
	}
}
