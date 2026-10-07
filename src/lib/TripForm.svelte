<script lang="ts">
	let {
		places = [],
		from = '',
		to = ''
	}: { places?: { id: string; name: string }[]; from?: string; to?: string } = $props();

	let fromText = $state(from);
	let toText = $state(to);
	let locating = $state(false);
	let error = $state('');

	function useMyLocation() {
		error = '';
		if (!navigator.geolocation) {
			error = 'Location is not available on this device.';
			return;
		}
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				fromText = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
				locating = false;
			},
			() => {
				locating = false;
				error = 'Could not get your location.';
			},
			{ timeout: 10000 }
		);
	}
</script>

<form action="/trip" method="GET" class="trip-form">
	<label>
		From
		<span class="row">
			<input
				name="from"
				bind:value={fromText}
				placeholder="Town, zip or address"
				autocomplete="off"
				required
			/>
			<button type="button" class="secondary" onclick={useMyLocation} disabled={locating}>
				{locating ? '…' : 'Here'}
			</button>
		</span>
	</label>
	<label>
		To
		<input
			name="to"
			bind:value={toText}
			placeholder="Place, town or zip"
			autocomplete="off"
			required
		/>
	</label>
	{#if places.length}
		<div class="chips" aria-label="Quick destinations">
			{#each places as place (place.id)}
				<button
					type="button"
					class="chip"
					onclick={() => (toText = place.name)}
					aria-pressed={toText === place.name}
				>
					{place.name}
				</button>
			{/each}
		</div>
	{/if}
	{#if error}<p class="error">{error}</p>{/if}
	<button type="submit">Show the drive</button>
</form>
