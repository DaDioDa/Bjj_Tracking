<script>
	import { db } from '../../db.js';
	import { liveQuery } from 'dexie';

	// State
	let logs = $state([]);
	let showAll = $state(false);

	$effect(() => {
		// Fetch all logs, reverse sort by id/date implicitly if we want, or just sort manually
		const sub = liveQuery(() => db.logs.reverse().toArray()).subscribe((val) => {
			logs = val;
		});
		return () => sub.unsubscribe();
	});

	let visibleLogs = $derived(showAll ? logs : logs.slice(0, 5));
</script>

<h2>> HISTORY_ARCHIVES [RAW_DUMP]</h2>

<div class="history-list">
	{#if logs && logs.length > 0}
		{#each visibleLogs as log (log.id)}
			<div class="ascii-card">
				<div class="ascii-line">+ [ DATE: {log.date} ]</div>
				<div class="content">
					<p class="notes"><strong>> NOTES:</strong> {log.notes || 'No notes.'}</p>
					<div class="stats">
						<p><strong>> PRACTICE_COUNT:</strong></p>
						{#if log.content && log.content.length > 0}
							<ul>
								{#each log.content as item (item.techName)}
									<li>{item.techName}: {item.count}</li>
								{/each}
							</ul>
						{:else}
							<p>No specific drills.</p>
						{/if}
					</div>
				</div>
				<div class="ascii-line">+</div>
			</div>
		{/each}

		{#if !showAll && logs.length > 5}
			<div class="more-container">
				<button class="link-style btn-neutral" onclick={() => (showAll = true)}>
					[ SHOW_MORE ]
				</button>
			</div>
		{/if}
	{:else}
		<p>NO_LOGS_FOUND_IN_ARCHIVE.</p>
	{/if}
</div>

<style>
	.more-container {
		text-align: center;
		margin: 20px 0;
	}

	.btn-neutral {
		color: #888;
		border: 1px dashed #888;
	}
	.btn-neutral:hover {
		background: #888;
		color: #000;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.ascii-card {
		margin-bottom: 20px;
	}

	pre {
		margin: 0;
		font-family: 'Courier New', monospace;
		color: #73b455;
	}

	.content {
		padding: 5px 10px;
		border-left: 1px dashed #73b455;
		border-right: 1px dashed #73b455;
	}

	.notes {
		white-space: pre-wrap;
		margin-bottom: 10px;
		color: #aaa;
		word-break: break-all;
	}

	ul {
		list-style: square;
		padding-left: 20px;
		color: #ccc;
	}
</style>
