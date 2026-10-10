<script lang="ts">
	import { track } from './track';
	interface InstallPrompt extends Event {
		prompt: () => Promise<void>;
	}

	let platform = $state<'ios' | 'android' | 'other'>('other');
	let installed = $state(false);
	let prompt = $state<InstallPrompt | null>(null);

	$effect(() => {
		const ua = navigator.userAgent;
		platform = /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'other';
		installed =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		const onPrompt = (e: Event) => {
			e.preventDefault();
			prompt = e as InstallPrompt;
		};
		window.addEventListener('beforeinstallprompt', onPrompt);
		return () => window.removeEventListener('beforeinstallprompt', onPrompt);
	});
</script>

{#if !installed}
	<section class="install" aria-labelledby="install-title">
		<h2 id="install-title">Put What's Up Ahead on your phone</h2>
		<p>No app store. It opens like an app and keeps your last view when you lose signal.</p>

		{#if prompt}
			<button
				onclick={() => {
					track('install');
					prompt?.prompt();
				}}>Install now</button
			>
		{/if}

		{#if platform !== 'android'}
			<details open={platform === 'ios'}>
				<summary>iPhone or iPad (Safari)</summary>
				<ol>
					<li>Open this page in <strong>Safari</strong>.</li>
					<li>Tap the <strong>Share</strong> button (the square with an arrow).</li>
					<li>Scroll and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
				</ol>
			</details>
		{/if}
		{#if platform !== 'ios'}
			<details open={platform === 'android'}>
				<summary>Android (Chrome)</summary>
				<ol>
					<li>Open this page in <strong>Chrome</strong>.</li>
					<li>Tap the <strong>three dots</strong> at the top right.</li>
					<li>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</li>
				</ol>
			</details>
		{/if}
	</section>
{/if}
