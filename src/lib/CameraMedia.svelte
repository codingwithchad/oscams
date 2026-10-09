<script lang="ts">
	import { ago } from './format';
	import type { Camera } from './types';

	// The picture or live player for one camera, kept fresh. Used by the camera cards and by the full-screen viewer.
	// `onopen` makes a still picture tappable (to open the viewer); `large` shows it as big as the screen allows.
	let {
		camera,
		onopen,
		large = false
	}: { camera: Camera; onopen?: () => void; large?: boolean } = $props();

	const refreshMs = $derived((camera.refresh_seconds ?? 120) * 1000);
	const isImage = $derived(camera.feed_type === 'image');
	const view = $derived(camera.view);
	let tick = $state(Date.now());
	let modified = $state<string | null>(null);
	let providerUrl = $state<string | null>(null);
	let watching = $state(false);
	// A picture that fails to load gets one retry, then a clear "unavailable" tile until the next refresh.
	let retry = $state(0);
	let failed = $state(false);

	function onFail() {
		if (retry < 1 && !view) setTimeout(() => retry++, 1500);
		else failed = true;
	}
	function onOk() {
		failed = false;
	}

	async function loadAge() {
		if (!isImage) return;
		try {
			const res = await fetch(`/api/cameras/${encodeURIComponent(camera.id)}/age`);
			if (res.ok) {
				const body = await res.json();
				modified = body.modified;
				providerUrl = body.url;
			}
		} catch {
			// age is a nice-to-have; ignore failures
		}
	}

	$effect(() => {
		if (!isImage) return;
		loadAge();
		const timer = setInterval(() => {
			tick = Date.now();
			retry = 0;
			failed = false;
			loadAge();
		}, refreshMs);
		return () => clearInterval(timer);
	});

	// Provider pictures must be used exactly as the provider gave them, so no cache-busting parameter.
	const imageSrc = $derived(
		view
			? (providerUrl ?? camera.feed_url)
			: camera.max_width || camera.mirror
				? `/img/${encodeURIComponent(camera.id)}?t=${Math.floor(tick / refreshMs)}&r=${retry}`
				: `${camera.feed_url}${camera.feed_url?.includes('?') ? '&' : '?'}t=${Math.floor(tick / refreshMs)}&r=${retry}`
	);
	const shownModified = $derived(modified ?? view?.modified ?? null);
	const age = $derived(shownModified ? ago(shownModified, tick) : null);
	const stale = $derived(
		shownModified ? tick - new Date(shownModified).getTime() > refreshMs * 5 : false
	);
</script>

{#snippet picture(lazy: boolean)}
	{#if failed}
		<span class="cam-down">Camera unavailable right now</span>
	{:else}
		<img
			src={imageSrc}
			alt={camera.name}
			loading={lazy ? 'lazy' : 'eager'}
			width={view?.width}
			onerror={onFail}
			onload={onOk}
		/>
	{/if}
	{#if age}<span class="age" class:stale>{stale ? 'Stale · ' : ''}{age}</span>{/if}
{/snippet}

{#if view}
	<!-- Windy pictures are never enlarged and always link back to Windy. -->
	<a
		class="image-link"
		href={view.link}
		target="_blank"
		rel="noopener"
		aria-label="Open {camera.name} on Windy.com"
	>
		{@render picture(!large)}
	</a>
{:else if isImage && onopen}
	<button class="image-button" onclick={onopen} aria-label="View {camera.name} full screen">
		{@render picture(true)}
	</button>
{:else if isImage}
	<div class="image-button" class:large>{@render picture(false)}</div>
{:else if camera.embed_mode === 'iframe'}
	<!-- A live YouTube video loads only after a tap, so nothing from YouTube runs until someone asks for it. -->
	{#if watching}
		<iframe
			class="live-embed"
			src="{camera.feed_url}{camera.feed_url?.includes('?') ? '&' : '?'}autoplay=1&mute=1&rel=0"
			title={camera.name}
			allow="autoplay; picture-in-picture; fullscreen"
			referrerpolicy="strict-origin-when-cross-origin"
			allowfullscreen
		></iframe>
	{:else}
		<button class="live-play" onclick={() => (watching = true)}>
			<span class="live-badge"><i></i> Live</span>
			<span class="play-icon" aria-hidden="true"></span>
			Watch live
			<small>Plays from YouTube</small>
		</button>
	{/if}
{:else}
	<video src={camera.feed_url} controls muted playsinline preload="none"></video>
{/if}
