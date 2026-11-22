import { useEffect, useMemo, useState } from 'react';
import Keyboard, { rangeFor } from '../components/Keyboard.jsx';
import ChordCard from '../components/ChordCard.jsx';
import { KeySelect, Seg, LabelToggle } from '../components/Widgets.jsx';
import { COMMON, searchChords, voicingOf, inversionCount, shell, marksFor, typeZh } from '../lib/chordbook.js';
import { parseChord, pretty, diatonic, KEYS } from '../lib/theory.js';
import { playNotes, ensureAudio } from '../lib/audio.js';
import { rememberPage } from '../lib/store.js';
import { IconPlay } from '../components/Icons.jsx';

const INV = ['原位', '第一轉位', '第二轉位', '第三轉位'];

function Detail({ name }) {
  const info = parseChord(name);
  const [kind, setKind] = useState('inv0');
  useEffect(() => setKind('inv0'), [name]);
  if (!info) return <p className="card">找不到「{name}」這個和弦。試試 F#m7、sus4、大七，或用音名 C E G 反查。</p>;
  const n = inversionCount(name);
  const opts = INV.slice(0, n).map((t, i) => [`inv${i}`, t]);
  if (shell(name)) opts.push(['shell', 'Shell']);
  opts.push(['open', '開放排列']);
  const v = voicingOf(name, kind) || voicingOf(name, 'inv0');
  const all = [...v.left, ...v.right];
  const range = rangeFor(all, { minOctaves: 3 });
  const play = async (arp) => {
    await ensureAudio();
    playNotes([...all].sort((a, b) => a - b), { strum: arp ? 0.12 : 0.012, duration: 2.2 });
  };
  const formula = info.labels.join(' ');
  return (
    <section className="card detail">
      <div className="detail-head">
        <div>
          <h2>{pretty(name)}</h2>
          <p className="muted">
            {typeZh(name)}和弦・{info.pcs.map(pretty).join(' ')}
            {info.bass ? `・低音 ${pretty(info.bass)}` : ''}・{formula}
          </p>
        </div>
        <div className="chord-actions">
          <button className="btn btn-primary" onClick={() => play(false)}>
            <IconPlay /> 播放
          </button>
          <button className="btn" onClick={() => play(true)}>
            分解
          </button>
        </div>
      </div>
      <div className="widget-controls">
        <Seg label="排法" value={kind} onChange={setKind} options={opts} />
        <LabelToggle />
      </div>
      <Keyboard from={range[0]} to={range[1]} marks={marksFor(v)} />
      <p className="muted small">
        {v.label}：{v.tip}。左手 {v.left.length} 個音、右手 {v.right.length} 個音。
      </p>
    </section>
  );
}

function KeyView({ initialKey }) {
  const [key, setKey] = useState(initialKey || 'C');
  const [sev, setSev] = useState(false);
  useEffect(() => {
    if (initialKey) setKey(initialKey);
  }, [initialKey]);
  const chords = useMemo(() => diatonic(key, sev), [key, sev]);
  return (
    <section>
      <div className="widget-controls">
        <KeySelect value={key} onChange={(k) => { setKey(k); history.replaceState(null, '', `#/chords/key/${k}`); }} />
        <Seg
          label="三和弦或七和弦"
          value={sev ? '7' : '3'}
          onChange={(x) => setSev(x === '7')}
          options={[
            ['3', '三和弦'],
            ['7', '七和弦'],
          ]}
        />
      </div>
      <p className="muted small">
        {pretty(key)} 大調：{chords.map((c) => `${c.roman} ${pretty(c.name)}`).join('・')}。上行下行時，用最近的轉位接起來會更順。
      </p>
      <div className="card-grid">
        {chords.map((c) => (
          <ChordCard key={c.name} v={{ ...voicingOf(c.name, 'inv0'), label: c.roman }} href={`#/chords/${encodeURIComponent(c.name)}`} />
        ))}
      </div>
    </section>
  );
}

export default function ChordBook({ arg }) {
  const isKey = arg.startsWith('key');
  const keyArg = isKey ? arg.split('/')[1] : null;
  const name = !isKey ? arg : '';
  const [q, setQ] = useState('');
  const results = useMemo(() => searchChords(q), [q]);
  const tab = isKey ? 'key' : 'common';

  useEffect(() => {
    rememberPage(arg ? `chords/${arg}` : 'chords', name ? `和弦表・${pretty(name)}` : '和弦表');
  }, [arg]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = q ? results : COMMON;
  return (
    <div className="page chordbook">
      <header>
        <h1>和弦表</h1>
        <p className="lead">和弦音由根音和公式算出來，排法由規則產生：原位、轉位、shell、開放排列。點一個和弦看詳細。</p>
      </header>
      <div className="search">
        <input
          type="search"
          value={q}
          placeholder="搜尋：F#m7、sus4、大七、C E G"
          onChange={(e) => setQ(e.target.value)}
          aria-label="搜尋和弦"
        />
      </div>
      {name && !q && <Detail name={name} />}
      <Seg
        label="檢視方式"
        value={tab}
        onChange={(t) => (window.location.hash = t === 'key' ? `#/chords/key/${keyArg || 'C'}` : '#/chords')}
        options={[
          ['common', q ? '搜尋結果' : '常用和弦'],
          ['key', '依調性'],
        ]}
      />
      {tab === 'key' && !q ? (
        <KeyView initialKey={KEYS.includes(keyArg) ? keyArg : 'C'} />
      ) : (
        <>
          {q && !results.length && <p className="muted">找不到符合的和弦。</p>}
          <div className="card-grid">
            {list.map((n) => (
              <ChordCard key={n} v={voicingOf(n, 'inv0')} href={`#/chords/${encodeURIComponent(n)}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
