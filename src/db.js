import Dexie from 'dexie';

export const db = new Dexie('BJJ_Lab');

// 這裡定義的是索引欄位，++id 代表自增主鍵
// name, last_trained, is_focused 是我們之後可能會用來排序或篩選的欄位
db.version(5).stores({
	techs: '++id, name, last_trained, is_focused, practice_count',
	missions: '++id, tech_id, status, created_at, session_reps',
	logs: '++id, date'
});
