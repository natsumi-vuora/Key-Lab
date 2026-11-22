// 檢查教材資料：每個排法的音都屬於那個和弦、和弦音都有彈到（5 度與根音可省）、配樂每小節都找得到和弦
import { KEY_LAB } from '../src/data/keys.js';
import { parseChord, chroma } from '../src/lib/theory.js';
import { parseNotes, voiceProgression } from '../src/lib/chordbook.js';

let errors = 0;
let checked = 0;
const fail = (where, msg) => {
  errors += 1;
  console.error(`✗ ${where}: ${msg}`);
};

function checkVoicing(where, c, { pedal = false } = {}) {
  if (c.check === false) return;
  const info = parseChord(c.name);
  if (!info) return fail(where, `看不懂和弦名稱 ${c.name}`);
  const left = parseNotes(c.left);
  const right = parseNotes(c.right);
  if (String(c.left || '').split(/\s+/).filter(Boolean).length !== left.length) return fail(where, `left 有看不懂的音名：${c.left}`);
  if (String(c.right || '').split(/\s+/).filter(Boolean).length !== right.length) return fail(where, `right 有看不懂的音名：${c.right}`);
  if (!left.length || !right.length) return fail(where, '左右手都要有音');
  const allowed = new Set(info.pcs.map((p) => chroma(p + '4')));
  if (info.bass) allowed.add(chroma(info.bass + '4'));
  // 持續音譜例：左手的持續音（例如根音 + 5 度）可以不在和弦裡
  for (const m of pedal ? right : [...left, ...right]) if (!allowed.has(chroma(m))) fail(where, `${c.name} 裡沒有這個音（midi ${m}）`);
  const played = new Set([...left, ...right].map(chroma));
  info.pcs.forEach((pc, i) => {
    const label = info.labels[i];
    if (label === '5' || label === 'R') return; // 可省
    if (!played.has(chroma(pc + '4'))) fail(where, `${c.name} 少了 ${label}（${pc}）`);
  });
  if (info.bass && chroma(Math.min(...left)) !== chroma(info.bass + '4')) fail(where, `${c.name} 的最低音應該是 ${info.bass}`);
  if (!info.bass && chroma(Math.min(...left)) !== chroma(info.root + '4')) fail(where, `${c.name} 左手最低音應該是根音 ${info.root}`);
  if (Math.max(...left) > Math.min(...right)) fail(where, '左手的音比右手高');
  checked += 1;
}

for (const u of KEY_LAB.units) {
  u.sections.forEach((s, si) => {
    (s.chords || []).forEach((c) => checkVoicing(`單元 ${u.no} §${si + 1} ${c.id}`, c));
    if (s.example) s.example.bars.forEach((b, bi) => checkVoicing(`譜例 ${s.example.id} 第 ${bi + 1} 小節`, b, { pedal: !!s.example.pedal }));
  });
}

const cats = new Set(KEY_LAB.progressionCats.map((c) => c.id));
const pats = new Set(KEY_LAB.patterns.map((p) => p.id));
const ids = new Set();
for (const p of KEY_LAB.progressions) {
  if (ids.has(p.id)) fail(`配樂 ${p.id}`, 'id 重複');
  ids.add(p.id);
  if (!cats.has(p.cat)) fail(`配樂 ${p.id}`, `沒有這個分類 ${p.cat}`);
  if (!pats.has(p.style)) fail(`配樂 ${p.id}`, `沒有這個節奏型 ${p.style}`);
  p.bars.forEach((bar, i) => {
    bar.split(/\s+/).forEach((n) => {
      if (!parseChord(n)) fail(`配樂 ${p.id} 第 ${i + 1} 小節`, `找不到和弦 ${n}`);
    });
  });
  const flat = p.bars.flatMap((b) => b.split(/\s+/));
  const v = voiceProgression(flat, 'close');
  v.forEach((x) => {
    if (!x.right.length) fail(`配樂 ${p.id}`, `${x.name} 排不出來`);
  });
  checked += 1;
}

for (const p of KEY_LAB.patterns) {
  for (const k of ['keys', 'bass', 'kick', 'snare', 'hat', 'rim']) {
    if (p[k] && p[k].length !== p.steps) fail(`節奏型 ${p.id}`, `${k} 長度 ${p[k].length}，應該是 ${p.steps}`);
  }
}

const planIds = new Set();
for (const w of KEY_LAB.plan) for (const it of w.items) {
  if (planIds.has(it.id)) fail(`課表第 ${w.week} 週`, `id 重複 ${it.id}`);
  planIds.add(it.id);
  const m = /^backing\/(.+)$/.exec(it.to || '');
  if (m && !ids.has(m[1])) fail(`課表 ${it.id}`, `連到不存在的配樂 ${m[1]}`);
  const u = /^unit\/(.+)$/.exec(it.to || '');
  if (u && !KEY_LAB.units.some((x) => x.id === u[1])) fail(`課表 ${it.id}`, `連到不存在的單元 ${u[1]}`);
}

if (errors) {
  console.error(`\n${errors} 個問題`);
  process.exit(1);
}
console.log(`✓ 檢查通過：${checked} 個排法與配樂`);
