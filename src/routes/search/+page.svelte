<script lang="ts">
	import CameraCard from '../../lib/CameraCard.svelte';
	import ConditionsCard from '../../lib/ConditionsCard.svelte';
	import SearchBox from '../../lib/SearchBox.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const radii = [10, 25, 50, 75];
</script>

<svelte:head>
	<title>{data.place ? `${data.place.label} · OS Cams` : 'Search · OS Cams'}</title>
</svelte:head>

<header class="top">
	<a class="brand" href="/">OS Cams</a>
	<SearchBox value={data.q} />
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
					<a
						href="/search?q={encodeURIComponent(data.q)}&r={r}"
						aria-current={r === data.radius ? 'true' : undefined}
					>
						{r} mi
					</a>
				{/each}
			</nav>
		</section>

		<section>
			<h2>Weather &amp; roads</h2>
			{#await data.conditions}
				<p class="loading">Loading current conditions…</p>
			{:then conditions}
				{#if conditions.length}
					<div class="grid">
						{#each conditions as c (c.id)}<ConditionsCard {c} />{/each}
					</div>
				{:else}
					<p class="empty">No weather sources within {data.radius} miles yet.</p>
				{/if}
			{/await}
		</section>

		<section>
			<h2>Cameras</h2>
			{#if data.cameras.length}
				<div class="grid">
					{#each data.cameras as camera (camera.id)}<CameraCard {camera} />{/each}
				</div>
			{:else}
				<p class="empty">No cameras within {data.radius} miles yet. Try a larger radius.</p>
			{/if}
		</section>
	{/if}
</main>
