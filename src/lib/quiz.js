// 測驗題目產生器：點出音名、點出和弦內音、點出順階和弦的根音
import { KEYS, chroma, isBlack, pretty, parseChord, diatonic, pcNames } from './theory.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ALL_PCS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const CHORD_TYPES = ['maj7', 'm7', '7', 'm7b5', '', 'm'];
const DEG_NAME = { '3': '3 度', '♭3': '3 度', '5': '5 度', '♭5': '5 度', '7': '7 度', '♭7': '7 度' };

export const QUIZ_MODES = [
  { id: 'note', name: '點出音名', desc: '看到音名，在鍵盤上點出來。任何八度都算。' },
  { id: 'tone', name: '和弦內音', desc: '點出和弦的 3 度、5 度或 7 度。' },
  { id: 'tone-37', name: '3 度與 7 度', desc: '只考 3 度和 7 度：shell voicing 的兩個音。' },
  { id: 'diatonic', name: '順階和弦根音', desc: '某個調的第幾級和弦，根音在哪？' },
];

function semisFromRoot(root, pc) {
  return (chroma(pc + '4') - chroma(root + '4') + 12) % 12;
}

export function makeQuestion(mode, { blackOnly = false, prev } = {}) {
  for (let tries = 0; tries < 200; tries += 1) {
    const q = build(mode);
    if (!q) continue;
    if (blackOnly && !isBlack(q.target)) continue;
    if (prev && prev.text === q.text) continue;
    return q;
  }
  return build(mode);
}

function build(mode) {
  if (mode === 'note') {
    const pc = pick(ALL_PCS);
    const c = chroma(pc + '4');
    const names = pcNames(c);
    const other = names.find((n) => n !== pc);
    return {
      mode,
      text: pretty(pc),
      sub: '點出這個音',
      target: c,
      answer: pc,
      explain: isBlack(c)
        ? `${pretty(pc)} 是黑鍵，和 ${pretty(other)} 是同一個鍵。${pc.includes('#') ? `就是 ${pc[0]} 右邊緊鄰的黑鍵` : `就是 ${pc[0]} 左邊緊鄰的黑鍵`}。`
        : `${pc} 是白鍵。${['C', 'F'].includes(pc) ? `${pc} 在兩個黑鍵或三個黑鍵那一組的左邊。` : ['E', 'B'].includes(pc) ? `${pc} 在一組黑鍵的右邊，右邊緊接著 ${pc === 'E' ? 'F' : 'C'}，中間沒有黑鍵。` : ''}`,
    };
  }
  if (mode === 'tone' || mode === 'tone-37') {
    const root = pick(KEYS.concat(['C#', 'F#']));
    const type = mode === 'tone-37' ? pick(['maj7', 'm7', '7', 'm7b5']) : pick(CHORD_TYPES);
    const name = root + type;
    const info = parseChord(name);
    if (!info) return null;
    const options = info.labels
      .map((l, i) => ({ l, pc: info.pcs[i] }))
      .filter((x) => (mode === 'tone-37' ? /^(♭?3|♭?7)$/.test(x.l) : /^(♭?3|[♭♯]?5|♭?7)$/.test(x.l)));
    const o = pick(options);
    if (!o) return null;
    const semis = semisFromRoot(info.root, o.pc);
    return {
      mode,
      text: `${pretty(name)} 的 ${DEG_NAME[o.l] || o.l}`,
      sub: `根音 ${pretty(info.root)} 已標出`,
      target: chroma(o.pc + '4'),
      answer: o.pc,
      root: chroma(info.root + '4'),
      explain: `${pretty(name)} = ${info.pcs.map(pretty).join(' ')}。${DEG_NAME[o.l]}是 ${pretty(o.pc)}（${o.l}，從 ${pretty(info.root)} 往上 ${semis} 個半音）。`,
    };
  }
  if (mode === 'diatonic') {
    const key = pick(KEYS);
    const chords = diatonic(key);
    const i = 1 + Math.floor(Math.random() * 6);
    const c = chords[i];
    return {
      mode,
      text: `${pretty(key)} 大調的 ${c.roman}`,
      sub: '點出這個和弦的根音',
      target: chroma(c.root + '4'),
      answer: c.root,
      root: chroma(key + '4'),
      explain: `${pretty(key)} 大調音階：${chords.map((x) => pretty(x.root)).join(' ')}。第 ${i + 1} 級是 ${pretty(c.root)}，和弦是 ${pretty(c.name)}。`,
    };
  }
  return null;
}
