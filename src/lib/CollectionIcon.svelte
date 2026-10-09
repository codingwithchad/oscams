<script lang="ts">
	let { name = 'pin' }: { name?: string } = $props();
</script>

<svg
	class="ci"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'ferry'}
		<path d="M3 15h18l-2 4H5z" />
		<path d="M6 15V10h12v5" />
		<path d="M9 10V7h6v3" />
		<path d="M3 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
	{:else if name === 'border'}
		<path d="M5 21V4M19 21V4" />
		<path d="M5 8h14M5 12h14" />
		<path d="M8 8l4 4M12 8l4 4" />
	{:else if name === 'plane'}
		<path d="M10.5 13.5L3 11l1-2 8 1.5 4-5.5 2 .8-2.5 6.7 5 2.5-.8 2-6-1-3 4-1.5-1z" />
	{:else if name === 'airfield'}
		<path d="M6 21V4" />
		<path d="M6 5l13 2.5L6 11z" />
		<path d="M3 21h8" />
	{:else if name === 'ski'}
		<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9" />
		<path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />
	{:else if name === 'list'}
		<path d="M8 6h12M8 12h12M8 18h12" />
		<circle cx="4" cy="6" r="1" />
		<circle cx="4" cy="12" r="1" />
		<circle cx="4" cy="18" r="1" />
	{:else if name === 'pass'}
		<path d="M2 18l6-10 3.5 6L14 11l8 7z" />
		<path d="M6 21c3-1.5 5-1.5 8 0s4 1.5 6 0" />
	{:else if name === 'wave'}
		<path d="M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
		<path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
		<path d="M5 12c0-4 3-7 7-7 3 0 5 2 5 4-2-1-5 0-5 3" />
	{:else if name === 'eye'}
		<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
		<circle cx="12" cy="12" r="3" />
	{:else if name === 'mountain'}
		<path d="M2 20l7-12 4 7 2-3 7 8z" />
		<path d="M9 8l1.5 2.5" />
	{:else}
		<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" />
		<circle cx="12" cy="10" r="2.5" />
	{/if}
</svg>
