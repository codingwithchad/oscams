<script lang="ts">
	import type { Camera, Nearby } from './types';

	let { camera }: { camera: Nearby<Camera> } = $props();

	const refreshMs = $derived((camera.refresh_seconds ?? 300) * 1000);
	let tick = $state(Date.now());

	$effect(() => {
		if (camera.feed_type !== 'image') return;
		const timer = setInterval(() => (tick = Date.now()), refreshMs);
		return () => clearInterval(timer);
	});

	const imageSrc = $derived(
		`${camera.feed_url}${camera.feed_url?.includes('?') ? '&' : '?'}t=${Math.floor(tick / refreshMs)}`
	);
</script>

<article class="card camera">
	{#if camera.feed_type === 'image'}
		<img src={imageSrc} alt={camera.name} loading="lazy" />
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
