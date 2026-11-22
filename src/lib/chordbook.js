// 鍵盤排法：和弦音由 tonal 從名稱算出，排法由規則產生（不需要指型資料庫）。
// 一個排法（voicing）= { name, label, left: [midi...], right: [midi...], tip }
import { Note } from 'tonal';
import { parseChord, chroma, midiOf, noteNameIn, spellAt, degreeOf, pcNames, KEYS } from './theory.js';

// 音域窗口（midi）
const LEFT_LO = 40; // E2：左手根音的最低位置
const RIGHT_BOTTOM_LO = 55; // G3：右手原位/轉位最低音的下限
const RIGHT_MIN = 50; // 右手整體下限（D3）
const RIGHT_MAX = 81; // 右手整體上限（A5）
const CENTER = 64;

/** 從 lo 開始往上找到第一個符合 pc 的 midi */
export function atOrAbove(pc, lo) {
  const c = chroma(pc + '4');
  let m = lo;
  while (((m % 12) + 12) % 12 !== c) m += 1;
  return m;
}
/** 依序往上疊：每個音都比前一個高 */
export function stackUp(pcs, bottom) {
  const out = [];
  let lo = bottom;
  for (const pc of pcs) {
    const m = atOrAbove(pc, lo);
    out.push(m);
    lo = m + 1;
  }
  return out;
}

const leftRoot = (info) => atOrAbove(info.bass || info.root, LEFT_LO);

/** 右手要彈的音：四音以內；超過時先拿掉根音（左手有），再拿掉 5 度 */
export function rightPcs(info, max = 4) {
  let list = info.pcs.map((pc, i) => ({ pc, label: info.labels[i] }));
  if (list.length > max) list = list.filter((x) => x.label !== 'R');
  if (list.length > max) list = list.filter((x) => x.label !== '5');
  return list.slice(0, max).map((x) => x.pc);
}

const rotate = (arr, n) => arr.slice(n).concat(arr.slice(0, n));
const INV_NAMES = ['原位', '第一轉位', '第二轉位', '第三轉位'];
const INV_TIPS = ['最低音是根音', '最低音是 3 度', '最低音是 5 度', '最低音是 7 度'];

/** 轉位：inv = 0 原位、1 第一轉位…（三和弦 0–2，七和弦 0–3） */
export function inversion(name, inv = 0) {
  const info = parseChord(name);
  if (!info) return null;
  const pcs = info.pcs.slice(0, 4);
  const n = inv % pcs.length;
  const right = stackUp(rotate(pcs, n), RIGHT_BOTTOM_LO);
  const lowLabel = info.labels[n];
  return {
    name,
    kind: `inv${n}`,
    label: INV_NAMES[n],
    left: [leftRoot(info)],
    right,
    tip: n === 0 ? INV_TIPS[0] : `最低音是 ${lowLabel} 度`.replace('R 度', '根音'),
  };
}
export function inversionCount(name) {
  const info = parseChord(name);
  return info ? Math.min(info.pcs.length, 4) : 0;
}

const findLabel = (info, test) => {
  const i = info.labels.findIndex(test);
  return i >= 0 ? info.pcs[i] : null;
};
const thirdOf = (info) => findLabel(info, (l) => l === '3' || l === '♭3') || findLabel(info, (l) => l === '4' || l === '2');
const seventhOf = (info) => findLabel(info, (l) => l === '7' || l === '♭7' || l === '°7') || findLabel(info, (l) => l === '6');

/** Shell voicing：左手根音，右手只彈 3 度與 7 度。form 'a' = 3 度在下，'b' = 7 度在下 */
export function shell(name, form) {
  const info = parseChord(name);
  if (!info) return null;
  const t = thirdOf(info);
  const s = seventhOf(info);
  if (!t || !s) return null;
  const a = stackUp([t, s], 52);
  const b = stackUp([s, t], 52);
  let right;
  if (form === 'a') right = a;
  else if (form === 'b') right = b;
  else right = Math.abs(a[0] - 60) <= Math.abs(b[0] - 60) ? a : b;
  return { name, kind: 'shell', label: 'Shell', left: [leftRoot(info)], right, tip: '右手只留 3 度與 7 度：決定和弦性格的兩個音' };
}

/** 開放排列：左手 1–5，右手 3–7–9（沒有 7 度用 6 或 5，沒有 9 度用根音） */
export function openVoicing(name) {
  const info = parseChord(name);
  if (!info) return null;
  const root = info.bass || info.root;
  const five = findLabel(info, (l) => /^[♭♯]?5$/.test(l));
  const lr = atOrAbove(root, 36);
  const left = five && !info.bass ? [lr, atOrAbove(five, lr + 1)] : [lr, lr + 12];
  const t = thirdOf(info) || info.root;
  const mid = seventhOf(info) || five || info.root;
  const top = findLabel(info, (l) => /9$/.test(l)) || info.root;
  const right = stackUp([t, mid, top], 50);
  return { name, kind: 'open', label: '開放排列', left, right, tip: '左手根音與 5 度張開，右手 3、7、9 疊在上面，聲音更寬' };
}

/** 依 kind 取一個排法 */
export function voicingOf(name, kind = 'inv0') {
  if (kind.startsWith('inv')) return inversion(name, Number(kind.slice(3)) || 0);
  if (kind === 'shell') return shell(name);
  if (kind === 'open') return openVoicing(name);
  return inversion(name, 0);
}

// ---------- 最近轉位（聲部連接） ----------

function candidates(name, mode) {
  const info = parseChord(name);
  if (!info) return [];
  const out = [];
  if (mode === 'shell') {
    const t = thirdOf(info);
    const s = seventhOf(info) || findLabel(info, (l) => /5$/.test(l));
    if (t && s) for (let lo = RIGHT_MIN; lo < RIGHT_MIN + 24; lo += 1) {
      for (const order of [[t, s], [s, t]]) {
        if (chroma(order[0] + '4') !== ((lo % 12) + 12) % 12) continue;
        out.push(stackUp(order, lo));
      }
    }
    return out;
  }
  const pcs = rightPcs(info, mode === 'triad' ? 3 : 4);
  for (let r = 0; r < pcs.length; r += 1) {
    const order = rotate(pcs, r);
    for (let lo = RIGHT_MIN; lo <= RIGHT_MAX - 7; lo += 1) {
      if (chroma(order[0] + '4') !== ((lo % 12) + 12) % 12) continue;
      const v = stackUp(order, lo);
      if (v[v.length - 1] <= RIGHT_MAX) out.push(v);
    }
  }
  return out;
}

function moveCost(a, b) {
  const near = (x, arr) => Math.min(...arr.map((y) => Math.abs(x - y)));
  if (a.length === b.length) {
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    return sa.reduce((s, x, i) => s + Math.abs(x - sb[i]), 0);
  }
  return (a.reduce((s, x) => s + near(x, b), 0) + b.reduce((s, x) => s + near(x, a), 0)) / 2;
}
const mean = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;

/** 從上一個右手排法，找移動最少的下一個排法 */
export function nearestRight(prev, name, mode = 'close') {
  const list = candidates(name, mode);
  if (!list.length) return null;
  let best = null;
  let bestCost = Infinity;
  for (const v of list) {
    const cost = (prev ? moveCost(prev, v) : 0) + 0.25 * Math.abs(mean(v) - CENTER);
    if (cost < bestCost) {
      bestCost = cost;
      best = v;
    }
  }
  return best;
}

/**
 * 整段進行用最近轉位排好。mode: 'triad' | 'close'（四音內）| 'shell'
 * 回傳每個和弦的 { name, left, right, common: [midi...]（和上一個共同的音） }
 */
export function voiceProgression(names, mode = 'close', start) {
  const out = [];
  let prev = start || null;
  for (const name of names) {
    const info = parseChord(name);
    if (!info) {
      out.push({ name, left: [], right: [], common: [] });
      continue;
    }
    const right = nearestRight(prev, name, mode) || [];
    const common = prev ? right.filter((m) => prev.includes(m)) : [];
    out.push({ name, kind: 'nearest', label: '最近轉位', left: [leftRoot(info)], right, common });
    prev = right;
  }
  return out;
}

// ---------- 譜例／單元資料：音名字串 ↔ midi ----------

export const parseNotes = (s) => (Array.isArray(s) ? s : String(s || '').split(/\s+/).filter(Boolean)).map(midiOf).filter((m) => m != null);
export function fromSpec(spec) {
  return { ...spec, left: parseNotes(spec.left), right: parseNotes(spec.right) };
}
/** midi 陣列 → 依和弦拼法的音名（含八度） */
export function spellVoicing(name, midis) {
  return midis.map((m) => spellAt(m, noteNameIn(name, m)));
}

/** 鍵盤標示：voicing → { midi: { hand, label, degree, note, common } } */
export function marksFor(v, { common = [] } = {}) {
  const marks = {};
  if (!v) return marks;
  const name = v.name;
  const put = (m, hand) => {
    const degree = degreeOf(name, m);
    marks[m] = { hand, degree, note: noteNameIn(name, m), common: common.includes(m) };
  };
  (v.left || []).forEach((m) => put(m, 'L'));
  (v.right || []).forEach((m) => put(m, 'R'));
  return marks;
}

// ---------- 和弦表：常用和弦與搜尋 ----------

export const TYPES = [
  { s: '', zh: '大三', en: 'major' },
  { s: 'm', zh: '小三', en: 'minor' },
  { s: 'dim', zh: '減三', en: 'dim' },
  { s: 'aug', zh: '增三', en: 'aug' },
  { s: 'sus2', zh: '掛二', en: 'sus2' },
  { s: 'sus4', zh: '掛四', en: 'sus4' },
  { s: 'maj7', zh: '大七', en: 'maj7' },
  { s: '7', zh: '屬七', en: 'dominant 7' },
  { s: 'm7', zh: '小七', en: 'm7' },
  { s: 'm7b5', zh: '半減七', en: 'half-diminished' },
  { s: 'dim7', zh: '減七', en: 'dim7' },
  { s: '7sus4', zh: '七掛四', en: '7sus4' },
  { s: '6', zh: '大六', en: '6' },
  { s: 'm6', zh: '小六', en: 'm6' },
  { s: 'add9', zh: '加九', en: 'add9' },
  { s: 'madd9', zh: '小加九', en: 'madd9' },
  { s: 'maj9', zh: '大九', en: 'maj9' },
  { s: 'm9', zh: '小九', en: 'm9' },
  { s: '9', zh: '屬九', en: '9' },
];

export const COMMON = [
  'C', 'Dm', 'Em', 'F', 'G', 'Am', 'D', 'E', 'A', 'Bb', 'Bm', 'F#m',
  'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5', 'E7', 'A7', 'D7',
  'Csus2', 'Dsus4', 'Cadd9', 'C6', 'Am9', 'Fmaj9',
];

const ZH_ALIASES = { 大三和弦: '', 小三和弦: 'm', 大七和弦: 'maj7', 屬七和弦: '7', 小七和弦: 'm7', 減: 'dim', 增: 'aug' };

/** 搜尋：名稱 F#m7、類型 sus4、中文 大七、音名 C E G（反查） */
export function searchChords(q) {
  q = String(q || '').trim();
  if (!q) return [];
  const results = [];
  const add = (n) => {
    if (parseChord(n) && !results.includes(n)) results.push(n);
  };
  // 音名反查：兩個以上音名
  const tokens = q.replace(/[,，、]/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length >= 2 && tokens.every((t) => /^[A-Ga-g][#b♯♭]?$/.test(t))) {
    const notes = tokens.map((t) => t[0].toUpperCase() + t.slice(1).replace('♯', '#').replace('♭', 'b'));
    const set = new Set(notes.map((n) => chroma(n + '4')));
    for (const root of KEYS.concat(['C#', 'D#', 'G#', 'A#', 'Gb'])) {
      for (const t of TYPES) {
        const info = parseChord(root + t.s);
        if (!info) continue;
        const cs = new Set(info.pcs.map((p) => chroma(p + '4')));
        if (cs.size === set.size && [...cs].every((c) => set.has(c))) {
          const bass = notes[0];
          add(chroma(bass + '4') === chroma(root + '4') ? root + t.s : `${root}${t.s}/${bass}`);
        }
      }
    }
    return results;
  }
  // 中文類型
  const zh = TYPES.find((t) => t.zh === q) || (ZH_ALIASES[q] !== undefined && TYPES.find((t) => t.s === ZH_ALIASES[q]));
  if (zh) {
    KEYS.forEach((k) => add(k + zh.s));
    return results;
  }
  // 類型（sus4、m7…）
  const ty = TYPES.find((t) => t.s && t.s.toLowerCase() === q.toLowerCase());
  if (ty && !/^[A-G]/.test(q)) {
    KEYS.forEach((k) => add(k + ty.s));
    return results;
  }
  // 和弦名稱
  const name = q.replace('♯', '#').replace(/^([a-g])/, (m) => m.toUpperCase());
  if (parseChord(name)) add(name);
  // 前綴：輸入 F# 時列出 F# 的各種和弦
  const m = name.match(/^([A-G][#b]?)(.*)$/);
  if (m) {
    for (const t of TYPES) if (t.s.toLowerCase().startsWith(m[2].toLowerCase())) add(m[1] + t.s);
  }
  return results.slice(0, 40);
}

export function typeZh(name) {
  const info = parseChord(name);
  if (!info) return '';
  const suffix = info.main.replace(/^[A-G][#b]?/, '');
  const t = TYPES.find((x) => x.s === suffix) || TYPES.find((x) => parseChord('C' + x.s)?.type === info.type);
  return t ? t.zh : info.type;
}

export const allPcsOf = (name) => {
  const info = parseChord(name);
  return info ? info.pcs : [];
};
export { Note, pcNames };
