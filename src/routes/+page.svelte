<script lang="ts">
	import { goto } from '$app/navigation';
	import SearchBox from '../lib/SearchBox.svelte';

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
	<SearchBox />
	<button class="secondary" onclick={useMyLocation} disabled={locating}>
		{locating ? 'Finding you…' : 'Use my location'}
	</button>
	{#if error}<p class="error">{error}</p>{/if}
	<p class="hint">Try a zip code, a town, a trailhead or a pass.</p>
</main>
