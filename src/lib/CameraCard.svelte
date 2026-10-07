<script lang="ts">
	import HistoryPlayer from './HistoryPlayer.svelte';
	import { ago } from './format';
	import type { Camera, Nearby } from './types';

	let { camera, note }: { camera: Nearby<Camera>; note?: string } = $props();

	const refreshMs = $derived((camera.refresh_seconds ?? 120) * 1000);
	const isImage = $derived(camera.feed_type === 'image');
	const view = $derived(camera.view);
	let tick = $state(Date.now());
	let modified = $state<string | null>(null);
	let providerUrl = $state<string | null>(null);
	let dialog: HTMLDialogElement | undefined = $state();
	let opened = $state(false);
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
			: camera.max_width
				? `/img/${encodeURIComponent(camera.id)}?t=${Math.floor(tick / refreshMs)}&r=${retry}`
				: `${camera.feed_url}${camera.feed_url?.includes('?') ? '&' : '?'}t=${Math.floor(tick / refreshMs)}&r=${retry}`
	);
	const shownModified = $derived(modified ?? view?.modified ?? null);
	const age = $derived(shownModified ? ago(shownModified, tick) : null);
	const stale = $derived(
		shownModified ? tick - new Date(shownModified).getTime() > refreshMs * 5 : false
	);
</script>

<article class="card camera">
	{#if view}
		<a
			class="image-link"
			href={view.link}
			target="_blank"
			rel="noopener"
			aria-label="Open {camera.name} on Windy.com"
		>
			{#if failed}
				<span class="cam-down">Camera unavailable right now</span>
			{:else}
				<img
					src={imageSrc}
					alt={camera.name}
					loading="lazy"
					width={view.width}
					onerror={onFail}
					onload={onOk}
				/>
			{/if}
			{#if age}<span class="age" class:stale>{stale ? 'Stale · ' : ''}{age}</span>{/if}
		</a>
	{:else if isImage}
		<button
			class="image-button"
			onclick={() => {
				opened = true;
				dialog?.showModal();
			}}
			aria-label="Enlarge {camera.name}"
		>
			{#if failed}
				<span class="cam-down">Camera unavailable right now</span>
			{:else}
				<img src={imageSrc} alt={camera.name} loading="lazy" onerror={onFail} onload={onOk} />
			{/if}
			{#if age}<span class="age" class:stale>{stale ? 'Stale · ' : ''}{age}</span>{/if}
		</button>
	{:else}
		<video src={camera.feed_url} controls muted playsinline preload="none"></video>
	{/if}
	<div class="meta">
		<h3>{camera.name}</h3>
		<p class="sub">
			{note ?? `${camera.distance.toFixed(1)} mi`}{camera.location_precision === 'approximate'
				? ' (approx.)'
				: ''}
			· {camera.attribution_text ?? camera.source}
		</p>
	</div>
</article>

{#if isImage && !view}
	<dialog
		bind:this={dialog}
		class="lightbox"
		onclick={(e) => e.target === dialog && dialog?.close()}
	>
		<div class="lightbox-bar">
			<div>
				<strong>{camera.name}</strong>
				<span class="sub">
					{note ?? `${camera.distance.toFixed(1)} mi`} · {camera.attribution_text ?? camera.source}
					{#if age}· updated {age}{/if}
					· refreshes about every {Math.round(refreshMs / 60000) || 1} min
				</span>
			</div>
			<button class="secondary" onclick={() => dialog?.close()}>Close</button>
		</div>
		<img src={imageSrc} alt={camera.name} />
		{#if opened}<HistoryPlayer id={camera.id} />{/if}
		{#if camera.page_url}
			<p class="sub"><a href={camera.page_url} target="_blank" rel="noopener">Source page</a></p>
		{/if}
	</dialog>
{/if}
