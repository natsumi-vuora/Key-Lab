// 五線譜大譜表（高音 + 低音譜號）。每小節一個全音符和弦：右手寫在高音譜、左手寫在低音譜。
import { spellVoicing } from '../lib/chordbook.js';
import { pretty } from '../lib/theory.js';

const GAP = 8; // 線距
const T_BOTTOM = 76; // 高音譜最下線（E4）
const B_BOTTOM = 156; // 低音譜最下線（G2）
const LETTERS = 'CDEFGAB';

function parse(n) {
  const m = /^([A-G])(#{1,2}|b{1,2})?(-?\d)$/.exec(n);
  if (!m) return null;
  return { letter: m[1], acc: m[2] || '', oct: Number(m[3]), step: Number(m[3]) * 7 + LETTERS.indexOf(m[1]) };
}
const yTreble = (step) => T_BOTTOM - (step - 30) * (GAP / 2);
const yBass = (step) => B_BOTTOM - (step - 18) * (GAP / 2);
const ACC = { '#': '♯', b: '♭', '##': '𝄪', bb: '𝄫' };

function ledgers(step, staff) {
  const out = [];
  if (staff === 'T') {
    for (let s = 28; s >= step; s -= 2) out.push(yTreble(s));
    for (let s = 40; s <= step; s += 2) out.push(yTreble(s));
  } else {
    for (let s = 16; s >= step; s -= 2) out.push(yBass(s));
    for (let s = 28; s <= step; s += 2) out.push(yBass(s));
  }
  return out;
}

function layoutChord(notes, staff) {
  const yOf = staff === 'T' ? yTreble : yBass;
  const sorted = notes.map(parse).filter(Boolean).sort((a, b) => a.step - b.step);
  let prev = null;
  let prevShift = false;
  const heads = sorted.map((n) => {
    const shift = prev && n.step - prev.step === 1 && !prevShift;
    prevShift = !!shift;
    prev = n;
    return { ...n, y: yOf(n.step), dx: shift ? 11 : 0, ledgers: ledgers(n.step, staff) };
  });
  // 臨時記號：由上往下排，太靠近的往左錯開
  const accs = heads.filter((h) => h.acc).reverse();
  const cols = [];
  accs.forEach((h) => {
    let c = 0;
    while (cols[c] && cols[c].some((y) => Math.abs(y - h.y) < GAP * 2.6)) c += 1;
    (cols[c] = cols[c] || []).push(h.y);
    h.accX = -12 - c * 8;
  });
  return { heads, accWidth: cols.length * 8 };
}

export default function Staff({ bars, active = -1, onSelect, title }) {
  const laid = bars.map((b) => {
    const t = layoutChord(spellVoicing(b.name, b.right || []), 'T');
    const bs = layoutChord(spellVoicing(b.name, b.left || []), 'B');
    const accW = Math.max(t.accWidth, bs.accWidth);
    const hasSecond = [...t.heads, ...bs.heads].some((h) => h.dx);
    const width = Math.max(64, 40 + accW + (hasSecond ? 12 : 0) + Math.max(0, pretty(b.label || b.name).length - 5) * 6);
    return { ...b, t, bs, accW, width };
  });
  const startX = 50;
  let x = startX;
  laid.forEach((b) => {
    b.x = x;
    x += b.width;
  });
  const W = x + 6;
  const H = 196;
  const staffLines = (bottom) => [0, 1, 2, 3, 4].map((i) => bottom - i * GAP);

  return (
    <div className="staff-wrap">
      <svg className="staff" viewBox={`0 0 ${W} ${H}`} style={{ width: Math.round(W * 1.25) }} role="img" aria-label={title || '譜例'}>
        {laid.map((b, i) => (
          <rect
            key={`hl${i}`}
            x={b.x + 1}
            y={6}
            width={b.width - 2}
            height={H - 14}
            rx="8"
            className={`staff-bar ${i === active ? 'is-on' : ''}`}
            onClick={() => onSelect?.(i)}
          />
        ))}
        {[T_BOTTOM, B_BOTTOM].map((bottom) =>
          staffLines(bottom).map((y) => <line key={`${bottom}-${y}`} x1={8} x2={W - 6} y1={y} y2={y} className="staff-line" />),
        )}
        {/* 譜表左邊的連線與大括號 */}
        <line x1={8} x2={8} y1={T_BOTTOM - 4 * GAP} y2={B_BOTTOM} className="staff-line strong" />
        <path d={`M5 ${T_BOTTOM - 4 * GAP} Q-2 ${(T_BOTTOM + B_BOTTOM - 4 * GAP) / 2 - 20} 2 ${(T_BOTTOM + B_BOTTOM - 4 * GAP) / 2} Q-2 ${(T_BOTTOM + B_BOTTOM - 4 * GAP) / 2 + 20} 5 ${B_BOTTOM}`} className="staff-brace" />
        <text x={13} y={T_BOTTOM - GAP} className="clef" fontSize="44">𝄞</text>
        <text x={13} y={B_BOTTOM - 3 * GAP} className="clef" fontSize="31">𝄢</text>
        {laid.map((b, i) => {
          const cx = b.x + 18 + b.accW + 6;
          return (
            <g key={i} onClick={() => onSelect?.(i)} className="staff-col">
              <text x={b.x + 8} y={20} className="staff-chord">{pretty(b.label || b.name)}</text>
              {[b.t, b.bs].map((part, pi) =>
                part.heads.map((h, hi) => (
                  <g key={`${pi}-${hi}`}>
                    {h.ledgers.map((ly) => (
                      <line key={ly} x1={cx + h.dx - 9} x2={cx + h.dx + 9} y1={ly} y2={ly} className="staff-line" />
                    ))}
                    <ellipse cx={cx + h.dx} cy={h.y} rx="5.6" ry="3.9" className="staff-head" transform={`rotate(-18 ${cx + h.dx} ${h.y})`} />
                    {h.acc && (
                      <text x={cx + h.accX} y={h.y + 4} className="staff-acc" fontSize="16">
                        {ACC[h.acc]}
                      </text>
                    )}
                  </g>
                )),
              )}
              <line x1={b.x + b.width} x2={b.x + b.width} y1={T_BOTTOM - 4 * GAP} y2={B_BOTTOM} className="staff-line" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
