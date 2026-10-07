<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
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

<svelte:head><title>OS Cams</title></svelte:head>

<main class="home">
	<h1>OS Cams</h1>
	<p class="lede">Every public camera and weather report near where you're going, in one place.</p>
	{#if data.places.length}
		<nav class="places" aria-label="Available places">
			{#each data.places as place (place.id)}
				<a class="place" href="/search?place={encodeURIComponent(place.id)}">
					<span class="place-name">{place.name}</span>
					<span class="place-sub">
						{[place.region, place.blurb].filter(Boolean).join(' · ')}
					</span>
					<span class="place-count">{place.liveCameras} live cameras</span>
				</a>
			{/each}
		</nav>
		<p class="or">Somewhere else?</p>
	{/if}
	<SearchBox />
	<button class="secondary" onclick={useMyLocation} disabled={locating}>
		{locating ? 'Finding you…' : 'Use my location'}
	</button>
	{#if error}<p class="error">{error}</p>{/if}
	<p class="hint">We're adding places. Search any town or zip to see what's nearby.</p>
</main>
