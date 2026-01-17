<script>
	import { base } from '$app/paths';
	import '@fontsource/ibm-plex-mono/300.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '@fontsource/ibm-plex-mono/600.css';

	let { children } = $props();
</script>

<div class="terminal">
	<header>
		<span>&#123; BJJ_LAB_v0.2 // SYSTEM_READY &#125;</span>
	</header>

	<nav>
		<a href="{base}/">[ MISSION ]</a>
		<a href="{base}/library">[ LIBRARY ]</a>
		<a href="{base}/log">[ LOG ]</a>
		<a href="{base}/history">[ HISTORY ]</a>
	</nav>

	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		background-color: #1f1f1f;
		color: #73b455;
		font-family: 'IBM Plex Mono', 'Courier New', monospace;
		margin: 0;
		display: flex;
		justify-content: center;
		overflow-x: hidden;
	}

	.terminal {
		width: 100%;
		max-width: 600px;
		min-height: 100vh;
		border-left: 1px solid #00ff4144;
		border-right: 1px solid #00ff4144;
		padding: 15px; /* Reduced from 20px */
		display: flex;
		flex-direction: column;
	}

	header {
		border-bottom: 1px solid #73b455;
		padding-bottom: 10px;
		margin-bottom: 20px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		font-size: 0.9rem;
	}

	nav {
		margin-bottom: 20px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	nav a {
		color: #73b455;
		text-decoration: none;
		font-size: 0.8rem;
		white-space: nowrap;
	}

	:global(pre) {
		max-width: 100%;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
	}

	/* Helper classes for fluid ASCII */
	:global(.ascii-line) {
		display: flex;
		align-items: center;
		width: 100%;
		font-family: 'Courier New', monospace;
		color: #73b455;
		white-space: nowrap;
		overflow: hidden;
	}

	:global(.ascii-line::after) {
		content: '';
		flex-grow: 1;
		margin-left: 5px;
		border-bottom: 1px dashed #73b455;
	}
</style>
