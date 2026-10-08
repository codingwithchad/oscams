<script lang="ts">
	import { APP_NAME, REPO_URL } from '../../lib/brand';
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

	<h2>Easiest: send us the details</h2>
	<p>
		Fill in a short form on GitHub (a free account is needed). Tell us where it is, who runs it, and
		the link to their page. We do the rest.
	</p>
	<p>
		<a
			class="button"
			href="{REPO_URL}/issues/new?template=add-camera.yml"
			target="_blank"
			rel="noopener">Suggest a camera</a
		>
	</p>

	<h2>Add it yourself</h2>
	<p>
		Each camera is one small text file in the <code>data/cameras</code> folder. You don't have to write
		code.
	</p>
	<h3>For a YouTube live stream</h3>
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
	<h3>For any other camera</h3>
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

	<h2>What happens next</h2>
	<p>
		New cameras start as <em>pending</em>. A maintainer checks the source and the owner's terms,
		then approves it. Nothing goes live without that review, and there's no way for a camera to
		appear on the site without it.
	</p>
</main>
