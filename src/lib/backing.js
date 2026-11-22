// 配樂控制：選哪一段進行、排法、移調、節奏型。配樂頁與底部工具列共用。
import { progressionById, patternById, KEY_LAB } from '../data/keys.js';
import { voiceProgression } from './chordbook.js';
import { KEYS, chroma, parseChord } from './theory.js';
import { getPrefs, setPrefs } from './store.js';
import { startBacking, stopBacking, updateBacking, getTransportState } from './audio.js';

export const VOICING_MODES = [
  ['triad', '三和弦'],
  ['close', '四音內'],
  ['shell', 'Shell'],
];

/** 移調：根音與低音都換成 KEYS 的常用拼法 */
export function transposeName(name, semis) {
  if (!semis) return name;
  const move = (pc) => KEYS[(chroma(pc + '4') + semis + 120) % 12];
  const [main, bass] = name.split('/');
  const m = /^([A-G][#b]?)(.*)$/.exec(main);
  if (!m) return name;
  return move(m[1]) + m[2] + (bass ? '/' + move(bass) : '');
}

export function currentSelection() {
  const b = getPrefs().backing;
  const prog = progressionById(b.id) || KEY_LAB.progressions[0];
  return { prog, ...b, style: b.style || prog.style };
}

/** 把進行排成每小節的排法：[[{name,left,right,common}], ...] */
export function buildBars(prog, { mode = 'close', transpose = 0 } = {}) {
  const barsNames = prog.bars.map((bar) => bar.split(/\s+/).map((n) => transposeName(n, transpose)));
  const flat = barsNames.flat();
  // shell 只適用七和弦；三和弦退回三音
  const voiced = [];
  let prev = null;
  for (const n of flat) {
    const info = parseChord(n);
    const m = mode === 'shell' && info && !info.labels.some((l) => /7|6/.test(l)) ? 'triad' : mode;
    const [v] = voiceProgression([n], m, prev);
    voiced.push(v);
    prev = v.right.length ? v.right : prev;
  }
  // 讓第一個和弦也算上一輪最後一個和弦的共同音（循環）
  if (voiced.length > 1) {
    const last = voiced[voiced.length - 1].right;
    voiced[0] = { ...voiced[0], common: voiced[0].right.filter((x) => last.includes(x)) };
  }
  let k = 0;
  return barsNames.map((names) => names.map(() => voiced[k++]));
}

export async function playSelection(patch = {}) {
  if (Object.keys(patch).length) setPrefs({ backing: patch });
  const sel = currentSelection();
  const bars = buildBars(sel.prog, sel);
  const pattern = patternById(sel.style);
  await startBacking({ id: sel.prog.id, name: sel.prog.name, bars, pattern, bpm: getPrefs().bpm });
}

/** 播放中改設定：重新排、不中斷 */
export function refreshSelection(patch = {}) {
  setPrefs({ backing: patch });
  const sel = currentSelection();
  if (getTransportState().playing) {
    updateBacking({ bars: buildBars(sel.prog, sel), pattern: patternById(sel.style), id: sel.prog.id, name: sel.prog.name });
  }
}

export { stopBacking };
