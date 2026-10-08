<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let filter = $state('');
	// What the visitor has opened by hand. While filtering, matching groups open on their own.
	let opened = $state<Record<string, boolean>>({});

	const needle = $derived(filter.trim().toLowerCase());
	const regions = $derived(
		data.regions
			.map((r) => {
				const groups = r.groups
					.map((g) => ({
						...g,
						places: g.places.filter(
							(p) => !needle || `${p.name} ${p.blurb}`.toLowerCase().includes(needle)
						)
					}))
					.filter((g) => g.places.length);
				return {
					...r,
					groups,
					count: new Set(groups.flatMap((g) => g.places.map((p) => p.id))).size
				};
			})
			.filter((r) => r.groups.length)
	);

	// With a single state the state starts open (one less tap); the kinds of place always start closed.
	const regionOpen = (name: string) =>
		needle ? true : (opened[`r:${name}`] ?? data.regions.length === 1);
	const groupOpen = (key: string) => (needle ? true : (opened[key] ?? false));
	const remember = (key: string) => (e: Event) => {
		if (!needle) opened[key] = (e.currentTarget as HTMLDetailsElement).open;
	};
</script>

<svelte:head><title>All places · What's Up Ahead</title></svelte:head>

<header class="top">
	<a class="brand" href="/">What's Up Ahead</a>
	<span class="top-title">All places</span>
</header>

<main>
	<h1>All places</h1>
	<input
		class="filter"
		type="search"
		bind:value={filter}
		placeholder="Search {data.total} places"
		aria-label="Search places"
	/>

	{#each regions as r (r.name)}
		<details class="tree-region" open={regionOpen(r.name)} ontoggle={remember(`r:${r.name}`)}>
			<summary>
				<span class="tree-name">{r.name}</span>
				<span class="tree-count">{r.count} {r.count === 1 ? 'place' : 'places'}</span>
			</summary>
			{#each r.groups as g (g.id)}
				<details
					class="tree-group"
					open={groupOpen(`${r.name}:${g.id}`)}
					ontoggle={remember(`${r.name}:${g.id}`)}
				>
					<summary>
						<span class="tree-name">{g.name}</span>
						<span class="tree-count">{g.places.length}</span>
					</summary>
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
				</details>
			{/each}
		</details>
	{:else}
		<p class="empty">
			Nothing matches “{filter}”. Try the search box on the home page for any town or zip.
		</p>
	{/each}
</main>
