<script lang="ts">
	import favicon from '../lib/assets/favicon.svg';
	import '../app.css';
	import OfflineBanner from '../lib/OfflineBanner.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#0b3d5c" />
</svelte:head>

<OfflineBanner />
{@render children()}
