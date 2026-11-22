// 底部工具列：每一頁都在。配樂播放/暫停（換頁不會停）、節拍器、Drone、混音器。
import { useEffect, useRef, useState } from 'react';
import { useAudio, toggleMetronome, setBpm, startDrone, stopDrone, ensureAudio, preloadVoice } from '../lib/audio.js';
import { playSelection, stopBacking, currentSelection } from '../lib/backing.js';
import { usePrefs, setPrefs } from '../lib/store.js';
import { pretty } from '../lib/theory.js';
import { IconPlay, IconPause, IconMetro, IconWave, IconSliders } from './Icons.jsx';
import { Seg } from './Widgets.jsx';

function useOutside(ref, onClose, open) {
  useEffect(() => {
    if (!open) return undefined;
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', fn);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fn);
      document.removeEventListener('keydown', esc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function BpmControl() {
  const bpm = usePrefs((s) => s.bpm);
  const taps = useRef([]);
  const tap = () => {
    const now = performance.now();
    taps.current = taps.current.filter((t) => now - t < 2500).concat(now);
    if (taps.current.length >= 3) {
      const d = taps.current.slice(1).map((t, i) => t - taps.current[i]);
      setBpm(60000 / (d.reduce((a, b) => a + b, 0) / d.length));
    }
  };
  return (
    <div className="bpm">
      <button className="icon-btn" onClick={() => setBpm(bpm - 5)} aria-label="慢 5">
        −
      </button>
      <input type="range" min="40" max="200" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} aria-label="BPM" />
      <button className="icon-btn" onClick={() => setBpm(bpm + 5)} aria-label="快 5">
        +
      </button>
      <output>{bpm}</output>
      <button className="text-btn" onClick={tap}>
        點擊測速
      </button>
    </div>
  );
}

function MetroPanel() {
  const meter = usePrefs((s) => s.meter);
  const { transport } = useAudio();
  const beats = meter === '3/4' ? 3 : meter === '6/8' ? 6 : 4;
  return (
    <div className="panel">
      <h3>節拍器</h3>
      <BpmControl />
      <div className="row">
        <Seg
          label="拍號"
          value={meter}
          onChange={(v) => setPrefs({ meter: v })}
          options={[
            ['4/4', '4/4'],
            ['3/4', '3/4'],
            ['6/8', '6/8'],
          ]}
        />
        <button className={`btn ${transport.metro ? 'btn-on' : ''}`} onClick={() => toggleMetronome()}>
          {transport.metro ? '停止' : '開始'}
        </button>
      </div>
      {transport.metro && (
        <div className="beat-dots" aria-hidden="true">
          {Array.from({ length: transport.playing ? 4 : beats }, (_, i) => (
            <i key={i} className={i === transport.beat ? 'is-on' : ''} />
          ))}
        </div>
      )}
      {transport.playing && <p className="muted small">配樂播放中，節拍器跟著配樂的拍子。</p>}
    </div>
  );
}

function DronePanel() {
  const d = usePrefs((s) => s.drone);
  const { drone } = useAudio();
  return (
    <div className="panel">
      <h3>Drone</h3>
      <p className="muted small">
        {pretty(d.root)} 持續音{d.fifth ? '＋5 度' : ''}。到 <a href="#/drone">Drone 頁</a> 換根音、看調式音階。
      </p>
      <button className={`btn ${drone.on ? 'btn-on' : ''}`} onClick={() => (drone.on ? stopDrone() : startDrone(d.root, d.fifth))}>
        {drone.on ? '停止' : '開始'}
      </button>
    </div>
  );
}

const MIX = [
  ['keys', '鍵盤'],
  ['pad', '鋪底'],
  ['bass', '貝斯'],
  ['drums', '鼓'],
  ['click', '節拍器'],
  ['drone', 'Drone'],
];
export function MixerPanel() {
  const vol = usePrefs((s) => s.vol);
  const mute = usePrefs((s) => s.mute);
  const voice = usePrefs((s) => s.voice);
  const { status } = useAudio();
  return (
    <div className="panel">
      <h3>混音器</h3>
      <div className="row">
        <span className="muted small">音色</span>
        <Seg
          label="音色"
          value={voice}
          onChange={(v) => {
            setPrefs({ voice: v });
            ensureAudio().then(preloadVoice);
          }}
          options={[
            ['piano', '鋼琴'],
            ['pad', '合成器 pad'],
          ]}
        />
      </div>
      {voice === 'piano' && status.piano === 'loading' && <p className="muted small">鋼琴取樣下載中，先用內建合成音…</p>}
      {voice === 'piano' && status.piano === 'failed' && <p className="muted small">鋼琴取樣下載失敗（可能離線），改用內建合成音。</p>}
      <div className="mixer">
        <label className="mix-row">
          <span>總音量</span>
          <input type="range" min="-30" max="6" step="1" value={vol.master} onChange={(e) => setPrefs({ vol: { master: Number(e.target.value) } })} />
          <span />
        </label>
        {MIX.map(([k, t]) => (
          <label key={k} className={`mix-row ${mute[k] ? 'is-muted' : ''}`}>
            <span>{t}</span>
            <input type="range" min="-40" max="6" step="1" value={vol[k]} onChange={(e) => setPrefs({ vol: { [k]: Number(e.target.value) } })} />
            <button className={`mute ${mute[k] ? 'is-on' : ''}`} onClick={(e) => { e.preventDefault(); setPrefs({ mute: { [k]: !mute[k] } }); }} aria-pressed={mute[k]}>
              {mute[k] ? '靜音' : '開'}
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Dock() {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(null), !!open);
  const { transport, drone } = useAudio();
  const sel = currentSelection();
  const toggle = (k) => setOpen((o) => (o === k ? null : k));

  const playPause = () => {
    if (transport.playing) stopBacking();
    else playSelection();
  };
  const bpm = usePrefs((s) => s.bpm);
  const nowName = transport.playing ? transport.name : '';

  return (
    <div className="dock" ref={ref}>
      {open && (
        <div className="dock-pop" role="dialog">
          {open === 'metro' && <MetroPanel />}
          {open === 'drone' && <DronePanel />}
          {open === 'mixer' && <MixerPanel />}
        </div>
      )}
      <div className="dock-bar">
        <button className={`dock-play ${transport.playing ? 'is-on' : ''}`} onClick={playPause} aria-label={transport.playing ? '暫停配樂' : '播放配樂'}>
          {transport.playing ? <IconPause /> : <IconPlay />}
        </button>
        <a className="dock-now" href={`#/backing/${sel.prog.id}`}>
          <small>{transport.playing ? `配樂・第 ${transport.bar + 1} 小節` : '配樂'}</small>
          <b>{pretty(nowName || sel.prog.name)}</b>
        </a>
        <button className={`dock-btn ${transport.metro ? 'is-on' : ''} ${open === 'metro' ? 'is-open' : ''}`} onClick={() => toggle('metro')}>
          <IconMetro />
          <span>{bpm}</span>
        </button>
        <button className={`dock-btn ${drone.on ? 'is-on' : ''} ${open === 'drone' ? 'is-open' : ''}`} onClick={() => toggle('drone')}>
          <IconWave />
          <span>{drone.on ? pretty(drone.root) : 'Drone'}</span>
        </button>
        <button className={`dock-btn ${open === 'mixer' ? 'is-open' : ''}`} onClick={() => toggle('mixer')}>
          <IconSliders />
          <span>混音</span>
        </button>
      </div>
    </div>
  );
}
