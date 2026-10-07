<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let filter = $state('');

	const needle = $derived(filter.trim().toLowerCase());
	const shown = $derived(
		data.groups
			.map((g) => ({
				...g,
				places: g.places.filter(
					(p) => !needle || `${p.name} ${p.blurb}`.toLowerCase().includes(needle)
				)
			}))
			.filter((g) => g.places.length)
	);
</script>

<svelte:head><title>All places · OS Cams</title></svelte:head>

<header class="top">
	<a class="brand" href="/">OS Cams</a>
	<span class="top-title">All places</span>
</header>

<main>
	<h1>All places</h1>
	<input
		class="filter"
		type="search"
		bind:value={filter}
		placeholder="Filter {data.total} places"
		aria-label="Filter places"
	/>
	{#each shown as g (g.id)}
		<h2 class="section-title">{g.name}</h2>
		<ul class="place-list">
			{#each g.places as p (p.id)}
				<li>
					<a href="/search?place={encodeURIComponent(p.id)}">
						<span class="place-name">{p.name}</span>
						{#if p.blurb}<span class="place-sub">{p.blurb}</span>{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">
			Nothing matches “{filter}”. Try the search box on the home page for any town or zip.
		</p>
	{/each}
</main>
