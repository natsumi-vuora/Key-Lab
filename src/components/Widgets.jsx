// 單元與首頁的互動元件
import { useMemo, useState } from 'react';
import Keyboard, { rangeFor } from './Keyboard.jsx';
import ChordCard from './ChordCard.jsx';
import { KEY_LAB } from '../data/keys.js';
import { KEYS, pretty, diatonic, majorScale, chroma, degreeColor, DEGREE_COLORS } from '../lib/theory.js';
import { inversion, atOrAbove, stackUp } from '../lib/chordbook.js';
import { playNotes, ensureAudio } from '../lib/audio.js';
import { usePrefs, setPrefs } from '../lib/store.js';

export function KeySelect({ value, onChange, keys = KEYS, label = '調' }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {keys.map((k) => (
        <button key={k} role="radio" aria-checked={value === k} className={value === k ? 'is-on' : ''} onClick={() => onChange(k)}>
          {pretty(k)}
        </button>
      ))}
    </div>
  );
}

export function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'is-on' : ''} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

/** 標示切換：音名 / 級數 */
export function LabelToggle() {
  const mode = usePrefs((s) => s.labelMode);
  return (
    <Seg
      label="鍵盤標示"
      value={mode}
      onChange={(v) => setPrefs({ labelMode: v })}
      options={[
        ['note', '音名'],
        ['degree', '級數'],
      ]}
    />
  );
}

export function Roadmap() {
  return (
    <ol className="roadmap">
      <li className="roadmap-start">
        <a href="#/unit/start">
          <small>00</small>
          <b>起點</b>
          <span>左手根音、右手原位三和弦（你已經會的）</span>
        </a>
      </li>
      {KEY_LAB.roadmap.map((r) => {
        const u = KEY_LAB.units.find((x) => x.id === r.id);
        return (
          <li key={r.id}>
            <a href={`#/unit/${r.id}`}>
              <small>{u.no}</small>
              <b>{u.title}</b>
              <em>{r.step}</em>
              <span>{r.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** 任一調總覽：選根音，三個轉位並排 */
export function InversionsOverview() {
  const [root, setRoot] = useState('C');
  const [q, setQ] = useState('');
  const name = root + q;
  const vs = [0, 1, 2].map((i) => inversion(name, i));
  const range = rangeFor(vs.flatMap((v) => v.right), { minOctaves: 2 });
  return (
    <div className="widget">
      <div className="widget-controls">
        <KeySelect value={root} onChange={setRoot} label="根音" />
        <Seg
          label="大小"
          value={q}
          onChange={setQ}
          options={[
            ['', '大三'],
            ['m', '小三'],
          ]}
        />
      </div>
      <div className="card-grid three">
        {vs.map((v) => (
          <ChordCard key={v.label} v={{ ...v, left: [] }} title={name} range={range} />
        ))}
      </div>
    </div>
  );
}

/**
 * 順階和弦：選一個調，點七個級數聽聲音、看鍵盤亮起來。
 * showScale：在鍵盤上標出音階與全全半全全全半
 */
export function DiatonicExplorer({ sevenths: sevenProp = false, showScale = false, allowToggle = true }) {
  const [key, setKey] = useState('C');
  const [sevenths, setSevenths] = useState(sevenProp);
  const [sel, setSel] = useState(null);
  const chords = useMemo(() => diatonic(key, sevenths), [key, sevenths]);
  const scale = majorScale(key);
  const tonic = atOrAbove(key, 60);
  const scaleMidis = stackUp([...scale, key], tonic - 0);
  const range = [Math.floor(tonic / 12) * 12, Math.floor(tonic / 12) * 12 + 35];

  let marks = {};
  if (sel != null) {
    const c = chords[sel];
    const start = scaleMidis[sel];
    const notes = stackUp(c.notes, start);
    const labels = ['R', c.steps[0] === 4 ? '3' : '♭3', c.steps[0] + c.steps[1] === 7 ? '5' : c.steps[0] + c.steps[1] === 6 ? '♭5' : '♯5', '7'];
    notes.forEach((m, i) => {
      let deg = labels[i];
      if (i === 3) deg = c.steps.reduce((a, b) => a + b, 0) === 11 ? '7' : '♭7';
      marks[m] = { hand: 'R', degree: deg, note: c.notes[i] };
    });
  } else if (showScale) {
    scaleMidis.forEach((m, i) => {
      marks[m] = { hand: 'R', note: scale[i % 7], degree: String((i % 7) + 1), color: i % 7 === 0 ? DEGREE_COLORS.root : '#a9b8ff' };
    });
  }

  const play = async (i) => {
    await ensureAudio();
    setSel(i);
    const c = chords[i];
    const notes = stackUp(c.notes, scaleMidis[i]);
    playNotes([atOrAbove(c.root, 36), ...notes], { strum: 0.03, duration: 1.8 });
  };
  const playScale = async () => {
    await ensureAudio();
    setSel(null);
    playNotes(scaleMidis, { strum: 0.32, duration: 0.6 });
  };

  const steps = [];
  for (let i = 0; i < 7; i += 1) steps.push(scaleMidis[i + 1] - scaleMidis[i] === 2 ? '全' : '半');

  return (
    <div className="widget">
      <div className="widget-controls">
        <KeySelect value={key} onChange={(k) => { setKey(k); setSel(null); }} />
        {allowToggle && (
          <Seg
            label="三和弦或七和弦"
            value={sevenths ? '7' : '3'}
            onChange={(v) => { setSevenths(v === '7'); setSel(null); }}
            options={[
              ['3', '三和弦'],
              ['7', '七和弦'],
            ]}
          />
        )}
      </div>
      {showScale && (
        <div className="scale-steps" aria-label="音階的全音與半音">
          {scale.concat(key).map((n, i) => (
            <span key={i} className="scale-step">
              <b>{pretty(n)}</b>
              {i < 7 && <em className={steps[i] === '半' ? 'is-half' : ''}>{steps[i]}</em>}
            </span>
          ))}
          <button className="text-btn" onClick={playScale}>
            播放音階
          </button>
        </div>
      )}
      <Keyboard from={range[0]} to={range[1]} marks={marks} />
      <div className="degree-row">
        {chords.map((c, i) => (
          <button key={c.degree} className={`degree-btn ${sel === i ? 'is-on' : ''}`} onClick={() => play(i)}>
            <small>{c.roman}</small>
            <b>{pretty(c.name)}</b>
            <em>{c.steps.join('+')}</em>
          </button>
        ))}
      </div>
      {sel != null && (
        <p className="muted small">
          {pretty(chords[sel].name)}：從 {pretty(chords[sel].root)} 開始，用音階內的音往上疊 {sevenths ? '三' : '兩'}次三度 → {chords[sel].notes.map(pretty).join(' ')}（半音數 {chords[sel].steps.join(' + ')}）。
          {!sevenths && (chords[sel].steps[0] === 4 ? '4+3 是大三和弦。' : chords[sel].steps[1] === 4 ? '3+4 是小三和弦。' : '3+3 是減三和弦。')}
        </p>
      )}
    </div>
  );
}

/** 鍵盤圖怎麼看：圖例 */
export function KeyboardLegend() {
  const demo = { name: 'Cmaj9', left: [48], right: [64, 67, 71, 74] };
  const marks = {};
  const deg = { 48: 'R', 64: '3', 67: '5', 71: '7', 74: '9' };
  const note = { 48: 'C', 64: 'E', 67: 'G', 71: 'B', 74: 'D' };
  for (const m of [48, 64, 67, 71, 74]) marks[m] = { hand: m === 48 ? 'L' : 'R', degree: deg[m], note: note[m] };
  return (
    <div className="widget">
      <div className="legend">
        {[
          ['root', '根音 R'],
          ['third', '3 度'],
          ['fifth', '5 度'],
          ['seventh', '7 度'],
          ['ext', '延伸音 9、11、13、sus、6'],
        ].map(([k, t]) => (
          <span key={k} className="legend-item">
            <i style={{ background: DEGREE_COLORS[k] }} />
            {t}
          </span>
        ))}
        <span className="legend-item">
          <i className="ring" />
          左手（外框）
        </span>
        <span className="legend-item">
          <i style={{ background: '#cfc9e6' }} />
          右手（實心）
        </span>
        <span className="legend-item">
          <i className="dash" />
          共同音（不動）
        </span>
      </div>
      <div className="widget-controls">
        <LabelToggle />
        <span className="muted small">全站共用，記在偏好設定裡</span>
      </div>
      <Keyboard from={48} to={83} marks={marks} />
      <p className="muted small">例：Cmaj9，左手 C3，右手 E4 G4 B4 D5。</p>
    </div>
  );
}

export function Widget({ name }) {
  if (name === 'roadmap') return <Roadmap />;
  if (name === 'inversions') return <InversionsOverview />;
  if (name === 'diatonic') return <DiatonicExplorer />;
  if (name === 'diatonic7') return <DiatonicExplorer sevenths />;
  return null;
}

export { degreeColor, chroma };
