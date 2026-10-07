<script lang="ts">
	import CameraCard from '../../lib/CameraCard.svelte';
	import ConditionsBar from '../../lib/ConditionsBar.svelte';
	import OfflineCameras from '../../lib/OfflineCameras.svelte';
	import SearchBox from '../../lib/SearchBox.svelte';
	import { rememberPlace } from '../../lib/lastPlace';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	$effect(() => {
		if (data.place) rememberPlace(location.pathname + location.search);
	});
	const radii = [10, 25, 50, 75];
	const base = $derived(
		data.placeId
			? `/search?place=${encodeURIComponent(data.placeId)}`
			: `/search?q=${encodeURIComponent(data.q)}`
	);
</script>

<svelte:head>
	<title>{data.place ? `${data.place.label} · OS Cams` : 'Search · OS Cams'}</title>
</svelte:head>

<header class="top">
	<a class="brand" href="/">OS Cams</a>
	<SearchBox value={data.placeId ? '' : data.q} />
</header>

<main>
	{#if !data.q}
		<p class="empty">Enter a location to see what's nearby.</p>
	{:else if data.failed}
		<p class="empty">The location search is not responding. Try again in a moment.</p>
	{:else if !data.place}
		<p class="empty">Couldn't find “{data.q}”. Try a zip code or a town name.</p>
	{:else}
		<section class="summary">
			<h1>{data.place.label}</h1>
			<nav class="radius" aria-label="Search radius">
				{#each radii as r (r)}
					<a href="{base}&r={r}" aria-current={r === data.radius ? 'true' : undefined}>{r} mi</a>
				{/each}
			</nav>
		</section>

		{#await data.conditions}
			<p class="loading">Loading conditions…</p>
		{:then conditions}
			<ConditionsBar {conditions} />
		{/await}

		{#if data.cameras.length}
			<div class="grid">
				{#each data.cameras as camera (camera.id)}<CameraCard {camera} />{/each}
			</div>
		{:else}
			<p class="empty">No live cameras within {data.radius} miles. Try a larger radius.</p>
		{/if}

		<OfflineCameras cameras={data.offline} />
	{/if}
</main>
