<script lang="ts">
	import { duration } from './format';
	import type { SnowReport } from './server/snow';
	import type { Camera } from './types';

	let {
		snow,
		miles,
		minutes,
		stops,
		demo = false
	}: {
		snow: SnowReport;
		miles: number;
		minutes: number;
		stops: { camera: Camera; along: number }[];
		demo?: boolean;
	} = $props();

	const total = $derived(snow.samples[snow.samples.length - 1]?.along || miles || 1);
	const colour = { snow: 'snow', cold: 'cold' } as const;
	const first = $derived(snow.stretches.find((s) => s.level === 'snow') ?? snow.stretches[0]);
	const at = (along: number) => duration((minutes * along) / total);
	const nextCamera = (along: number) => stops.find((s) => s.along >= along)?.camera.name;
	const snowyMiles = $derived(
		Math.round(
			snow.stretches.filter((s) => s.level === 'snow').reduce((n, s) => n + (s.to - s.from), 0)
		)
	);
	const snowy = $derived(snowyMiles > 0);
	const highest = $derived(Math.max(...snow.samples.map((s) => s.feet)));
</script>

{#if snow.stretches.length || highest >= 2500}
	<section class="snow-line" aria-label="Where snow starts on this drive">
		<h2>Snow on this drive</h2>
		{#if demo}
			<p class="snow-demo">Example only: this is an invented winter forecast, not real weather.</p>
		{/if}
		{#if first}
			<p class="snow-headline">
				{first.level === 'snow' ? 'Snow likely starts' : 'Freezing temperatures start'} about
				<strong>mile {Math.round(first.from)}</strong>
				({first.feet.toLocaleString()} ft), around {at(first.from)} into the drive.
				{#if nextCamera(first.from)}First camera there: {nextCamera(first.from)}.{/if}
			</p>
		{:else}
			<p class="snow-headline">
				No snow or freezing temperatures expected along the way at the time you'll be there (highest
				point {highest.toLocaleString()} ft).
			</p>
		{/if}
		<div class="snow-bar" role="img" aria-label="Snow along the route">
			{#each snow.samples.slice(0, -1) as s, i (i)}
				{@const end = snow.samples[i + 1].along}
				{@const lvl = snow.stretches.find(
					(x) => s.along >= x.from - 0.01 && s.along <= x.to
				)?.level}
				<span
					class={lvl ? colour[lvl] : 'clear'}
					style="flex:{Math.max(end - s.along, 0.1)}"
					title="Mile {Math.round(s.along)}: {s.tempF}°F, {s.feet.toLocaleString()} ft"
				></span>
			{/each}
		</div>
		<p class="snow-key">
			<span class="k"><i class="snow"></i> snowing</span>
			<span class="k"><i class="cold"></i> freezing</span>
			<span class="k"><i class="clear"></i> above freezing</span>
			<span class="snow-end">
				<span>Start</span><span>{miles.toFixed(0)} mi</span>
			</span>
		</p>
		{#if snowy}
			<p class="snow-advice">
				About {snowyMiles} of the {Math.round(total)} miles are expected to be snowing. Expect traction
				tires or chains on the snowy part (required on most WA passes), and without them or 4WD it may
				not be worth the trip. Check WSDOT's pass report before you go.
			</p>
		{/if}
		<p class="snow-note">
			A forecast for when you'll get there, from Open-Meteo. Check the pass cameras and WSDOT before
			you go.
		</p>
	</section>
{/if}
