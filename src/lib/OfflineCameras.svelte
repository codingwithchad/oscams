<script lang="ts">
	import { returnLabel } from './format';
	import type { Camera, Nearby } from './types';

	let { cameras }: { cameras: Nearby<Camera>[] } = $props();

	// One line per operator: "Seasonal, back November: Courtyard, Jupiter, …"
	const groups = $derived.by(() => {
		const map = new Map<string, { when: string | null; names: string[] }>();
		for (const cam of cameras) {
			const when = returnLabel(cam.expected_return);
			const key = `${cam.source}|${when}`;
			const short = cam.name.replace(new RegExp(`^${cam.source}:?\\s*`), '');
			const group = map.get(key) ?? { when, names: [] };
			group.names.push(short);
			map.set(key, group);
		}
		return [...map.values()];
	});
</script>

{#if groups.length}
	<ul class="offline" aria-label="Cameras that are off right now">
		{#each groups as g (g.names.join())}
			<li>
				<strong>{g.when ? `Seasonal, back ${g.when}` : 'Offline'}:</strong>
				{g.names.join(', ')}
			</li>
		{/each}
	</ul>
{/if}
