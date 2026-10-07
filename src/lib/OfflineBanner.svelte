<script lang="ts">
	let online = $state(true);

	$effect(() => {
		online = navigator.onLine;
		const up = () => (online = true);
		const down = () => (online = false);
		window.addEventListener('online', up);
		window.addEventListener('offline', down);
		return () => {
			window.removeEventListener('online', up);
			window.removeEventListener('offline', down);
		};
	});
</script>

{#if !online}
	<p class="offline-banner" role="status">You're offline. Showing the last saved view.</p>
{/if}
