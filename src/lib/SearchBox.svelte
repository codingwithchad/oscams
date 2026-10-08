<script lang="ts">
	import PlaceInput from './PlaceInput.svelte';

	let { value = '' }: { value?: string } = $props();
	// svelte-ignore state_referenced_locally
	let text = $state(value);
</script>

<form action="/search" method="GET" class="search" role="search">
	<PlaceInput
		name="q"
		type="search"
		bind:value={text}
		placeholder="Zip code, town or place"
		label="Search a location"
		required
	/>
	<button type="submit">Search</button>
</form>
