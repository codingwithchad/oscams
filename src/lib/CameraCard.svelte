<script lang="ts">
	import CameraMedia from './CameraMedia.svelte';
	import type { Camera, Nearby } from './types';

	let { camera, note, onopen }: { camera: Nearby<Camera>; note?: string; onopen?: () => void } =
		$props();
</script>

<article class="card camera">
	<CameraMedia {camera} {onopen} />
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
