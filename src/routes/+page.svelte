<script>
	import { base } from '$app/paths';
	import { db } from '../db.js';
	import { liveQuery } from 'dexie';

	// State for data
	let allTechs = $state(undefined); // undefined indicates loading
	let activeMissions = $state([]);
	let editingId = $state(null); // ID of the mission currently being edited
	let editBuffer = $state({}); // Buffer for editing checkpoints

	// Subscriptions using $effect
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

	// Derive Recommended Missions
	// Rule: 2 Focused Techs + 1 Unfocused (Random) Tech
	let recommendedMissions = $derived.by(() => {
		if (!allTechs || !activeMissions) return [];

		const activeTechIds = new Set(activeMissions.map((m) => m.tech_id));
		const availableTechs = allTechs.filter((t) => !activeTechIds.has(t.id));

		const focused = availableTechs.filter((t) => t.is_focused);
		const others = availableTechs.filter((t) => !t.is_focused);

		// Helper to shuffle and pick n
		const pickRandom = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

		// Try to pick 2 focused
		const pickedFocused = pickRandom(focused, 2);

		// Try to pick 1 others
		// If we didn't get enough focused (e.g. only 0 or 1 exists), we might want to fill more from others?
		// For now, strict: 2 focused + 1 other.
		// If we have strict requirements, we just take what we can.

		let finalSelection = [...pickedFocused];

		// We need 3 total. If we have < 2 focused, we can fill the gap with others if desired?
		// User request: "Must have 2 focused, plus 1 unfocused".
		// Implementation: Best effort 2 focused. Then fill remaining slots (up to 3) with others/random?
		// Let's do: Pick up to 2 specificly from 'focused' pool.
		// 2. Pick up to 1 specifically from 'others' pool.
		// That creates a mix.

		const pickedOthers = pickRandom(others, 1);
		finalSelection = [...finalSelection, ...pickedOthers];

		return finalSelection;
	});

	// Derive Active Missions with details (Join Mission + Tech)
	let activeMissionsWithDetails = $derived.by(() => {
		if (!activeMissions || !allTechs) return [];
		return activeMissions.map((mission) => {
			const tech = allTechs.find((t) => t.id === mission.tech_id);
			return { ...mission, tech };
		});
	});

	async function acceptMission(tech) {
		try {
			await db.missions.add({
				tech_id: tech.id,
				title: tech.name,
				status: 'active',
				created_at: new Date()
			});
		} catch (error) {
			console.error('Failed to accept mission:', error);
		}
	}

	async function deleteMission(id) {
		if (confirm('ABORT MISSION?')) {
			await db.missions.delete(id);
		}
	}

	function startEditing(mission) {
		editingId = mission.id;
		// Deep copy checkpoints to buffer
		if (mission.tech && mission.tech.checkpoints) {
			editBuffer = { ...mission.tech, checkpoints: [...mission.tech.checkpoints] };
		}
	}

	function cancelEditing() {
		editingId = null;
		editBuffer = {};
	}

	async function saveCheckpoints(mission) {
		if (!mission.tech) return;
		try {
			await db.techs.update(mission.tech.id, {
				checkpoints: $state.snapshot(editBuffer.checkpoints)
			});
			editingId = null;
			editBuffer = {};
		} catch (error) {
			console.error('Failed to save checkpoints:', error);
		}
	}
</script>

<h2>> MISSION_CONTROL</h2>

<div class="mission-container">
	{#if allTechs === undefined}
		<pre>[ SCANNING_DATABASE... ]</pre>
	{:else if allTechs.length === 0}
		<div class="warning-box">
			<div class="ascii-line">+ [ ERR: DATABASE_EMPTY ]</div>
			<div class="warning-body">
				<p>Please go to LIBRARY to add techs.</p>
			</div>
			<div class="ascii-line">+</div>
		</div>
		<a href="{base}/library" class="link">[ GOTO_LIBRARY ]</a>
	{:else}
		<!-- ACTIVE MISSIONS SECTION -->
		{#if activeMissionsWithDetails && activeMissionsWithDetails.length > 0}
			<h3>> ACTIVE_OPERATIONS</h3>
			{#each activeMissionsWithDetails as item (item.id)}
				<div class="ascii-card active">
					<div class="ascii-line">+ [ ACT_00{item.id} ]</div>
					<div class="card-content">
						<p class="mission-name">| MISSION: {item.title}</p>
						{#if item.tech}
							<p class="tech-info">| TARGET: {item.tech.name}</p>

							{#if editingId === item.id}
								<!-- EDIT MODE -->
								<div class="edit-panel">
									{#each editBuffer.checkpoints as kp, idx (idx)}
										<!-- svelte-ignore a11y_autofocus -->
										<input
											class="edit-input"
											autofocus={idx === 0}
											title={kp}
											bind:value={editBuffer.checkpoints[idx]}
											placeholder="Checkpoint {idx + 1}"
										/>
									{/each}
									<div class="edit-actions">
										<button class="link-style" onclick={() => saveCheckpoints(item)}
											>[ SAVE ]</button
										>
										<button class="link-style warning" onclick={cancelEditing}>[ CANCEL ]</button>
									</div>
								</div>
							{:else}
								<!-- VIEW MODE -->
								{#if item.tech.checkpoints && item.tech.checkpoints.some((c) => c)}
									<div class="checkpoints">
										{#each item.tech.checkpoints as kp, i (i)}
											{#if kp}
												<p>| > {kp}</p>
											{/if}
										{/each}
									</div>
								{/if}
								<div class="actions-row">
									<button class="link-style btn-neutral" onclick={() => startEditing(item)}
										>[ EDIT_CHECKPOINTS ]</button
									>
									<button class="link-style btn-destructive" onclick={() => deleteMission(item.id)}
										>[ ABORT ]</button
									>
								</div>
							{/if}
						{:else}
							<p class="warning-text">| ERR: TECH_DATA_MISSING</p>
							<button class="link-style btn-destructive" onclick={() => deleteMission(item.id)}
								>[ ABORT_CORRUPTED ]</button
							>
						{/if}
					</div>
					<div class="ascii-line">+</div>
				</div>
			{/each}
		{/if}

		<!-- RECOMMENDED MISSIONS SECTION -->
		<h3>> RECOMMENDED_OPERATIONS</h3>
		{#if recommendedMissions.length === 0}
			<pre class="status-text">NO_NEW_RECOMMENDATIONS_AVAILABLE</pre>
		{:else}
			{#each recommendedMissions as tech, i (tech.id)}
				<div class="ascii-card">
					<div class="ascii-line">+ [ REC_00{i + 1} ]</div>
					<div class="card-content">
						<p class="mission-name">| TECH: {tech.name}</p>
						<button class="link-style btn-primary" onclick={() => acceptMission(tech)}>
							[ ACCEPT_MISSION ]
						</button>
					</div>
					<div class="ascii-line">+</div>
				</div>
			{/each}
		{/if}

		<div class="custom-mission-link">
			<a href="{base}/missions/new" class="link">[ CREATE_CUSTOM_MISSION ]</a>
		</div>

		<div class="nav-log">
			<a href="{base}/log" class="link large">[ >> GO_TO_LOG >> ]</a>
		</div>
	{/if}
</div>

<style>
	pre {
		margin: 0;
		font-family: 'Courier New', monospace;
		line-height: 1.2;
		color: #73b455; /* 套用你的指定綠 */
	}

	.link:hover,
	.link-style:hover {
		background: #73b455;
		color: #1f1f1f; /* 反白時文字變背景色 */
	}

	.link-style {
		background: none;
		border: 1px solid transparent; /* Reserve space for border */
		padding: 2px 5px;
		color: #555; /* Default neutral weak color */
		cursor: pointer;
		font: inherit;
		text-decoration: none;
		transition: all 0.2s;
	}

	/* Primary - Green */
	.btn-primary {
		color: #73b455;
		border: 1px solid #73b455;
	}
	.btn-primary:hover {
		background: #73b455;
		color: #000;
		box-shadow: 0 0 5px #73b455;
	}

	/* Destructive - Red */
	.btn-destructive {
		color: #d32f2f;
		border: 1px solid #d32f2f;
	}
	.btn-destructive:hover {
		background: #d32f2f;
		color: #fff;
		box-shadow: 0 0 5px #d32f2f;
	}

	/* Neutral - Grey/Light Green */
	.btn-neutral {
		color: #888;
		border: 1px dashed #888;
	}
	.btn-neutral:hover {
		background: #888;
		color: #000;
	}

	.mission-name {
		margin: 0;
		padding-left: 0;
		line-height: 1.5;
		white-space: pre-wrap; /* Changed from pre to pre-wrap for mobile */
		word-break: break-all;
		color: #73b455;
	}

	.warning-box {
		margin: 20px 0;
		border-left: 1px dashed #73b455;
		border-right: 1px dashed #73b455;
	}

	.warning-body {
		padding: 10px;
		color: #8b4513;
	}

	/* 警告文字可以稍微保留一點紅色調，或者調成跟主題相近的暗橘 */
	.warning-text {
		color: #8b4513;
	}

	.status-text {
		margin-top: 30px;
		opacity: 0.5;
		color: #73b455;
	}

	.checkpoints {
		margin-left: 10px;
		opacity: 0.8;
	}

	.ascii-card.active {
		border-left: 2px solid #73b455;
		padding-left: 5px;
	}

	.tech-info {
		color: #fff; /* Highlight tech name */
		font-weight: bold;
	}

	.custom-mission-link {
		margin-top: 2rem;
		text-align: center;
	}

	.custom-mission-link a {
		color: #73b455;
		text-decoration: none;
	}

	.actions-row {
		margin-top: 10px;
		border-top: 1px dashed #73b455;
		padding-top: 5px;
	}

	.edit-panel {
		margin: 10px 0;
		padding: 5px;
		border: 1px dashed #73b455;
	}

	.edit-input {
		display: block;
		width: 100%;
		background: #111;
		border: none;
		border-bottom: 1px solid #73b455;
		color: #73b455;
		font-family: 'Courier New', monospace;
		margin-bottom: 5px;
	}

	.nav-log {
		margin-top: 40px;
		text-align: center;
		border-top: 1px solid #73b455;
		padding-top: 20px;
	}

	.link.large {
		font-size: 1.1em; /* Reduced from 1.2em */
		font-weight: bold;
		border: 1px solid #73b455;
		padding: 10px 15px; /* Reduced from 20px */
		display: inline-block;
		max-width: 100%;
		color: #73b455;
		text-decoration: none;
		word-break: break-word;
	}

	.link.large:hover {
		background: #73b455;
		color: #000;
		animation: blink 0.5s infinite;
	}

	@keyframes blink {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
		100% {
			opacity: 1;
		}
	}
</style>
