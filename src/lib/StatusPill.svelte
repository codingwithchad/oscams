<script lang="ts">
	let {
		tone,
		label
	}: { tone: 'closed' | 'chains' | 'traction' | 'open' | 'off-season'; label: string } = $props();
</script>

<span class="pill pill-{tone}">{label}</span>
