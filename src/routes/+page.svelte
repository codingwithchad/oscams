<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import InstallHelp from '../lib/InstallHelp.svelte';
	import SearchBox from '../lib/SearchBox.svelte';

	let { data }: PageProps = $props();
	let locating = $state(false);
	let error = $state('');

	function useMyLocation() {
		error = '';
		if (!navigator.geolocation) {
			error = 'Location is not available on this device.';
			return;
		}
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				goto(`/search?q=${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`),
			() => {
				locating = false;
				error = 'Could not get your location.';
			},
			{ timeout: 10000 }
		);
	}
</script>

<svelte:head><title>OS Cams · Know before you go</title></svelte:head>

<header class="hero">
	<svg class="hero-mark" viewBox="0 0 64 64" aria-hidden="true">
		<rect x="6" y="18" width="52" height="34" rx="9" fill="currentColor" opacity="0.95" />
		<path d="M24 18l4-7h8l4 7z" fill="currentColor" />
		<circle cx="32" cy="35" r="11" fill="var(--hero-a)" />
		<circle cx="32" cy="35" r="7" fill="#5bb6e6" />
		<circle cx="32" cy="35" r="2.5" fill="#fff" />
	</svg>
	<h1>OS Cams</h1>
	<p class="tagline">Know before you go.</p>
	<p class="lede">Live public cameras and weather, gathered around the place you're headed.</p>
</header>

<main class="home">
	{#if data.places.length}
		<h2 class="section-title">Pick a place</h2>
		<nav class="places" aria-label="Available places">
			{#each data.places as place (place.id)}
				<a class="place" href="/search?place={encodeURIComponent(place.id)}">
					<span class="cover">
						{#if place.cover}
							<img src={place.cover.url} alt="" loading="lazy" />
						{/if}
						<span class="live"><i></i> Live</span>
					</span>
					<span class="place-body">
						<span class="place-name">{place.name}</span>
						<span class="place-sub">{[place.region, place.blurb].filter(Boolean).join(' · ')}</span>
						<span class="place-count">{place.liveCameras} live cameras</span>
					</span>
				</a>
			{/each}
		</nav>
	{/if}

	<h2 class="section-title">Somewhere else?</h2>
	<SearchBox />
	<button class="secondary wide" onclick={useMyLocation} disabled={locating}>
		{locating ? 'Finding you…' : 'Use my location'}
	</button>
	{#if error}<p class="error">{error}</p>{/if}
	<InstallHelp />
	<p class="hint">We're adding places. Search any town or zip to see what's nearby.</p>
</main>
