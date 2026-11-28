// 基本功：節拍閃卡。在琴上彈，網站按拍子出題、預告下一張、翻答案、記哪幾張太慢。
import { useEffect, useRef, useState } from 'react';
import Keyboard from '../components/Keyboard.jsx';
import { Seg, KeySelect } from '../components/Widgets.jsx';
import { BpmControl } from '../components/Dock.jsx';
import { usePrefs, setPrefs, getPrefs, rememberPage } from '../lib/store.js';
import { onBeat, toggleMetronome, getTransportState, playNotes, ensureAudio } from '../lib/audio.js';
import { marksFor } from '../lib/chordbook.js';
import { pretty } from '../lib/theory.js';
import {
  MODES, DEGREE_GROUPS, DEGREE_JUMPS, PROG_PATTERNS, SONG7_PATTERNS, SEVENTH_QUALITIES, VOICINGS, PRESETS,
  nextCard, voiceCard, slowLabel, ROMAN3, LEARN_ORDER,
} from '../lib/drills.js';
import { IconPlay, IconStop } from '../components/Icons.jsx';

const KB_FROM = 41; // F2
const KB_TO = 83; // B5

function Teach({ mode, sevenths }) {
  if (mode === 'degree' || mode === 'prog') {
    return (
      <details className="card teach" open={mode === 'degree'}>
        <summary>換算捷徑：不用數音階，從主音直接跳</summary>
        <p className="muted small">
          每個大調的和弦性質都一樣：I 大、ii 小、iii 小、IV 大、V 大、vi 小、vii° 減{sevenths ? '（七和弦：Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7）' : ''}。要練的只有「第幾級是哪個音」。
        </p>
        <table className="jumps">
          <tbody>
            {DEGREE_JUMPS.map((j) => (
              <tr key={j.d}>
                <td>
                  <b>{j.roman}</b>
                </td>
                <td>{j.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">建議順序：先 IV 與 V 練到 12 個調都不卡，再加 vi 與 ii，最後 iii 與 vii°。拼法跟著調走：D♭ 大調寫 G♭，不寫 F♯。</p>
      </details>
    );
  }
  return (
    <details className="card teach" open={mode === 'seventh'}>
      <summary>七和弦看到就彈：左手根音，右手彈「3 度上的三和弦」</summary>
      <table className="jumps">
        <tbody>
          <tr>
            <td><b>maj7</b></td>
            <td>3 度上的<b>小三</b>：Cmaj7 = C ＋ Em</td>
          </tr>
          <tr>
            <td><b>m7</b></td>
            <td>3 度上的<b>大三</b>：Cm7 = C ＋ E♭</td>
          </tr>
          <tr>
            <td><b>7</b></td>
            <td>3 度上的<b>減三</b>：C7 = C ＋ E°</td>
          </tr>
          <tr>
            <td><b>m7♭5</b></td>
            <td>3 度上的<b>小三</b>：Cm7♭5 = C ＋ E♭m</td>
          </tr>
        </tbody>
      </table>
      <p className="muted small">
        口訣：大三度上放小三、小三度上放大三；屬七例外，放減三。右手只彈你已經會的三和弦。連續換和弦時（ii–V–I），用最近的轉位接：上一個的 3 度不動變成下一個的 7 度，7 度往下一步變成 3 度。
      </p>
    </details>
  );
}

function HeatGrid({ slow }) {
  return (
    <div className="heat-wrap">
      <table className="heat">
        <thead>
          <tr>
            <th />
            {ROMAN3.map((r) => (
              <th key={r}>{r}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LEARN_ORDER.map((k) => (
            <tr key={k}>
              <th>{pretty(k)}</th>
              {ROMAN3.map((r, i) => {
                const n = slow[`deg:${k}:${i + 1}`] || 0;
                return (
                  <td key={r} style={{ background: n ? `rgba(255,107,125,${Math.min(0.85, 0.2 + n * 0.15)})` : undefined }}>
                    {n || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Drills({ arg }) {
  const s = usePrefs((p) => p.drills);
  const slow = s.slow || {};
  const [running, setRunning] = useState(false);
  const [deck, setDeck] = useState(null); // { cur, curV, nxt, nxtV }
  const [beat, setBeat] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [marked, setMarked] = useState([]);
  const gen = useRef({});
  const deckRef = useRef(null);
  deckRef.current = deck;
  const count = useRef(0);
  const metroWasOn = useRef(false);

  // 網址預設
  useEffect(() => {
    if (arg && PRESETS[arg]) setPrefs({ drills: PRESETS[arg] });
  }, [arg]);
  useEffect(() => rememberPage(arg ? `drills/${arg}` : 'drills', '基本功'), [arg]);

  const settingsKey = JSON.stringify({ ...s, slow: undefined });

  function deal() {
    const st = getPrefs().drills;
    gen.current = {};
    const cur = nextCard(st, gen.current, st.slow);
    const curV = voiceCard(cur.name, st.voicing, null, cur.triad);
    const nxt = nextCard(st, gen.current, st.slow);
    const nxtV = voiceCard(nxt.name, st.voicing, curV?.right, nxt.triad);
    deckRef.current = { cur, curV, nxt, nxtV };
    setDeck(deckRef.current);
    setRevealed(st.reveal === 'always');
    return { cur, curV };
  }
  function advance() {
    const st = getPrefs().drills;
    const d = deckRef.current;
    if (!d) return deal();
    const cur = d.nxt;
    const curV = d.nxtV;
    const nxt = nextCard(st, gen.current, st.slow);
    const nxtV = voiceCard(nxt.name, st.voicing, curV?.right, nxt.triad);
    const next = { cur, curV, nxt, nxtV };
    deckRef.current = next;
    setDeck(next);
    setRevealed(st.reveal === 'always');
    if (st.sound && curV) playNotes([...curV.left, ...curV.right], { duration: 1.6, strum: 0.01 });
    return next;
  }

  // 設定改變就重新發牌
  useEffect(() => {
    deal();
  }, [settingsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 節拍：每 N 拍換一張；最後一拍翻答案
  useEffect(() => {
    if (!running) return undefined;
    count.current = 0;
    const off = onBeat(() => {
      const st = getPrefs().drills;
      const n = count.current;
      const pos = n % st.beats;
      if (pos === 0 && n > 0) advance();
      if (st.reveal === 'last' && pos === st.beats - 1) setRevealed(true);
      setBeat(pos);
      count.current = n + 1;
    });
    return off;
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  // 離開頁面時停掉
  useEffect(
    () => () => {
      if (!metroWasOn.current) toggleMetronome(false);
    },
    [],
  );

  // 空白鍵：手動下一張；Enter：翻答案
  useEffect(() => {
    const fn = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space' && !running) {
        e.preventDefault();
        advance();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        setRevealed((r) => !r);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    await ensureAudio();
    metroWasOn.current = getTransportState().metro;
    deal();
    setMarked([]);
    setRunning(true);
    await toggleMetronome(true);
    const d = deckRef.current;
    if (s.sound && d?.curV) playNotes([...d.curV.left, ...d.curV.right], { duration: 1.6, strum: 0.01 });
  };
  const stop = () => {
    setRunning(false);
    setBeat(-1);
    if (!metroWasOn.current) toggleMetronome(false);
  };
  const markSlow = () => {
    const d = deckRef.current;
    if (!d) return;
    const id = d.cur.id;
    setPrefs({ drills: { slow: { ...getPrefs().drills.slow, [id]: (getPrefs().drills.slow[id] || 0) + 1 } } });
    setMarked((m) => [...m, d.cur.label || slowLabel(id)]);
  };
  const set = (patch) => {
    if (running) stop();
    setPrefs({ drills: patch });
  };
  const playAnswer = async () => {
    await ensureAudio();
    const v = deck?.curV;
    if (v) playNotes([...v.left, ...v.right], { duration: 1.8, strum: 0.01 });
  };

  const mode = MODES.find((m) => m.id === s.mode) || MODES[0];
  const cur = deck?.cur;
  const curV = deck?.curV;
  const slowList = Object.entries(slow)
    .filter(([id]) => (s.mode === 'seventh' || s.mode === 'iivi' || s.mode === 'song7' ? id.startsWith('7:') : !id.startsWith('7:')))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="page drills">
      <header>
        <h1>基本功</h1>
        <p className="lead">
          在琴上彈，網站只負責<b>按拍子出題、先讓你看到下一張</b>。歌裡來不及，多半是換和弦那一瞬間才開始想；這裡練的就是彈現在這個的時候，眼睛已經在看下一個。
        </p>
      </header>

      <Seg label="練習" value={s.mode} onChange={(m) => set({ mode: m })} options={MODES.map((m) => [m.id, m.name])} />
      <p className="muted small">{mode.desc}</p>

      <Teach mode={s.mode} sevenths={s.sevenths} />

      <section className="card drill-settings">
        {s.mode === 'degree' && (
          <>
            <div className="ctl">
              <span>級數</span>
              <Seg label="級數" value={s.group} onChange={(g) => set({ group: g })} options={DEGREE_GROUPS.map((g) => [g.id, g.name])} />
            </div>
            <div className="ctl">
              <span>調</span>
              <Seg
                label="調的範圍"
                value={s.keyMode}
                onChange={(v) => set({ keyMode: v })}
                options={[
                  ['all', '12 個調亂數'],
                  ['one', '只練一個調'],
                ]}
              />
              {s.keyMode === 'one' && <KeySelect value={s.key} onChange={(k) => set({ key: k })} />}
            </div>
            <div className="ctl">
              <span>和弦</span>
              <Seg
                label="三和弦或七和弦"
                value={s.sevenths ? '7' : '3'}
                onChange={(v) => set({ sevenths: v === '7' })}
                options={[
                  ['3', '三和弦'],
                  ['7', '七和弦'],
                ]}
              />
            </div>
          </>
        )}
        {(s.mode === 'prog' || s.mode === 'song7') && (
          <>
            <div className="ctl">
              <span>進行</span>
              {s.mode === 'prog' ? (
                <Seg label="進行" value={s.pattern} onChange={(p) => set({ pattern: p })} options={PROG_PATTERNS.map((p) => [p.id, p.name])} />
              ) : (
                <Seg label="進行" value={s.song7} onChange={(p) => set({ song7: p })} options={SONG7_PATTERNS.map((p) => [p.id, p.name])} />
              )}
            </div>
            <div className="ctl">
              <span>從哪個調開始</span>
              <KeySelect value={s.key} onChange={(k) => set({ key: k })} keys={LEARN_ORDER} />
            </div>
            <div className="ctl">
              <span>換調</span>
              <Seg
                label="換調"
                value={String(s.rotate)}
                onChange={(v) => set({ rotate: Number(v) })}
                options={[
                  ['0', '不換'],
                  ['1', '每輪換'],
                  ['2', '每 2 輪換'],
                  ['4', '每 4 輪換'],
                ]}
              />
            </div>
          </>
        )}
        {s.mode === 'seventh' && (
          <>
            <div className="ctl">
              <span>根音</span>
              <Seg
                label="根音"
                value={s.roots}
                onChange={(v) => set({ roots: v })}
                options={[
                  ['white', '只有白鍵'],
                  ['all', '12 個根音'],
                ]}
              />
            </div>
            <div className="ctl">
              <span>種類</span>
              <div className="seg">
                {SEVENTH_QUALITIES.map(([q, t]) => {
                  const on = s.qualities.includes(q);
                  return (
                    <button
                      key={q}
                      className={on ? 'is-on' : ''}
                      aria-pressed={on}
                      onClick={() => {
                        const next = on ? s.qualities.filter((x) => x !== q) : [...s.qualities, q];
                        if (next.length) set({ qualities: next });
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        {s.mode === 'iivi' && (
          <div className="ctl">
            <span>從哪個調開始（往下五度繞）</span>
            <KeySelect value={s.key} onChange={(k) => set({ key: k })} />
          </div>
        )}
        {(s.mode !== 'prog' && !(s.mode === 'degree' && !s.sevenths)) && (
          <div className="ctl">
            <span>答案的排法</span>
            <Seg label="排法" value={s.voicing} onChange={(v) => set({ voicing: v })} options={VOICINGS} />
          </div>
        )}
        <div className="ctl">
          <span>每張停幾拍</span>
          <Seg
            label="每張幾拍"
            value={String(s.beats)}
            onChange={(v) => set({ beats: Number(v) })}
            options={[
              ['8', '8 拍'],
              ['4', '4 拍'],
              ['2', '2 拍'],
            ]}
          />
        </div>
        <div className="ctl">
          <span>答案</span>
          <Seg
            label="答案"
            value={s.reveal}
            onChange={(v) => set({ reveal: v })}
            options={[
              ['last', '最後一拍才翻'],
              ['hide', '不翻'],
              ['always', '一直顯示'],
            ]}
          />
        </div>
        <div className="ctl">
          <span>速度</span>
          <BpmControl />
        </div>
        <label className="chip-toggle">
          <input type="checkbox" checked={s.sound} onChange={(e) => set({ sound: e.target.checked })} /> 每張卡開始時播出和弦（先聽再彈）
        </label>
      </section>

      {cur && (
        <section className={`card stage ${running ? 'is-running' : ''}`}>
          <div className="stage-top">
            <div className="stage-now">
              <small>{cur.sub}</small>
              <b className="stage-prompt">{cur.prompt}</b>
              {cur.length && (
                <span className="stage-steps">
                  {Array.from({ length: cur.length }, (_, i) => (
                    <i key={i} className={i === cur.step ? 'is-on' : ''} />
                  ))}
                </span>
              )}
            </div>
            <div className="stage-next">
              <small>下一張</small>
              <b>{deck.nxt.prompt}</b>
              <small>{deck.nxt.sub}</small>
            </div>
          </div>
          <div className="beat-dots big" aria-hidden="true">
            {Array.from({ length: s.beats }, (_, i) => (
              <i key={i} className={i === beat ? 'is-on' : i < beat ? 'is-past' : ''} />
            ))}
          </div>
          <div className="row stage-controls">
            {running ? (
              <button className="btn btn-primary" onClick={stop}>
                <IconStop /> 停止
              </button>
            ) : (
              <button className="btn btn-primary" onClick={start}>
                <IconPlay /> 跟節拍器開始
              </button>
            )}
            {!running && (
              <button className="btn" onClick={advance}>
                下一張（空白鍵）
              </button>
            )}
            <button className="btn" onClick={() => setRevealed((r) => !r)}>
              {revealed ? '蓋起答案' : '看答案（Enter）'}
            </button>
            <button className="btn btn-slow" onClick={markSlow}>
              太慢了
            </button>
          </div>
          <div className={`answer ${revealed ? 'is-open' : ''}`}>
            {revealed && curV ? (
              <>
                <p>
                  <b>{pretty(cur.name)}</b>
                  {curV.triad && <span className="muted">　右手 {pretty(curV.triad).replace('dim', '°')}</span>}
                  {cur.hint && <span className="muted small">　{cur.hint}</span>}
                  <button className="text-btn" onClick={playAnswer}>
                    聽聽看
                  </button>
                </p>
                <Keyboard from={KB_FROM} to={KB_TO} marks={marksFor(curV)} compact />
              </>
            ) : (
              <p className="muted small">答案蓋著。先在琴上彈，再翻開對答案。</p>
            )}
          </div>
          {marked.length > 0 && <p className="muted small">這次標了太慢：{marked.join('、')}</p>}
        </section>
      )}

      <section className="card">
        <div className="section-head">
          <h2>常卡住的</h2>
          <span className="muted small">按「太慢了」的次數越多，那張卡越常出現</span>
        </div>
        {s.mode === 'degree' || s.mode === 'prog' ? <HeatGrid slow={slow} /> : null}
        {slowList.length ? (
          <ul className="slow-list">
            {slowList.map(([id, n]) => (
              <li key={id}>
                {slowLabel(id)} <span className="muted">×{n}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">還沒有紀錄。</p>
        )}
        {Object.keys(slow).length > 0 && (
          <button className="text-btn" onClick={() => confirm('清除全部「太慢」紀錄？') && setPrefs({ drills: { slow: {} } })}>
            清除紀錄
          </button>
        )}
      </section>

      <section className="card">
        <h2>建議的用法</h2>
        <ol className="points">
          <li>先用「8 拍、答案一直顯示」把手型跟著彈一遍，不用急。</li>
          <li>換成「4 拍、最後一拍才翻」：前三拍自己彈，最後一拍對答案。</li>
          <li>不卡了再換「2 拍」或把速度往上加 5。卡住就按「太慢了」，下次會多出。</li>
          <li>一次 3 到 5 分鐘就好，可以當每天的暖手。</li>
        </ol>
        <p className="muted small">沒開節拍器時也能用：按空白鍵換下一張、Enter 翻答案。順階換算的熱度表裡，紅色越深代表越常卡。</p>
      </section>
    </div>
  );
}

