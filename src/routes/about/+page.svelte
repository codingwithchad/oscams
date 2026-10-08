<script lang="ts">
	import { APP_NAME, REPO_URL, TAGLINE } from '../../lib/brand';
</script>

<svelte:head><title>About · {APP_NAME}</title></svelte:head>

<header class="top">
	<a class="brand" href="/">{APP_NAME}</a>
	<span class="top-title">About</span>
</header>

<main class="about">
	<h1>About {APP_NAME}</h1>
	<p class="lede-dark">{TAGLINE}</p>

	<h2>What it is</h2>
	<p>
		You enter a place, or a start and a finish, and it shows the public cameras, the weather and the
		waits along the way: snow on a mountain pass, the ferry line, the border, a commute home.
		Cameras appear in the order you'll pass them, with the forecast for when you'll get there.
	</p>

	<h2>Where the information comes from</h2>
	<ul>
		<li>
			Routes and place search: map data from <a
				href="https://www.openstreetmap.org/copyright"
				target="_blank"
				rel="noopener">OpenStreetMap contributors</a
			>, through the open-source
			<a href="https://project-osrm.org/" target="_blank" rel="noopener">OSRM</a> routing service and
			Nominatim and Photon (by Komoot), and Washington town and ZIP locations from the US Census Bureau.
			The app uses a route only as a line on the map to find the cameras along it; it doesn't give turn-by-turn
			directions.
		</li>
		<li>
			Cameras and road reports: the Washington State Department of Transportation (WSDOT), WSDOT
			Aviation and the National Park Service.
		</li>
		<li>
			Weather, rivers, tides and flights: the National Weather Service, NOAA, USGS and the FAA.
		</li>
		<li>
			Some cameras, such as ski areas and viewpoints, come through <a
				href="https://www.windy.com/"
				target="_blank"
				rel="noopener">Windy.com</a
			>, which is credited wherever they appear.
		</li>
	</ul>
	<p>
		We only show cameras their owners publish for public use. The full list, and the rule for adding
		more, is on
		<a href="{REPO_URL}/blob/main/docs/sources.md" target="_blank" rel="noopener"
			>the sources page</a
		>.
	</p>

	<h2>Your privacy</h2>
	<p>
		There are no accounts, no ads and no tracking. Your recent places and saved choices stay on your
		own phone. If you press "Use my location" or "Follow my trip", your location is used to find
		places and cameras near you and is not stored. Like any website, the host's server logs may
		briefly record ordinary request details.
	</p>

	<h2>Please note</h2>
	<p>
		This is an independent project and is <strong>not affiliated with WSDOT or any agency</strong>.
		Pictures can be late, frozen or missing, and road conditions change quickly. Always check the
		official source (for passes,
		<a href="https://wsdot.com/travel/real-time/mountainpasses" target="_blank" rel="noopener"
			>WSDOT's pass page</a
		>) before you travel, and don't use your phone while driving.
	</p>

	<h2>Who made it</h2>
	<p>
		One person, with voice dictation and <a
			href="https://claude.com/claude-code"
			target="_blank"
			rel="noopener">Claude Code</a
		>. It's open source (MIT license) and other people are welcome to help:
		<a href={REPO_URL} target="_blank" rel="noopener"
			>the code and a list of starter tasks are on GitHub</a
		>. Found a dead camera or a mistake?
		<a href="{REPO_URL}/issues/new/choose" target="_blank" rel="noopener">Tell us</a>.
	</p>
</main>
