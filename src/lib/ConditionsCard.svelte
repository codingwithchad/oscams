<script lang="ts">
	import type { Conditions } from './types';

	let { c }: { c: Conditions } = $props();
	const kindLabel: Record<Conditions['kind'], string> = {
		forecast: 'Forecast',
		station: 'Weather station',
		'pass-conditions': 'Road conditions'
	};
</script>

<article class="card conditions" class:dormant={c.state === 'dormant'}>
	<header>
		<span class="badge">{kindLabel[c.kind]}</span>
		{#if c.state === 'dormant'}<span class="badge seasonal">Seasonal</span>{/if}
	</header>
	<h3>{c.name}</h3>
	{#if c.state === 'ok'}
		<dl>
			{#each c.rows as row (row.label + row.value)}
				<dt>{row.label}</dt>
				<dd>{row.value}</dd>
			{/each}
		</dl>
	{:else}
		<p class="note">{c.note}</p>
	{/if}
	<p class="sub">{c.distance.toFixed(1)} mi away · {c.attribution ?? c.source}</p>
</article>
