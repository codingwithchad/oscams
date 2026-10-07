<script lang="ts">
	import { returnLabel } from './format';
	import type { Conditions } from './types';

	let { conditions }: { conditions: Conditions[] } = $props();

	const label: Record<Conditions['kind'], string> = {
		forecast: 'Forecast',
		station: 'Station',
		'pass-conditions': 'Roads'
	};
	const live = $derived(conditions.filter((c) => c.state === 'ok'));
	const quiet = $derived(conditions.filter((c) => c.state !== 'ok'));
	const quietText = $derived(
		quiet
			.map((c) => {
				const back = returnLabel(c.returns);
				return c.state === 'dormant'
					? `${label[c.kind]}: seasonal${back ? `, back ${back}` : ''}`
					: `${label[c.kind]}: unavailable`;
			})
			.join(' · ')
	);
</script>

{#if conditions.length}
	<section class="wx-bar" aria-label="Current conditions">
		{#each live as c (c.id)}
			<div class="wx">
				<span class="wx-kind">{label[c.kind]}</span>
				{#if c.kind === 'forecast'}
					<span>{c.rows[0].label}: {c.rows[0].value}</span>
					{#if c.rows.length > 1}
						<details>
							<summary>Next</summary>
							<ul>
								{#each c.rows.slice(1) as row (row.label)}<li>{row.label}: {row.value}</li>{/each}
							</ul>
						</details>
					{/if}
				{:else}
					<span>{c.rows.map((r) => `${r.label} ${r.value}`).join(' · ')}</span>
				{/if}
			</div>
		{/each}
		{#if quietText}<p class="wx-quiet">{quietText}</p>{/if}
	</section>
{/if}
