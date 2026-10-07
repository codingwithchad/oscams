<script lang="ts">
	let { value = '' }: { value?: string } = $props();
</script>

<form action="/search" method="GET" class="search" role="search">
	<input
		type="search"
		name="q"
		{value}
		placeholder="Zip code, town or place"
		aria-label="Search a location"
		autocomplete="off"
		required
	/>
	<button type="submit">Search</button>
</form>
