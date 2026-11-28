// 狀態與 localStorage：偏好設定、課表打勾、測驗紀錄、上次看到哪一課。可匯出匯入。
import { useSyncExternalStore } from 'react';
import { DEFAULT_DRILL } from './drills.js';

const KEY = 'keylab:v1';

export const DEFAULTS = {
  voice: 'piano', // 'piano' | 'pad'
  labelMode: 'note', // 'note' | 'degree'
  vol: { master: 0, keys: 0, pad: -10, bass: -6, drums: -8, click: -6, drone: -10 },
  mute: { keys: false, pad: false, bass: false, drums: false, click: false, drone: false },
  bpm: 80,
  meter: '4/4',
  plan: {}, // { itemId: true }
  quiz: { best: {}, total: 0, right: 0 },
  last: null, // { to, title, at }
  drone: { root: 'D', mode: 'major', fifth: true },
  daily: { date: '', done: false },
  backing: { id: 'l-1', mode: 'close', transpose: 0, style: null, bpm: null },
  drills: { ...DEFAULT_DRILL, slow: {} }, // 基本功設定；slow = { 卡片 id: 按「太慢」的次數 }
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const saved = JSON.parse(raw);
    return merge(structuredClone(DEFAULTS), saved);
  } catch {
    return structuredClone(DEFAULTS);
  }
}
function merge(base, extra) {
  for (const k of Object.keys(extra || {})) {
    const v = extra[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') base[k] = merge(base[k], v);
    else base[k] = v;
  }
  return base;
}

let state = load();
const listeners = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 私密瀏覽或空間不足時只存在記憶體 */
  }
}

export const getPrefs = () => state;
export function setPrefs(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = merge(structuredClone(state), next);
  save();
  listeners.forEach((fn) => fn());
}
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function usePrefs(selector = (s) => s) {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(DEFAULTS));
}

/** 課表打勾 */
export function togglePlan(id) {
  const plan = { ...state.plan };
  if (plan[id]) delete plan[id];
  else plan[id] = true;
  state = { ...state, plan };
  save();
  listeners.forEach((fn) => fn());
}

/** 記住上次看到哪一課 */
export function rememberPage(to, title) {
  if (state.last && state.last.to === to) return;
  setPrefs({ last: { to, title, at: Date.now() } });
}

/** 測驗紀錄：連續答對的最佳紀錄 */
export function recordQuiz(mode, streak, correct) {
  const best = { ...state.quiz.best };
  if (streak > (best[mode] || 0)) best[mode] = streak;
  setPrefs({ quiz: { best, total: state.quiz.total + 1, right: state.quiz.right + (correct ? 1 : 0) } });
}

export function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'key-lab', version: 1, data: state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `key-lab-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importData(file) {
  const text = await file.text();
  const json = JSON.parse(text);
  if (!json || json.app !== 'key-lab' || !json.data) throw new Error('不是 Key Lab 的紀錄檔');
  state = merge(structuredClone(DEFAULTS), json.data);
  save();
  listeners.forEach((fn) => fn());
}
