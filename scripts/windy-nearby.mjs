// List Windy webcams near a point so you can pick ones to add as camera files.
// Usage: node --env-file=.env scripts/windy-nearby.mjs <lat> <lon> [radius_km]
const [lat, lon, radius = '20'] = process.argv.slice(2);
if (!lat || !lon || !process.env.WINDY_API_KEY) {
	console.error(
		'Usage: node --env-file=.env scripts/windy-nearby.mjs <lat> <lon> [radius_km]  (needs WINDY_API_KEY)'
	);
	process.exit(1);
}
const res = await fetch(
	`https://api.windy.com/webcams/api/v3/webcams?nearby=${lat},${lon},${radius}&limit=50&include=location,urls`,
	{ headers: { 'x-windy-api-key': process.env.WINDY_API_KEY } }
);
if (!res.ok) throw new Error(`Windy returned ${res.status}`);
const { webcams } = await res.json();
for (const w of webcams) {
	const dup = /at MP|wsdot\.com/i.test(`${w.title} ${w.urls?.provider ?? ''}`)
		? '  (WSDOT duplicate)'
		: '';
	console.log(
		`${w.webcamId}\t${w.title}\t${w.location.latitude},${w.location.longitude}\t${w.urls?.provider ?? ''}${dup}`
	);
}
