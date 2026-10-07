<script lang="ts">
	import CollectionIcon from '../lib/CollectionIcon.svelte';
	import InstallHelp from '../lib/InstallHelp.svelte';
	import StartCard from '../lib/StartCard.svelte';
	import { loadRecents, type Recent } from '../lib/recents';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let recents = $state<Recent[]>([]);

	$effect(() => {
		recents = loadRecents();
	});

	const SHOWN = 3;
	const byId = $derived(new Map(data.places.map((p) => [p.id, p])));

	// Places this person looked at recently come first, then whatever is most viewed by everyone.
	const shown = $derived.by(() => {
		const ids: string[] = [];
		for (const r of recents)
			if (r.kind === 'place' && byId.has(r.id) && !ids.includes(r.id)) ids.push(r.id);
		for (const id of data.popular) if (!ids.includes(id)) ids.push(id);
		return ids.slice(0, SHOWN).map((id) => byId.get(id)!);
	});
	const more = $derived(
		data.popular.filter((id) => !shown.some((s) => s.id === id)).map((id) => byId.get(id)!)
	);
	const searches = $derived(
		recents.filter((r): r is Extract<Recent, { kind: 'search' }> => r.kind === 'search').slice(0, 4)
	);
	const chips = $derived(
		data.places.filter((p) => !p.collection).map((p) => ({ id: p.id, name: p.name }))
	);
</script>

<svelte:head><title>OS Cams · Live views along your way</title></svelte:head>

<header class="hero">
	<svg class="hero-mark" viewBox="0 0 64 64" aria-hidden="true">
		<rect x="6" y="18" width="52" height="34" rx="9" fill="currentColor" opacity="0.95" />
		<path d="M24 18l4-7h8l4 7z" fill="currentColor" />
		<circle cx="32" cy="35" r="11" fill="var(--hero-a)" />
		<circle cx="32" cy="35" r="7" fill="#5bb6e6" />
		<circle cx="32" cy="35" r="2.5" fill="#fff" />
	</svg>
	<div class="hero-text">
		<h1>OS Cams</h1>
		<p class="tagline">Live views along your way.</p>
	</div>
</header>

<main class="home">
	<StartCard
		{chips}
		drives={data.drives}
		searches={searches.map((x) => ({ q: x.q, label: x.label }))}
	/>

	{#if data.collections.length}
		<h2 class="section-title">Browse</h2>
		<nav class="collections" aria-label="Browse by type">
			{#each data.collections as c (c.id)}
				<a
					class="collection"
					href={c.id === 'passes' ? '/passes' : `/collections/${encodeURIComponent(c.id)}`}
					title={c.blurb}
				>
					<CollectionIcon name={c.icon} />
					<span class="collection-name">{c.name}</span>
					<span class="collection-count">{c.places} places</span>
				</a>
			{/each}
			<a class="collection utility" href="/places">
				<CollectionIcon name="list" />
				<span class="collection-name">All places</span>
				<span class="collection-count">{data.places.length} to explore</span>
			</a>
			<a class="collection utility" href="/nearby">
				<CollectionIcon name="pin" />
				<span class="collection-name">Near me</span>
				<span class="collection-count">closest places</span>
			</a>
		</nav>
	{/if}

	{#if shown.length}
		<h2 class="section-title">Places</h2>
		<nav class="places" aria-label="Places">
			{#each shown as place (place.id)}
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
		{#if more.length}
			<details class="more-places">
				<summary>All places ({more.length} more)</summary>
				<ul>
					{#each more as place (place.id)}
						<li><a href="/search?place={encodeURIComponent(place.id)}">{place.name}</a></li>
					{/each}
				</ul>
			</details>
		{/if}
	{/if}

	<InstallHelp />
	<p class="hint">We're adding places. Search any town or zip to see what's nearby.</p>
</main>
