import { useEffect, useMemo, useState } from 'react';
import Staff from './Staff.jsx';
import Keyboard, { rangeFor } from './Keyboard.jsx';
import { fromSpec, marksFor } from '../lib/chordbook.js';
import { pretty } from '../lib/theory.js';
import { playSequence, stopSequence, playNotes, ensureAudio } from '../lib/audio.js';
import { IconPlay, IconStop } from './Icons.jsx';

/** 譜例：大譜表 + 目前小節的鍵盤圖 + 播放（可調速、循環、分解） */
export default function Example({ example }) {
  const bars = useMemo(() => example.bars.map(fromSpec), [example]);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [loop, setLoop] = useState(false);
  const [arp, setArp] = useState(false);

  useEffect(() => () => stopSequence(), []);

  const range = useMemo(() => rangeFor(bars.flatMap((b) => [...b.left, ...b.right]), { minOctaves: 2 }), [bars]);
  const cur = bars[active];
  const prev = active > 0 ? bars[active - 1] : null;
  const common = prev ? cur.right.filter((m) => prev.right.includes(m) || prev.left.includes(m)) : [];

  const start = () => {
    setPlaying(true);
    playSequence(bars, {
      bpm: Math.round(example.bpm * (slow ? 0.7 : 1)),
      loop,
      arpeggio: arp,
      onStep: (i) => setActive(i),
      onEnd: () => setPlaying(false),
    });
  };
  const stop = () => {
    stopSequence();
    setPlaying(false);
  };
  const select = async (i) => {
    setActive(i);
    if (!playing) {
      await ensureAudio();
      const b = bars[i];
      playNotes([...b.left, ...b.right], { duration: 1.8, strum: 0.012 });
    }
  };

  return (
    <div className="example">
      <div className="example-head">
        <h4>{example.title}</h4>
        <div className="example-controls">
          {playing ? (
            <button className="btn btn-primary" onClick={stop}>
              <IconStop /> 停止
            </button>
          ) : (
            <button className="btn btn-primary" onClick={start}>
              <IconPlay /> 播放
            </button>
          )}
          <label className="chip-toggle">
            <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} disabled={playing} /> 慢速
          </label>
          <label className="chip-toggle">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} disabled={playing} /> 循環
          </label>
          <label className="chip-toggle">
            <input type="checkbox" checked={arp} onChange={(e) => setArp(e.target.checked)} disabled={playing} /> 分解
          </label>
          <span className="muted small">♩ = {Math.round(example.bpm * (slow ? 0.7 : 1))}</span>
        </div>
      </div>
      <Staff bars={bars} active={active} onSelect={select} title={example.title} />
      <div className="example-kb">
        <div className="example-now">
          <b>{pretty(cur.label || cur.name)}</b>
          <span className="muted small">
            第 {active + 1} 小節{common.length ? `・虛線圈是和上一個和弦共同的音（${common.length} 個不動）` : ''}
          </span>
        </div>
        <Keyboard from={range[0]} to={range[1]} marks={marksFor(cur, { common })} compact />
      </div>
    </div>
  );
}
