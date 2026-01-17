<script>
	import { base } from '$app/paths';
	let { children } = $props();
</script>

<div class="terminal">
	<header>
		<span>&#123; BJJ_LAB_v0.1 // SYSTEM_READY &#125;</span>
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

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
	href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&display=swap"
	rel="stylesheet"
/>

<style>
	:global(body) {
		background-color: #050505;
		color: #73b455;
		font-family: 'Courier New', monospace;
		margin: 0;
		display: flex;
		justify-content: center;
	}
	.terminal {
		width: 100%;
		max-width: 600px;
		min-height: 100vh;
		border-left: 1px solid #00ff4144;
		border-right: 1px solid #00ff4144;
		padding: 20px;
	}
	header {
		border-bottom: 1px solid #73b455;
		padding-bottom: 10px;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	nav {
		margin-bottom: 20px;
	}
	nav a {
		color: #73b455;
		text-decoration: none;
		margin-right: 15px;
		font-size: 0.8rem;
	}
</style>
