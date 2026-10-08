<script lang="ts">
	import { enhance } from '$app/forms';
	import { APP_NAME, REPO_URL } from '../../lib/brand';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let sending = $state(false);
</script>

<svelte:head><title>Add a camera · {APP_NAME}</title></svelte:head>

<header class="top">
	<a class="brand" href="/">{APP_NAME}</a>
	<span class="top-title">Add a camera</span>
</header>

<main class="about">
	<h1>Add a camera</h1>
	<p class="lede-dark">
		Know a public camera we should show? You can suggest it in a couple of minutes, or add it
		yourself. Every camera is checked before it goes live.
	</p>

	<h2>The rules</h2>
	<ul>
		<li>
			<strong>Only cameras the owner publishes for the public</strong>: a state or city agency, a
			park, a port, a resort, a visitor bureau. If you aren't sure, ask them. A written yes is best,
			and we'll keep their rules with the camera.
		</li>
		<li>
			<strong>No private cameras</strong>, nothing pointed into homes or yards, and nothing that
			shows people's faces or license plates up close.
		</li>
		<li>
			<strong>For YouTube streams</strong>: use the owner's own channel, and only if they allow
			embedding. We never copy or re-stream video, and someone else's re-upload doesn't count.
		</li>
		<li>
			We always <strong>credit the owner</strong> and link back to their page.
		</li>
	</ul>

	<h2>Suggest a camera</h2>
	{#if form?.sent}
		<p class="ok" role="status">
			Thank you! We'll check the camera and its owner's rules before anything is added.
		</p>
	{:else}
		<p>
			Tell us what you know. A link to the camera or its page is the only thing that really matters.
			What you write is posted publicly, so please don't include personal details.
		</p>
		<form
			method="POST"
			action="?/suggest"
			class="suggest-camera"
			use:enhance={() => {
				sending = true;
				return async ({ update }) => {
					await update({ reset: false });
					sending = false;
				};
			}}
		>
			{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
			<label>
				Link to the camera or its page
				<input
					name="link"
					type="url"
					required
					placeholder="https://"
					value={form?.values?.link ?? ''}
				/>
			</label>
			<label>
				Where is it?
				<input
					name="where"
					required
					placeholder="Town, road, beach, marina…"
					value={form?.values?.where ?? ''}
				/>
			</label>
			<label>
				Who runs it? (optional)
				<input
					name="owner"
					placeholder="A port, city, park, resort, business…"
					value={form?.values?.owner ?? ''}
				/>
			</label>
			<label>
				Do they say anyone can show it? (optional)
				<textarea
					name="terms"
					rows="3"
					placeholder="Paste what their page says, or say you're not sure"
					>{form?.values?.terms ?? ''}</textarea
				>
			</label>
			<label>
				Your first name (optional)
				<input name="name" value={form?.values?.name ?? ''} />
			</label>
			<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
			<button type="submit" class="primary" disabled={sending}>
				{sending ? 'Sending…' : 'Send suggestion'}
			</button>
		</form>
	{/if}

	<details class="for-developers">
		<summary>For developers: add it yourself</summary>
		<h3>Add it yourself</h3>
		<p>
			Each camera is one small text file in the <code>data/cameras</code> folder. You don't have to write
			code.
		</p>
		<h4>For a YouTube live stream</h4>
		<ol>
			<li>
				<a href="{REPO_URL}/fork" target="_blank" rel="noopener">Fork the project</a> and open it on
				your computer (you'll need
				<a href="https://nodejs.org" target="_blank" rel="noopener">Node.js</a>).
			</li>
			<li>
				Run the checker with the stream's link and where the camera is (latitude then longitude):
				<pre>node scripts/add-youtube-camera.mjs "https://www.youtube.com/live/XXXX" \
  --lat 47.98 --lon -122.22 --name "Everett boat launch" \
  --source "Port of Everett" --use-channel</pre>
				It tells you who owns the channel, whether embedding is allowed and whether it's live. Add
				<code>--write</code> when it passes to create the file.
			</li>
			<li>
				Run <code>npm install</code> then <code>npm test</code> to check the file.
			</li>
			<li>Open a pull request. Say who the owner is and how you know they allow it.</li>
		</ol>
		<h4>For any other camera</h4>
		<p>
			Copy a file in <a href="{REPO_URL}/tree/main/data/cameras" target="_blank" rel="noopener"
				>data/cameras</a
			>
			that looks like yours, change the details and set <code>"status": "pending"</code>. The
			<a href="{REPO_URL}/blob/main/docs/data-model.md" target="_blank" rel="noopener"
				>data model guide</a
			>
			explains each field, and
			<a href="{REPO_URL}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">CONTRIBUTING</a> has
			the full steps.
		</p>
	</details>

	<h2>What happens next</h2>
	<p>
		New cameras start as <em>pending</em>. A maintainer checks the source and the owner's terms,
		then approves it. Nothing goes live without that review, and there's no way for a camera to
		appear on the site without it.
	</p>
</main>
