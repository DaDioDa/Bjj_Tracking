<script>
	import { db } from '../../db.js';
	import { liveQuery } from 'dexie';

	let techsStore = liveQuery(() => db.techs.toArray());
	let techs = $derived(
		($techsStore || []).slice().sort((a, b) => (b.practice_count || 0) - (a.practice_count || 0))
	);

	let name = $state('');
	let checkpoints = $state(['', '', '']);
	let tagsInput = $state('');
	let is_focused = $state(true);

	async function addTech() {
		if (!name) return; // 防止空值
		try {
			const dataToSave = {
				name: name,
				checkpoints: $state.snapshot(checkpoints),
				last_trained: null,
				is_focused: is_focused,
				tags: $state.snapshot(
					tagsInput
						.split(',')
						.map((t) => t.trim())
						.filter((t) => t !== '')
				)
			};

			await db.techs.add(dataToSave);

			// 清空欄位
			name = '';
			tagsInput = '';
			checkpoints = ['', '', ''];
		} catch (error) {
			console.error('資料庫寫入失敗:', error);
		}
	}

	async function deleteTech(id) {
		if (confirm('確定刪除？')) {
			await db.techs.delete(id);
		}
	}

	async function toggleFocus(item) {
		await db.techs.update(item.id, { is_focused: !item.is_focused });
	}
</script>

<div class="terminal">
	<h2>> LIBRARY_MANAGEMENT</h2>

	<div class="add-section">
		<input bind:value={name} placeholder="技術名稱" /><br />
		<input bind:value={checkpoints[0]} placeholder="要點 1" /><br />
		<input bind:value={checkpoints[1]} placeholder="要點 2" /><br />
		<input bind:value={checkpoints[2]} placeholder="要點 3" /><br />
		<input bind:value={tagsInput} placeholder="標籤 (用逗號隔開)" /><br />
		<button class="link-style btn-primary" onclick={addTech}>[ SAVE_NEW_TECH ]</button>
	</div>

	<div class="list">
		{#if techs && techs.length > 0}
			{#each techs as item (item.id)}
				<div class="item">
					<pre>+---------------------------------------+</pre>
					<p>| NAME: {item.name}</p>
					<p>| TAGS: {item.tags?.join(', ')}</p>
					<p>| FOCUS: {item.is_focused ? '[V]' : '[ ]'}</p>
					<p>| PRACTICE: {item.practice_count || 0} reps</p>
					<div class="actions">
						|
						<button
							class="link-style {item.is_focused ? 'btn-destructive' : 'btn-primary'}"
							onclick={() => toggleFocus(item)}
						>
							[{item.is_focused ? 'UNFOCUS' : 'FOCUS'}]
						</button>
						<button class="link-style btn-destructive" onclick={() => deleteTech(item.id)}>
							[DELETE]
						</button>
					</div>
					<pre>+---------------------------------------+</pre>
				</div>
			{/each}
		{:else if techs}
			<pre>[ NO_TECHS_FOUND ]</pre>
		{/if}
	</div>
</div>

<style>
	/* 針對整個頁面進行背景與基礎文字顏色設定 */
	:global(body) {
		background-color: #1f1f1f;
		color: #73b455;
		/* 優先使用 IBM Plex Mono，後備使用系統內建等寬字體 */
		font-family: 'IBM Plex Mono', 'Courier New', monospace;
		margin: 0;
		padding: 20px;
		-webkit-font-smoothing: antialiased; /* 讓字體在 Mac/Chrome 上更清晰 */
	}

	:global(input, button, pre, a) {
		font-family: 'IBM Plex Mono', monospace !important;
	}

	pre {
		margin: 0;
		font-family: 'Courier New', monospace;
		line-height: 1.2;
		color: #73b455; /* 套用你的指定綠 */
	}

	/* 輸入框樣式調整 */
	input {
		background: transparent;
		border: none;
		border-bottom: 1px solid #73b455;
		color: #73b455;
		outline: none;
		font-family: inherit;
		padding: 2px 5px;
		margin-bottom: 10px;
	}

	input::placeholder {
		color: #73b455;
		opacity: 0.3; /* 讓提示文字更暗一點 */
	}

	/* 按鈕與連結樣式 */
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
		color: #1f1f1f; /* 反白時文字變背景色 */
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

	.btn-destructive {
		color: #d32f2f;
		border: 1px solid #d32f2f;
	}
	.btn-destructive:hover {
		background: #d32f2f;
		color: #fff;
		box-shadow: 0 0 5px #d32f2f;
	}
</style>
