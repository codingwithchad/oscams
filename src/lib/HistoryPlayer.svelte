<script lang="ts">
	import { ago } from './format';

	let { id }: { id: string } = $props();

	let frames = $state<{ t: number }[]>([]);
	let mode = $state<'loading' | 'none' | 'building' | 'ready'>('loading');
	let idx = $state(0);
	let playing = $state(true);

	$effect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/history/${encodeURIComponent(id)}`);
				if (!res.ok) return void (mode = 'none');
				const body = (await res.json()) as { frames: { t: number }[] };
				if (cancelled) return;
				frames = body.frames;
				idx = Math.max(0, frames.length - 1);
				// Fetch every picture up front so the replay plays smoothly.
				for (const f of frames) new Image().src = src(f.t);
				mode = frames.length >= 3 ? 'ready' : 'building';
			} catch {
				mode = 'none';
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	// Play through the pictures, pause briefly on the newest one, then start over.
	$effect(() => {
		if (mode !== 'ready' || !playing) return;
		const timer = setTimeout(
			() => (idx = idx >= frames.length - 1 ? 0 : idx + 1),
			idx >= frames.length - 1 ? 1400 : 330
		);
		return () => clearTimeout(timer);
	});

	const src = (t: number) => `/api/history/${encodeURIComponent(id)}/${t}`;
	const span = $derived(
		frames.length > 1 ? Math.round((frames[frames.length - 1].t - frames[0].t) / 60000) : 0
	);
	const spanText = $derived(
		span >= 60
			? `${Math.floor(span / 60)} h ${span % 60 ? `${span % 60} min` : ''}`.trim()
			: `${span} min`
	);
</script>

{#if mode === 'ready'}
	<section class="replay" aria-label="Replay of recent pictures">
		<div class="replay-head">
			<strong>Replay: last {spanText}</strong>
			<span class="sub">{ago(new Date(frames[idx].t).toISOString())}</span>
		</div>
		<img src={src(frames[idx].t)} alt="Camera replay frame" />
		<div class="replay-controls">
			<button
				class="secondary"
				onclick={() => (playing = !playing)}
				aria-label={playing ? 'Pause replay' : 'Play replay'}
			>
				{playing ? 'Pause' : 'Play'}
			</button>
			<input
				type="range"
				min="0"
				max={frames.length - 1}
				value={idx}
				oninput={(e) => {
					playing = false;
					idx = Number((e.currentTarget as HTMLInputElement).value);
				}}
				aria-label="Scrub through the replay"
			/>
		</div>
	</section>
{:else if mode === 'building'}
	<p class="sub replay-note">
		Replay is building: we save a picture about every 5 minutes, so check back soon.
	</p>
{/if}
