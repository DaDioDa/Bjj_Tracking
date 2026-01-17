<script>
	import { db } from '../../db.js';
	import { liveQuery } from 'dexie';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	let note = $state('');
	let activeMissions = $state([]);
	let allTechs = $state([]);

	$effect(() => {
		const sub1 = liveQuery(() => db.missions.where('status').equals('active').toArray()).subscribe(
			(val) => {
				activeMissions = val;
			}
		);
		const sub2 = liveQuery(() => db.techs.toArray()).subscribe((val) => {
			allTechs = val;
		});
		return () => {
			sub1.unsubscribe();
			sub2.unsubscribe();
		};
	});

	let missionsWithDetails = $derived.by(() => {
		if (!activeMissions || !allTechs) return [];
		return activeMissions.map((m) => {
			const tech = allTechs.find((t) => t.id === m.tech_id);
			return { ...m, techName: tech ? tech.name : 'Unknown Tech', techDetails: tech };
		});
	});

	async function updateReps(mission, change) {
		const current = mission.session_reps || 0;
		const newCount = Math.max(0, current + change); // No negatives
		await db.missions.update(mission.id, { session_reps: newCount });
	}

	async function wrapUp() {
		if (!confirm("CONFIRM WRAP UP?\nThis will archive today's session.")) return;

		const dateStr = new Date().toISOString().split('T')[0];

		try {
			// 1. Fetch raw data directly from DB to avoid any Proxy/Reactivity issues
			const rawMissions = await db.missions.where('status').equals('active').toArray();
			const performedMissions = rawMissions.filter((m) => (m.session_reps || 0) > 0);

			// 2. Fetch related techs to get names
			const techIds = performedMissions.map((m) => m.tech_id);
			const rawTechs = await db.techs.where('id').anyOf(techIds).toArray();
			const techMap = new Map(rawTechs.map((t) => [t.id, t]));

			// 3. Construct log content
			const content = performedMissions.map((m) => ({
				techId: m.tech_id,
				techName: techMap.get(m.tech_id)?.name || 'Unknown',
				count: m.session_reps
			}));

			// 4. Create plain object for log entry (ensure note is not a proxy)
			const logEntry = {
				date: dateStr,
				notes: JSON.parse(JSON.stringify(note)), // Deep clone/unwrap string
				content: content
			};

			await db.transaction('rw', db.logs, db.missions, db.techs, async () => {
				await db.logs.add(logEntry);

				// 1. Update Tech Stats (practice_count)
				for (const m of performedMissions) {
					const currentCount = techMap.get(m.tech_id)?.practice_count || 0;
					await db.techs.update(m.tech_id, {
						practice_count: currentCount + m.session_reps
					});
				}

				// 2. Clear ALL Active Missions (User requested to clear board)
				const allActiveIds = rawMissions.map((m) => m.id);
				await db.missions.bulkDelete(allActiveIds);
			});

			goto(`${base}/history`);
		} catch (error) {
			console.error('Wrap up failed:', error);
			alert('SYSTEM ERROR: WRAP_UP_FAILED');
		}
	}
</script>

<h2>> LOG_ENTRY_INTERFACE</h2>

<div class="log-container">
	<div class="mission-list">
		<h3>> ACTIVE_SESSION_TRACKER</h3>

		{#if missionsWithDetails.length === 0}
			<pre>[ NO_ACTIVE_MISSIONS ]</pre>
		{:else}
			{#each missionsWithDetails as item (item.id)}
				<div class="ascii-card">
					<pre>+--- [ TRK_00{item.id} ] -----------------------+</pre>
					<div class="card-content">
						<p class="mission-name">| TECH: {item.techName}</p>
						{#if item.techDetails && item.techDetails.checkpoints}
							<div class="checkpoints-mini">
								{#each item.techDetails.checkpoints as kp, i (i)}
									{#if kp}
										<p class="tiny">| > {kp}</p>
									{/if}
								{/each}
							</div>
						{/if}
						<div class="counter-row">
							<span class="label">| REPS: </span>
							<button class="link-style btn-op btn-neutral" onclick={() => updateReps(item, -1)}
								>[-]</button
							>
							<span class="count">[{item.session_reps || 0}]</span>
							<button class="link-style btn-op btn-neutral" onclick={() => updateReps(item, 1)}
								>[+]</button
							>
						</div>
					</div>
					<pre>+---------------------------------------+</pre>
				</div>
			{/each}
		{/if}
	</div>

	<div class="notes-section">
		<h3>> SESSION_DEBRIEF</h3>
		<textarea class="terminal-input" bind:value={note} placeholder="// ENTER_FIELD_NOTES_HERE..."
		></textarea>
	</div>

	<div class="action-footer">
		<button class="link-style wrap-btn btn-primary" style="font-weight: 900;" onclick={wrapUp}>
			[ THAT'S A WRAP ]
		</button>
	</div>
</div>

<style>
	pre {
		margin: 0;
		font-family: 'Courier New', monospace;
		line-height: 1.2;
		color: #73b455;
	}

	.ascii-card {
		margin-bottom: 20px;
	}

	.mission-name {
		margin: 5px 0;
		font-weight: bold;
	}

	.tiny {
		font-size: 0.8em;
		opacity: 0.7;
		margin: 0;
		padding-left: 10px;
	}

	.counter-row {
		margin-top: 10px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding-left: 0;
	}

	.count {
		font-size: 1.2em;
		font-weight: bold;
		color: #fff;
	}

	.btn-op {
		font-size: 1.2em;
		padding: 0 5px;
	}

	.terminal-input {
		width: 100%;
		height: 150px;
		background: #111;
		border: 1px solid #73b455;
		color: #73b455;
		font-family: 'Courier New', monospace;
		padding: 10px;
		outline: none;
		resize: none;
	}

	.wrap-btn {
		width: 100%;
		padding: 15px;
		border: 1px dashed #73b455;
		text-align: center;
		font-weight: bold;
		margin-top: 20px;
	}

	.wrap-btn:hover {
		background: #73b455;
		color: #000;
	}

	.link-style {
		background: none;
		border: none;
		color: #73b455;
		cursor: pointer;
		font: inherit;
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
