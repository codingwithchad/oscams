<script lang="ts">
	import { ago } from './format';
	import type { Camera, Nearby } from './types';

	let { camera }: { camera: Nearby<Camera> } = $props();

	const refreshMs = $derived((camera.refresh_seconds ?? 120) * 1000);
	const isImage = $derived(camera.feed_type === 'image');
	let tick = $state(Date.now());
	let modified = $state<string | null>(null);
	let dialog: HTMLDialogElement | undefined = $state();

	async function loadAge() {
		if (!isImage) return;
		try {
			const res = await fetch(`/api/cameras/${encodeURIComponent(camera.id)}/age`);
			if (res.ok) modified = (await res.json()).modified;
		} catch {
			// age is a nice-to-have; ignore failures
		}
	}

	$effect(() => {
		if (!isImage) return;
		loadAge();
		const timer = setInterval(() => {
			tick = Date.now();
			loadAge();
		}, refreshMs);
		return () => clearInterval(timer);
	});

	const imageSrc = $derived(
		`${camera.feed_url}${camera.feed_url?.includes('?') ? '&' : '?'}t=${Math.floor(tick / refreshMs)}`
	);
	const age = $derived(modified ? ago(modified, tick) : null);
	const stale = $derived(modified ? tick - new Date(modified).getTime() > refreshMs * 5 : false);
</script>

<article class="card camera">
	{#if isImage}
		<button
			class="image-button"
			onclick={() => dialog?.showModal()}
			aria-label="Enlarge {camera.name}"
		>
			<img src={imageSrc} alt={camera.name} loading="lazy" />
			{#if age}<span class="age" class:stale>{stale ? 'Stale · ' : ''}{age}</span>{/if}
		</button>
	{:else}
		<video src={camera.feed_url} controls muted playsinline preload="none"></video>
	{/if}
	<div class="meta">
		<h3>{camera.name}</h3>
		<p class="sub">
			{camera.distance.toFixed(1)} mi{camera.location_precision === 'approximate'
				? ' (approx.)'
				: ''}
			· {camera.attribution_text ?? camera.source}
		</p>
	</div>
</article>

{#if isImage}
	<dialog
		bind:this={dialog}
		class="lightbox"
		onclick={(e) => e.target === dialog && dialog?.close()}
	>
		<div class="lightbox-bar">
			<div>
				<strong>{camera.name}</strong>
				<span class="sub">
					{camera.distance.toFixed(1)} mi · {camera.attribution_text ?? camera.source}
					{#if age}· updated {age}{/if}
					· refreshes about every {Math.round(refreshMs / 60000) || 1} min
				</span>
			</div>
			<button class="secondary" onclick={() => dialog?.close()}>Close</button>
		</div>
		<img src={imageSrc} alt={camera.name} />
		{#if camera.page_url}
			<p class="sub"><a href={camera.page_url} target="_blank" rel="noopener">Source page</a></p>
		{/if}
	</dialog>
{/if}
