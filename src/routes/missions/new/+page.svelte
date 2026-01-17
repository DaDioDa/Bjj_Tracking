<script>
	import { db } from '../../../db.js';
	import { liveQuery } from 'dexie';
	import { base } from '$app/paths';

	let allTechs = $state([]);
	let activeMissions = $state([]);

	$effect(() => {
		const sub1 = liveQuery(() => db.techs.toArray()).subscribe((val) => {
			allTechs = val;
		});
		const sub2 = liveQuery(() => db.missions.where('status').equals('active').toArray()).subscribe(
			(val) => {
				activeMissions = val;
			}
		);
		return () => {
			sub1.unsubscribe();
			sub2.unsubscribe();
		};
	});

	let availableTechs = $derived.by(() => {
		if (!allTechs || !activeMissions) return [];
		const activeTechIds = new Set(activeMissions.map((m) => m.tech_id));
		return allTechs.filter((t) => !activeTechIds.has(t.id));
	});

	async function addToMission(tech) {
		try {
			await db.missions.add({
				tech_id: tech.id,
				title: tech.name,
				status: 'active',
				created_at: new Date(),
				session_reps: 0
			});
			// We can either stay here to add more or go back.
			// The user might want to add multiple.
			// Let's stay here but maybe show a subtle feedback if needed.
			// For now, reactive UI will remove it from the available list.
		} catch (error) {
			console.error('Failed to add mission:', error);
		}
	}
</script>

<div class="header-row">
	<h2>> SELECT_TECH_FOR_ENLISTMENT</h2>
</div>

<div class="available-list">
	{#if availableTechs.length === 0}
		<pre>[ NO_AVAILABLE_TECHS_FOR_NEW_MISSIONS ]</pre>
	{:else}
		{#each availableTechs as tech (tech.id)}
			<div class="ascii-card">
				<pre>+---------------------------------------+</pre>
				<div class="card-content">
					<p class="tech-name">| TECH: {tech.name}</p>
					<p class="tech-status">| FOCUS: {tech.is_focused ? '[V]' : '[ ]'}</p>
					<button class="link-style btn-primary" onclick={() => addToMission(tech)}>
						[ ADD_TO_MISSION ]
					</button>
				</div>
				<pre>+---------------------------------------+</pre>
			</div>
		{/each}
	{/if}
</div>

<div class="footer-nav">
	<a href="{base}/" class="link-style btn-neutral">[ BACK_TO_MISSION_CONTROL ]</a>
</div>

<style>
	.header-row {
		margin-bottom: 2rem;
		border-bottom: 1px solid #73b455;
		padding-bottom: 1rem;
	}

	h2 {
		margin: 0;
	}

	.footer-nav {
		margin-top: 3rem;
		text-align: center;
		border-top: 1px dashed #73b455;
		padding-top: 1.5rem;
	}

	.available-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.ascii-card {
		margin-bottom: 10px;
	}

	pre {
		margin: 0;
		font-family: 'Courier New', monospace;
		line-height: 1.2;
		color: #73b455;
	}

	.card-content {
		padding: 5px 0;
	}

	.tech-name {
		font-weight: bold;
		color: #fff;
		margin: 5px 0;
	}

	.tech-status {
		opacity: 0.7;
		margin-bottom: 10px;
	}

	.link-style {
		background: none;
		border: none;
		color: #73b455;
		cursor: pointer;
		font: inherit;
		text-decoration: none;
		transition: all 0.1s;
	}

	.link-style:hover {
		background: #73b455;
		color: #1f1f1f;
	}

	/* Reuse classes from main page logic for consistency */
	.btn-primary {
		color: #73b455;
		border: 1px solid #73b455;
	}
	.btn-primary:hover {
		background: #73b455;
		color: #000;
		box-shadow: 0 0 5px #73b455;
	}

	.btn-neutral {
		color: #888;
		border: 1px dashed #888;
	}
	.btn-neutral:hover {
		background: #888;
		color: #000;
	}
</style>
