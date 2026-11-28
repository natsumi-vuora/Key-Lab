// 基本功：節拍閃卡的題目產生器。在琴上彈，網站只負責按拍子出題、翻答案、記哪幾張太慢。
import { KEYS, diatonic, pretty, chroma, parseChord } from './theory.js';
import { inversion, shell, upperTriad, nearestRight, voicingOf } from './chordbook.js';

/** 五度圈順序（每往右一格多一個升記號、往左一格多一個降記號） */
export const CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
/** 練新調的順序：每個新調只多一個黑鍵 */
export const LEARN_ORDER = ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb', 'E', 'Ab', 'B', 'Db', 'F#'];
/** ii–V–I 繞調：往下五度（四度圈） */
export const FOURTHS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'F#', 'B', 'E', 'A', 'D', 'G'];

const ROMAN3 = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const ROMAN7 = ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'];

export const DEGREE_GROUPS = [
  { id: '45', name: 'IV 與 V', degrees: [4, 5] },
  { id: '62', name: 'vi 與 ii', degrees: [6, 2] },
  { id: '37', name: 'iii 與 vii°', degrees: [3, 7] },
  { id: 'all', name: '全部', degrees: [1, 2, 3, 4, 5, 6, 7] },
];

/** 順階換算的捷徑：從主音怎麼走 */
export const DEGREE_JUMPS = [
  { d: 2, roman: 'ii', how: '往上全音（2 個半音）' },
  { d: 3, roman: 'iii', how: '往上大三度（4 個半音）' },
  { d: 4, roman: 'IV', how: '往上四度（5 個半音）＝五度圈往左一格' },
  { d: 5, roman: 'V', how: '往上五度（7 個半音）＝五度圈往右一格' },
  { d: 6, roman: 'vi', how: '往下小三度（3 個半音）＝關係小調' },
  { d: 7, roman: 'vii°', how: '往下半音' },
];

export const PROG_PATTERNS = [
  { id: '1564', name: 'I–V–vi–IV', degrees: [1, 5, 6, 4] },
  { id: '6415', name: 'vi–IV–I–V', degrees: [6, 4, 1, 5] },
  { id: '1645', name: 'I–vi–IV–V', degrees: [1, 6, 4, 5] },
  { id: '4536', name: 'IV–V–iii–vi', degrees: [4, 5, 3, 6] },
  { id: '1451', name: 'I–IV–V–I', degrees: [1, 4, 5, 1] },
  { id: '2516', name: 'ii–V–I–vi', degrees: [2, 5, 1, 6] },
];

export const SONG7_PATTERNS = [
  { id: '6251', name: 'vi–ii–V–I', degrees: [6, 2, 5, 1] },
  { id: '1625', name: 'I–vi–ii–V', degrees: [1, 6, 2, 5] },
  { id: '3625', name: 'iii–vi–ii–V', degrees: [3, 6, 2, 5] },
  { id: '1436', name: 'I–IV–iii–vi', degrees: [1, 4, 3, 6] },
  { id: '4361', name: 'IV–iii–vi–I（neo soul）', degrees: [4, 3, 6, 1] },
];

export const SEVENTH_QUALITIES = [
  ['maj7', 'maj7'],
  ['m7', 'm7'],
  ['7', '7'],
  ['m7b5', 'm7♭5'],
];

export const MODES = [
  { id: 'degree', name: '順階換算', desc: '題目是「調＋級數」，在琴上彈出那個三和弦（或七和弦）。' },
  { id: 'prog', name: '羅馬數字進行', desc: '一個調裡的常見進行，只看羅馬數字彈，練到聽到調名就能彈。' },
  { id: 'seventh', name: '七和弦閃卡', desc: '隨機七和弦，看到名稱就彈。慢的和弦會比較常出現。' },
  { id: 'iivi', name: 'ii–V–I 繞調', desc: '往下五度繞完 12 個調：3 度不動、7 度往下一步。' },
  { id: 'song7', name: '七和弦進行', desc: '歌裡最常見的七和弦進行，每幾輪換一個調。' },
];

export const VOICINGS = [
  ['upper', '3 度上的三和弦'],
  ['shell', 'Shell'],
  ['root', '原位四音'],
];

export const DEFAULT_DRILL = {
  mode: 'degree',
  keyMode: 'all', // 'one' | 'all'
  key: 'G',
  group: '45',
  sevenths: false,
  pattern: '1564',
  song7: '6251',
  roots: 'white', // 'white' | 'all'
  qualities: ['maj7', 'm7', '7', 'm7b5'],
  voicing: 'upper',
  beats: 4,
  reveal: 'last', // 'hide' | 'last' | 'always'
  sound: false,
  rotate: 2, // 進行每幾輪換調（0 = 不換）
};

/** 網址預設：#/drills/degree-45 之類 */
export const PRESETS = {
  'degree-45': { mode: 'degree', group: '45', keyMode: 'all', sevenths: false },
  'degree-62': { mode: 'degree', group: '62', keyMode: 'all', sevenths: false },
  'degree-37': { mode: 'degree', group: '37', keyMode: 'all', sevenths: false },
  'degree-all': { mode: 'degree', group: 'all', keyMode: 'all', sevenths: false },
  'degree-7': { mode: 'degree', group: 'all', keyMode: 'all', sevenths: true },
  prog: { mode: 'prog', pattern: '1564', rotate: 2 },
  'seventh-white': { mode: 'seventh', roots: 'white', voicing: 'upper' },
  'seventh-all': { mode: 'seventh', roots: 'all', voicing: 'upper' },
  iivi: { mode: 'iivi', voicing: 'shell' },
  'iivi-upper': { mode: 'iivi', voicing: 'upper' },
  song7: { mode: 'song7', song7: '6251', voicing: 'upper', rotate: 2 },
};

const WHITE_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_SPELLINGS = [['Db', 'C#'], ['Eb', 'D#'], ['Gb', 'F#'], ['Ab', 'G#'], ['Bb', 'A#']];
const AWKWARD = /^(Cb|Fb|E#|B#)$|##|bb/;
/** 黑鍵根音的七和弦挑好讀的拼法：D♭7 而不是 C♯7、C♯m7 而不是 D♭m7（避免 F♭、E♯、重升降） */
export function readableName(roots, q) {
  const score = (n) => (parseChord(n)?.pcs || []).filter((pc) => AWKWARD.test(pc)).length;
  return roots.map((r) => r + q).reduce((best, n) => (score(n) < score(best) ? n : best));
}

function weightedPick(items, weightOf) {
  const ws = items.map((x) => 1 + 2 * (weightOf(x) || 0));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i += 1) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** 和弦 → 排法（答案用的鍵盤圖） */
export function voiceCard(name, voicing, prevRight, isTriad) {
  if (isTriad) {
    const right = nearestRight(prevRight, name, 'triad');
    const base = inversion(name, 0);
    return { ...base, right: right || base.right, label: prevRight ? '最近轉位' : '原位' };
  }
  if (voicing === 'upper') return upperTriad(name, prevRight) || voicingOf(name, 'inv0');
  if (voicing === 'shell') {
    const right = nearestRight(prevRight, name, 'shell');
    const base = shell(name);
    return base ? { ...base, right: right || base.right } : voicingOf(name, 'inv0');
  }
  return { ...voicingOf(name, 'inv0'), label: '原位四音' };
}

/**
 * 產生下一張卡。state 會被更新（記錄調、第幾輪…）。
 * 卡片：{ id（記錄太慢用）, prompt（大字）, sub（小字）, name（和弦）, hint }
 */
export function nextCard(s, state, slow = {}) {
  state.n = (state.n || 0) + 1;
  if (s.mode === 'degree') {
    const group = DEGREE_GROUPS.find((g) => g.id === s.group) || DEGREE_GROUPS[0];
    const combos = [];
    const keys = s.keyMode === 'one' ? [s.key] : KEYS;
    for (const k of keys) for (const d of group.degrees) combos.push([k, d]);
    let pick;
    for (let i = 0; i < 20; i += 1) {
      pick = weightedPick(combos, ([k, d]) => slow[`deg:${k}:${d}`]);
      if (!state.prev || `${pick[0]}${pick[1]}` !== state.prev || combos.length < 2) break;
    }
    state.prev = `${pick[0]}${pick[1]}`;
    const [k, d] = pick;
    const c = diatonic(k, s.sevenths)[d - 1];
    const jump = DEGREE_JUMPS.find((j) => j.d === d);
    return {
      id: `deg:${k}:${d}`,
      prompt: s.sevenths ? ROMAN7[d - 1] : ROMAN3[d - 1],
      sub: `${pretty(k)} 大調`,
      name: c.name,
      triad: !s.sevenths,
      hint: jump ? `${jump.roman}：${jump.how}` : 'I：主音',
      label: `${pretty(k)} ${s.sevenths ? ROMAN7[d - 1] : ROMAN3[d - 1]}`,
    };
  }
  if (s.mode === 'prog' || s.mode === 'song7') {
    const list = s.mode === 'prog' ? PROG_PATTERNS : SONG7_PATTERNS;
    const pat = list.find((p) => p.id === (s.mode === 'prog' ? s.pattern : s.song7)) || list[0];
    if (state.i == null) {
      state.i = 0;
      state.loop = 0;
      state.key = s.key;
    }
    const d = pat.degrees[state.i];
    const sev = s.mode === 'song7';
    const c = diatonic(state.key, sev)[d - 1];
    const roman = sev ? ROMAN7[d - 1] : ROMAN3[d - 1];
    const card = {
      id: `${s.mode}:${state.key}:${d}`,
      prompt: sev ? pretty(c.name) : roman,
      sub: `${pretty(state.key)} 大調・${pat.name}${sev ? `・${roman}` : ''}`,
      name: c.name,
      triad: !sev,
      label: `${pretty(state.key)} ${roman}`,
      step: state.i,
      length: pat.degrees.length,
    };
    state.i += 1;
    if (state.i >= pat.degrees.length) {
      state.i = 0;
      state.loop += 1;
      if (s.rotate && state.loop % s.rotate === 0) {
        // 依「練新調的順序」換下一個調
        const order = LEARN_ORDER;
        state.key = order[(order.indexOf(state.key) + 1) % order.length];
        state.keyChanged = true;
      }
    }
    return card;
  }
  if (s.mode === 'seventh') {
    const roots = s.roots === 'white' ? WHITE_ROOTS.map((r) => [r]) : [...WHITE_ROOTS.map((r) => [r]), ...BLACK_SPELLINGS];
    const qs = s.qualities.length ? s.qualities : ['maj7', 'm7', '7', 'm7b5'];
    const names = roots.flatMap((rs) => qs.map((q) => readableName(rs, q)));
    let name;
    for (let i = 0; i < 20; i += 1) {
      name = weightedPick(names, (n) => slow[`7:${n}`]);
      if (name !== state.prev) break;
    }
    state.prev = name;
    return { id: `7:${name}`, prompt: pretty(name), sub: '看到就彈', name, triad: false, label: pretty(name) };
  }
  if (s.mode === 'iivi') {
    if (state.i == null) {
      state.i = 0;
      state.k = Math.max(0, FOURTHS.indexOf(s.key));
    }
    const key = FOURTHS[state.k];
    const dia = diatonic(key, true);
    const seq = [dia[1], dia[4], dia[0], dia[0]];
    const romans = ['ii7', 'V7', 'Imaj7', 'Imaj7'];
    const c = seq[state.i];
    const card = {
      id: `7:${c.name}`,
      prompt: pretty(c.name),
      sub: `${pretty(key)} 大調 ii–V–I・${romans[state.i]}`,
      name: c.name,
      triad: false,
      label: pretty(c.name),
      step: state.i,
      length: 4,
    };
    state.i += 1;
    if (state.i >= 4) {
      state.i = 0;
      state.k = (state.k + 1) % FOURTHS.length;
    }
    return card;
  }
  return null;
}

/** 一張卡太慢的計數 key → 顯示文字 */
export function slowLabel(id) {
  const [type, a, b] = id.split(':');
  if (type === 'deg') return `${pretty(a)} ${ROMAN3[Number(b) - 1]}`;
  if (type === '7') return pretty(a);
  if (type === 'prog' || type === 'song7') return `${pretty(a)} ${ROMAN3[Number(b) - 1]}`;
  return id;
}

export { KEYS, chroma, ROMAN3, ROMAN7 };
