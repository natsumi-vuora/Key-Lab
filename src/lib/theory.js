// 樂理基礎：音名、級數、順階和弦、調式。和弦組成交給 tonal 計算。
import { Chord, Note, Scale } from 'tonal';

/** 顯示用：# → ♯、音名後的 b → ♭（Bbmaj7 → B♭maj7，m7b5 的 b5 保留） */
export const pretty = (name) => String(name).replace(/#/g, '♯').replace(/([A-G])b/g, '$1♭');
export const plain = (name) => String(name).replace(/♯/g, '#').replace(/♭/g, 'b');

/** 十二個調的根音（大調常用拼法） */
export const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const midiOf = (n) => (typeof n === 'number' ? n : Note.midi(n));
export const chroma = (n) => ((midiOf(n) % 12) + 12) % 12;
export const isBlack = (midi) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);

/** 把 midi 依照指定音名（不含八度）拼成帶八度的音名，例：spellAt(61, 'Db') → 'Db4' */
export function spellAt(midi, pc) {
  for (const oct of [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    if (Note.midi(pc + oct) === midi) return pc + oct;
  }
  return Note.fromMidi(midi);
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
/** 沒有上下文時的音名：白鍵直接寫，黑鍵寫成「C♯/D♭」 */
export function pcName(midi, prefer = 'both') {
  const c = ((midi % 12) + 12) % 12;
  if (!isBlack(c)) return SHARP_NAMES[c];
  if (prefer === 'sharp') return SHARP_NAMES[c];
  if (prefer === 'flat') return FLAT_NAMES[c];
  return `${SHARP_NAMES[c]}/${FLAT_NAMES[c]}`;
}
export const pcNames = (c) => (isBlack(c) ? [SHARP_NAMES[c], FLAT_NAMES[c]] : [SHARP_NAMES[c]]);

/** 去掉重升重降，只用在不得已的時候 */
export function simplify(pc) {
  return /##|bb/.test(pc) ? Note.pitchClass(Note.simplify(pc)) : pc;
}

// ---------- 和弦 ----------

const IV_LABEL = {
  '1P': 'R', '8P': 'R', '2m': '♭9', '2M': '2', '3m': '♭3', '3M': '3', '4P': '4', '4A': '♯11', '5d': '♭5', '5P': '5', '5A': '♯5',
  '6m': '♭13', '6M': '6', '7d': '°7', '7m': '♭7', '7M': '7', '9m': '♭9', '9M': '9', '9A': '♯9', '11P': '11', '11A': '♯11', '13m': '♭13', '13M': '13',
};
const SEMI_LABEL = ['R', '♭9', '9', '♭3', '3', '4', '♭5', '5', '♯5', '6', '♭7', '7'];

/** 解析和弦名稱（含 slash chord）。回傳 { name, symbol, root, bass, pcs, intervals, labels, type } */
const cache = new Map();
export function parseChord(name) {
  name = plain(String(name).trim());
  if (cache.has(name)) return cache.get(name);
  const [main, bassPart] = name.split('/');
  const c = Chord.get(main);
  if (c.empty || !c.tonic) {
    cache.set(name, null);
    return null;
  }
  const bass = bassPart && Note.get(bassPart).pc ? Note.get(bassPart).pc : null;
  const pcs = c.notes.map(simplify);
  const labels = c.intervals.map((iv) => IV_LABEL[iv] || iv);
  const info = {
    name,
    main,
    root: c.tonic,
    bass,
    pcs,
    intervals: c.intervals,
    semis: c.intervals.map((iv) => ((semisOf(iv) % 12) + 12) % 12),
    labels,
    type: c.type,
    aliases: c.aliases,
    quality: c.quality,
  };
  cache.set(name, info);
  return info;
}
function semisOf(iv) {
  const n = Note.transpose('C4', iv);
  return Note.midi(n) - 60;
}

/** 和弦內某個 midi 音的級數標籤；不在和弦裡的音用半音數推估 */
export function degreeOf(chord, midi) {
  const info = typeof chord === 'string' ? parseChord(chord) : chord;
  if (!info) return '';
  const rel = (chroma(midi) - chroma(info.root + '4') + 12) % 12;
  const i = info.semis.indexOf(rel);
  if (i >= 0) return info.labels[i];
  return SEMI_LABEL[rel];
}
/** 和弦內某個 midi 音的拼法（依和弦拼法） */
export function noteNameIn(chord, midi) {
  const info = typeof chord === 'string' ? parseChord(chord) : chord;
  if (info) {
    const all = info.bass ? [...info.pcs, info.bass] : info.pcs;
    const hit = all.find((pc) => chroma(pc + '4') === chroma(midi));
    if (hit) return hit;
  }
  return pcName(midi, 'sharp');
}

/** 級數 → 顏色類別（沿用 Chord Lab：根音粉紅；3、5、7、延伸音各一色） */
export function degreeKind(label) {
  if (!label) return 'other';
  if (label === 'R') return 'root';
  if (/^♭?3$/.test(label)) return 'third';
  if (/^[♭♯]?5$/.test(label)) return 'fifth';
  if (/^(♭7|7|°7)$/.test(label)) return 'seventh';
  return 'ext';
}
export const DEGREE_COLORS = {
  root: '#ff8ec6',
  third: '#6fb6ff',
  fifth: '#a9b8ff',
  seventh: '#ffc46b',
  ext: '#7fe0b8',
  other: '#cfc9e6',
};
export const degreeColor = (label) => DEGREE_COLORS[degreeKind(label)];

// ---------- 順階和弦 ----------

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const TRIAD_BY_SEMIS = { '4,7': '', '3,7': 'm', '3,6': 'dim', '4,8': 'aug' };
const SEVENTH_BY_SEMIS = { '4,7,11': 'maj7', '3,7,10': 'm7', '4,7,10': '7', '3,6,10': 'm7b5', '3,6,9': 'dim7', '3,7,11': 'mMaj7' };

export function majorScale(key) {
  return Scale.get(`${key} major`).notes.map(simplify);
}

/** 依調性產生七個順階和弦。sevenths=true 時產生七和弦 */
export function diatonic(key, sevenths = false) {
  const sc = majorScale(key);
  return sc.map((pc, i) => {
    const third = sc[(i + 2) % 7];
    const fifth = sc[(i + 4) % 7];
    const seventh = sc[(i + 6) % 7];
    const r = chroma(pc + '4');
    const up = (n) => (chroma(n + '4') - r + 12) % 12;
    const s3 = up(third);
    const s5 = up(fifth);
    const s7 = up(seventh);
    const triadSuffix = TRIAD_BY_SEMIS[`${s3},${s5}`] ?? '';
    const suffix = sevenths ? SEVENTH_BY_SEMIS[`${s3},${s5},${s7}`] ?? '7' : triadSuffix;
    let roman = triadSuffix === 'm' || triadSuffix === 'dim' ? ROMAN[i].toLowerCase() : ROMAN[i];
    if (sevenths) roman += { maj7: 'maj7', m7: '7', '7': '7', m7b5: 'ø7' }[suffix] || '7';
    else if (triadSuffix === 'dim') roman += '°';
    return {
      degree: i + 1,
      roman,
      root: pc,
      name: pc + suffix,
      notes: sevenths ? [pc, third, fifth, seventh] : [pc, third, fifth],
      steps: sevenths ? [s3, s5 - s3, s7 - s5] : [s3, s5 - s3],
    };
  });
}

// ---------- 調式（Drone 用） ----------

export const MODES = [
  { id: 'major', name: '大調（Ionian）', scale: 'major', mood: '明亮、穩定、回到家的感覺。最安全的起點。' },
  { id: 'lydian', name: 'Lydian', scale: 'lydian', mood: '比大調更亮、像飄在空中；♯4 是它的招牌音，聽起來有點夢幻、不落地。' },
  { id: 'mixolydian', name: 'Mixolydian', scale: 'mixolydian', mood: '大調但少了一點「正經」，♭7 讓它鬆、帶點藍調和搖滾味。' },
  { id: 'dorian', name: 'Dorian', scale: 'dorian', mood: '小調但不悲傷，6 度是亮的，酷、帶律動，適合 funk 和 neo soul。' },
  { id: 'aeolian', name: '自然小調（Aeolian）', scale: 'aeolian', mood: '最典型的小調：憂鬱、內省，♭6 讓它更暗。' },
  { id: 'majpent', name: '大調五聲', scale: 'major pentatonic', mood: '只有五個音、沒有半音，怎麼彈都不會錯，開闊、民謠感。' },
  { id: 'minpent', name: '小調五聲', scale: 'minor pentatonic', mood: '藍調與搖滾的基本盤，粗獷、直接。' },
];
export function modeNotes(root, modeId) {
  const m = MODES.find((x) => x.id === modeId) || MODES[0];
  return Scale.get(`${root} ${m.scale}`).notes.map(simplify);
}
/** 音階音相對主音的級數標籤 */
export function scaleDegree(root, pc) {
  const rel = (chroma(pc + '4') - chroma(root + '4') + 12) % 12;
  return ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'][rel];
}

/** 音程速查 */
export const INTERVALS = [
  [0, '同度', 'R'], [1, '小二度', '♭2'], [2, '大二度', '2'], [3, '小三度', '♭3'], [4, '大三度', '3'], [5, '完全四度', '4'],
  [6, '三全音', '♭5 / ♯4'], [7, '完全五度', '5'], [8, '小六度', '♭6'], [9, '大六度', '6'], [10, '小七度', '♭7'], [11, '大七度', '7'], [12, '八度', 'R'],
];
export const SEVENTH_TYPES = [
  { name: 'maj7', zh: '大七', formula: 'R 3 5 7', steps: '4 + 3 + 4', ex: 'Cmaj7' },
  { name: '7', zh: '屬七', formula: 'R 3 5 ♭7', steps: '4 + 3 + 3', ex: 'C7' },
  { name: 'm7', zh: '小七', formula: 'R ♭3 5 ♭7', steps: '3 + 4 + 3', ex: 'Cm7' },
  { name: 'm7b5', zh: '半減七', formula: 'R ♭3 ♭5 ♭7', steps: '3 + 3 + 4', ex: 'Cm7b5' },
  { name: 'dim7', zh: '減七', formula: 'R ♭3 ♭5 °7', steps: '3 + 3 + 3', ex: 'Cdim7' },
];
