// SVG 鍵盤：可設八度範圍、標色、標字、點擊發聲。
// marks: { [midi]: { hand: 'L' | 'R', degree, note, common, color, label, state: 'ok' | 'bad' | 'hint' } }
import { useEffect, useMemo, useRef, useState } from 'react';
import { isBlack, pretty, degreeColor, pcName } from '../lib/theory.js';
import { playNote, ensureAudio } from '../lib/audio.js';
import { usePrefs } from '../lib/store.js';

const WW = 30; // 白鍵寬（viewBox 單位）
const WH = 150;
const BW = 18;
const BH = 94;
// 黑鍵相對位置微調（讓黑鍵看起來像真的鍵盤）
const BLACK_OFFSET = { 1: -0.12, 3: 0.12, 6: -0.15, 8: 0, 10: 0.15 };

export function rangeFor(midis, { minOctaves = 2, pad = 0 } = {}) {
  const list = midis.filter((m) => m != null);
  if (!list.length) return [48, 71];
  let lo = Math.min(...list) - pad;
  let hi = Math.max(...list) + pad;
  // 往下到最近的 C 或 F，往上到最近的 E 或 B（鍵盤邊緣才會整齊）
  while (![0, 5].includes(((lo % 12) + 12) % 12)) lo -= 1;
  while (![4, 11].includes(((hi % 12) + 12) % 12)) hi += 1;
  while (hi - lo + 1 < minOctaves * 12) {
    if ((hi % 12) === 4) hi += 7;
    else hi += 5;
    if (hi - lo + 1 < minOctaves * 12) {
      if (lo > 36) lo -= lo % 12 === 0 ? 7 : 5;
    }
  }
  return [lo, hi];
}

export default function Keyboard({
  from = 48,
  to = 71,
  marks = {},
  labelMode: labelModeProp,
  onPress,
  playable = true,
  compact = false,
  focus, // midi：捲動時置中的位置
  showC = true,
  ariaLabel = '鍵盤',
}) {
  const prefMode = usePrefs((s) => s.labelMode);
  const labelMode = labelModeProp || prefMode;
  const wrap = useRef(null);
  const [pressed, setPressed] = useState({});

  const keys = useMemo(() => {
    const whites = [];
    const blacks = [];
    let x = 0;
    for (let m = from; m <= to; m += 1) {
      if (isBlack(m)) {
        const c = ((m % 12) + 12) % 12;
        blacks.push({ m, x: x - BW / 2 + (BLACK_OFFSET[c] || 0) * BW });
      } else {
        whites.push({ m, x });
        x += WW;
      }
    }
    return { whites, blacks, width: x };
  }, [from, to]);

  // 有標記時，把標記捲到畫面中間（手機上鍵盤比螢幕寬）
  const markKey = Object.keys(marks).join(',');
  useEffect(() => {
    const el = wrap.current;
    if (!el || el.scrollWidth <= el.clientWidth + 2) return;
    const ms = Object.keys(marks).map(Number);
    const target = focus ?? (ms.length ? (Math.min(...ms) + Math.max(...ms)) / 2 : 60);
    const ratio = keys.width / el.scrollWidth;
    const whiteBefore = keys.whites.filter((w) => w.m <= target).length;
    const px = (whiteBefore * WW) / ratio;
    el.scrollLeft = Math.max(0, px - el.clientWidth / 2);
  }, [markKey, focus, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  // 電腦鍵盤彈奏時也閃一下
  useEffect(() => {
    const onKey = (e) => {
      const m = e.detail?.midi;
      if (m == null || m < from || m > to) return;
      flash(m);
    };
    window.addEventListener('keylab:key', onKey);
    return () => window.removeEventListener('keylab:key', onKey);
  }, [from, to]);

  const timers = useRef({});
  function flash(m) {
    setPressed((p) => ({ ...p, [m]: true }));
    clearTimeout(timers.current[m]);
    timers.current[m] = setTimeout(() => setPressed((p) => ({ ...p, [m]: false })), 220);
  }

  function press(m, e) {
    e.preventDefault();
    flash(m);
    if (playable) {
      ensureAudio();
      playNote(m, { duration: 1.4 });
    }
    onPress?.(m);
  }

  const minWhite = compact ? 20 : 30;
  const style = { minWidth: keys.whites.length * minWhite, maxWidth: keys.whites.length * (compact ? 34 : 52) };

  const label = (mk, m) => {
    if (mk.label != null) return mk.label;
    if (labelMode === 'degree' && mk.degree) return mk.degree;
    return pretty(mk.note || pcName(m, 'sharp'));
  };

  const dot = (m, cx, black) => {
    const mk = marks[m];
    if (!mk) return null;
    const color = mk.color || (mk.state === 'ok' ? '#5fe3a1' : mk.state === 'bad' ? '#ff6b7d' : degreeColor(mk.degree));
    const cy = black ? BH - 16 : WH - 22;
    const r = black ? 8.2 : 10.5;
    const left = mk.hand === 'L';
    const text = label(mk, m);
    const small = String(text).length > 2;
    return (
      <g className="kb-mark" pointerEvents="none">
        {mk.common && <circle cx={cx} cy={cy} r={r + 4.5} fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="3 2.4" opacity="0.9" />}
        {left ? (
          <circle cx={cx} cy={cy} r={r - 0.8} fill={black ? '#1b1530' : '#fff'} stroke={color} strokeWidth="3.2" />
        ) : (
          <circle cx={cx} cy={cy} r={r} fill={color} />
        )}
        <text
          x={cx}
          y={cy + (small ? 3 : 3.6)}
          textAnchor="middle"
          fontSize={small ? 7.4 : black ? 8.6 : 9.6}
          fontWeight="700"
          fill={left ? (black ? '#fff' : '#120e22') : '#120e22'}
        >
          {text}
        </text>
      </g>
    );
  };

  return (
    <div className={`kb ${compact ? 'kb-compact' : ''}`} ref={wrap}>
      <svg viewBox={`0 0 ${keys.width} ${WH + 2}`} style={style} role="group" aria-label={ariaLabel}>
        {keys.whites.map(({ m, x }) => (
          <g key={m}>
            <rect
              x={x + 0.5}
              y={0.5}
              width={WW - 1}
              height={WH}
              rx="3.5"
              className={`kb-white ${pressed[m] ? 'is-down' : ''} ${marks[m]?.state === 'hint' ? 'is-hint' : ''}`}
              onPointerDown={(e) => press(m, e)}
              aria-label={pcName(m)}
            />
            {showC && m % 12 === 0 && (
              <text x={x + WW / 2} y={WH - 5} textAnchor="middle" fontSize="7.5" className="kb-c" pointerEvents="none">
                C{Math.floor(m / 12) - 1}
              </text>
            )}
            {dot(m, x + WW / 2, false)}
          </g>
        ))}
        {keys.blacks.map(({ m, x }) => (
          <g key={m}>
            <rect
              x={x}
              y={0}
              width={BW}
              height={BH}
              rx="2.5"
              className={`kb-black ${pressed[m] ? 'is-down' : ''} ${marks[m]?.state === 'hint' ? 'is-hint' : ''}`}
              onPointerDown={(e) => press(m, e)}
              aria-label={pcName(m)}
            />
            {dot(m, x + BW / 2, true)}
          </g>
        ))}
      </svg>
    </div>
  );
}
