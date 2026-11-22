import { useEffect, useMemo, useState } from 'react';
import { KEY_LAB, progressionById } from '../data/keys.js';
import Keyboard, { rangeFor } from '../components/Keyboard.jsx';
import { Seg } from '../components/Widgets.jsx';
import { BpmControl } from '../components/Dock.jsx';
import { useAudio, setBpm, playNotes, ensureAudio } from '../lib/audio.js';
import { usePrefs, setPrefs, rememberPage } from '../lib/store.js';
import { buildBars, playSelection, stopBacking, refreshSelection, transposeName, VOICING_MODES } from '../lib/backing.js';
import { marksFor } from '../lib/chordbook.js';
import { pretty } from '../lib/theory.js';
import { IconPlay, IconStop } from '../components/Icons.jsx';

const TRANSPOSE = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

export default function Backing({ id }) {
  const b = usePrefs((s) => s.backing);
  const { transport } = useAudio();
  const prog = progressionById(id) || progressionById(b.id) || KEY_LAB.progressions[0];
  const [cat, setCat] = useState(prog.cat);
  const [view, setView] = useState(0); // 沒在播放時，點小節檢視

  // 網址帶的 id 就是目前選的進行
  useEffect(() => {
    if (prog.id !== b.id) {
      setPrefs({ backing: { id: prog.id, style: null } });
      setBpm(prog.bpm);
      if (transport.playing) refreshSelection({ id: prog.id, style: null });
    }
    setCat(prog.cat);
    setView(0);
    rememberPage(`backing/${prog.id}`, `配樂・${pretty(prog.name)}`);
  }, [prog.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const style = b.style || prog.style;
  const bars = useMemo(() => buildBars(prog, { mode: b.mode, transpose: b.transpose }), [prog, b.mode, b.transpose]);
  const flat = bars.flatMap((bar, bi) => bar.map((v, ci) => ({ v, bi, ci })));
  const isThis = transport.playing && transport.progId === prog.id;
  const curIdx = isThis ? Math.max(0, flat.findIndex((x) => x.bi === transport.bar && x.ci === (transport.chord || 0))) : view;
  const cur = flat[curIdx]?.v;
  const nxt = flat[(curIdx + 1) % flat.length]?.v;
  const nextCommon = cur && nxt ? nxt.right.filter((m) => cur.right.includes(m)) : [];
  const range = rangeFor(flat.flatMap((x) => [...x.v.left, ...x.v.right]), { minOctaves: 2 });

  const change = (patch) => refreshSelection(patch);
  const play = () => playSelection({ id: prog.id });

  return (
    <div className="page backing">
      <header>
        <h1>配樂</h1>
        <p className="lead">選一段進行跟著彈。鍵盤示範用最近轉位自動排；畫面上是現在與下一個和弦，虛線圈是兩個和弦共同的音。</p>
      </header>

      <Seg label="分類" value={cat} onChange={setCat} options={KEY_LAB.progressionCats.map((c) => [c.id, c.name])} />
      <div className="prog-list">
        {KEY_LAB.progressions
          .filter((p) => p.cat === cat)
          .map((p) => (
            <a key={p.id} href={`#/backing/${p.id}`} className={`prog-item ${p.id === prog.id ? 'is-on' : ''}`}>
              <b>{pretty(p.name)}</b>
              <span>{p.desc}</span>
            </a>
          ))}
      </div>

      <section className="card player">
        <div className="player-head">
          <div>
            <h2>{pretty(prog.name)}</h2>
            <p className="muted small">{prog.desc}</p>
          </div>
          {isThis ? (
            <button className="btn btn-primary" onClick={stopBacking}>
              <IconStop /> 停止
            </button>
          ) : (
            <button className="btn btn-primary" onClick={play}>
              <IconPlay /> 播放
            </button>
          )}
        </div>

        <div className="bars">
          {bars.map((bar, bi) => (
            <button
              key={bi}
              className={`bar ${isThis && transport.bar === bi ? 'is-on' : ''} ${!isThis && flat[view]?.bi === bi ? 'is-view' : ''}`}
              onClick={async () => {
                const idx = flat.findIndex((x) => x.bi === bi);
                setView(idx);
                if (!isThis) {
                  await ensureAudio();
                  const v = flat[idx].v;
                  playNotes([...v.left, ...v.right], { duration: 1.6, strum: 0.012 });
                }
              }}
            >
              {bar.map((v, ci) => (
                <span key={ci}>{pretty(v.name)}</span>
              ))}
            </button>
          ))}
        </div>

        <div className="now-next">
          <div>
            <p className="nn-label">
              現在 <b>{cur && pretty(cur.name)}</b>
            </p>
            {cur && <Keyboard from={range[0]} to={range[1]} marks={marksFor(cur, { common: cur.common })} compact />}
          </div>
          <div className="is-next">
            <p className="nn-label">
              下一個 <b>{nxt && pretty(nxt.name)}</b>
              {nextCommon.length > 0 && <span className="muted small">・{nextCommon.length} 個共同音不動</span>}
            </p>
            {nxt && <Keyboard from={range[0]} to={range[1]} marks={marksFor(nxt, { common: nextCommon })} compact />}
          </div>
        </div>

        <div className="player-controls">
          <div className="ctl">
            <span>速度</span>
            <BpmControl />
          </div>
          <div className="ctl">
            <span>節奏</span>
            <select value={style} onChange={(e) => change({ style: e.target.value })}>
              {KEY_LAB.patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ctl">
            <span>鍵盤示範排法</span>
            <Seg label="排法" value={b.mode} onChange={(m) => change({ mode: m })} options={VOICING_MODES} />
          </div>
          <div className="ctl">
            <span>移調</span>
            <select value={b.transpose} onChange={(e) => change({ transpose: Number(e.target.value) })}>
              {TRANSPOSE.map((t) => (
                <option key={t} value={t}>
                  {t > 0 ? `+${t}` : t}（{pretty(transposeName(prog.bars[0].split(' ')[0], t))}）
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="muted small">鍵盤示範、鋪底、貝斯、鼓的音量在底部的「混音」。想自己彈全部的時候，把鍵盤示範靜音。</p>
      </section>
    </div>
  );
}
