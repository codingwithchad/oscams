<script lang="ts">
	import { isDormant } from './geo';
	import type { Camera, Nearby } from './types';

	let { camera }: { camera: Nearby<Camera> } = $props();

	const dormant = $derived(isDormant(camera) || !camera.feed_url);
	const refreshMs = $derived((camera.refresh_seconds ?? 300) * 1000);
	let tick = $state(Date.now());

	$effect(() => {
		if (dormant || camera.feed_type !== 'image') return;
		const timer = setInterval(() => (tick = Date.now()), refreshMs);
		return () => clearInterval(timer);
	});

	const returns = $derived(
		camera.expected_return
			? new Date(`${camera.expected_return.slice(0, 7)}-01T12:00:00Z`).toLocaleDateString('en-US', {
					month: 'long',
					year: 'numeric',
					timeZone: 'UTC'
				})
			: null
	);
	const imageSrc = $derived(
		`${camera.feed_url}${camera.feed_url?.includes('?') ? '&' : '?'}t=${Math.floor(tick / refreshMs)}`
	);
</script>

<article class="card camera" class:dormant>
	{#if dormant}
		<div class="placeholder" role="img" aria-label="Camera currently offline for the season">
			<span class="badge">Seasonal</span>
			<p class="big">Back {returns ? `in ${returns}` : 'soon'}</p>
			<p>{camera.seasonal_note ?? 'Not broken. This camera is off right now.'}</p>
		</div>
	{:else if camera.feed_type === 'image'}
		<img src={imageSrc} alt={camera.name} loading="lazy" />
	{:else if camera.feed_type === 'video' || camera.feed_type === 'stream'}
		<video src={camera.feed_url} controls muted playsinline preload="none"></video>
	{/if}
	<div class="meta">
		<h3>{camera.name}</h3>
		<p class="sub">
			{camera.distance.toFixed(1)} mi away{camera.location_precision === 'approximate'
				? ' (approx. location)'
				: ''}
			· {camera.attribution_text ?? camera.source}
		</p>
	</div>
</article>
