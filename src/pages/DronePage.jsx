import { useEffect } from 'react';
import Keyboard from '../components/Keyboard.jsx';
import { KeySelect, Seg } from '../components/Widgets.jsx';
import { MODES, modeNotes, scaleDegree, pretty, chroma, KEYS, DEGREE_COLORS } from '../lib/theory.js';
import { startDrone, stopDrone, useAudio } from '../lib/audio.js';
import { usePrefs, setPrefs, rememberPage } from '../lib/store.js';
import { IconPlay, IconStop } from '../components/Icons.jsx';

export default function DronePage({ arg }) {
  const d = usePrefs((s) => s.drone);
  const { drone } = useAudio();

  // 網址可以帶根音與調式：#/drone/D/dorian
  useEffect(() => {
    const [r, m] = (arg || '').split('/');
    const patch = {};
    if (r && KEYS.includes(r)) patch.root = r;
    if (m && MODES.some((x) => x.id === m)) patch.mode = m;
    if (Object.keys(patch).length) setPrefs({ drone: patch });
  }, [arg]);
  useEffect(() => rememberPage('drone', 'Drone'), []);

  const mode = MODES.find((m) => m.id === d.mode) || MODES[0];
  const notes = modeNotes(d.root, d.mode);
  const set = new Map(notes.map((n) => [chroma(n + '4'), n]));
  const marks = {};
  const r = chroma(d.root + '4');
  for (let m = 48; m <= 83; m += 1) {
    const c = ((m % 12) + 12) % 12;
    if (!set.has(c)) continue;
    const n = set.get(c);
    const deg = scaleDegree(d.root, n);
    marks[m] = { hand: 'R', note: n, degree: deg, color: c === r ? DEGREE_COLORS.root : /♯|♭/.test(deg) ? DEGREE_COLORS.seventh : '#a9b8ff' };
  }

  const update = (patch) => {
    setPrefs({ drone: patch });
    const next = { ...d, ...patch };
    if (drone.on && (patch.root || patch.fifth !== undefined)) startDrone(next.root, next.fifth);
  };

  return (
    <div className="page drone">
      <header>
        <h1>Drone</h1>
        <p className="lead">選一個根音讓它一直響，在上面自由彈。換調式，看同一個根音上的音階怎麼變、情緒怎麼變。</p>
      </header>
      <section className="card">
        <div className="widget-controls">
          <KeySelect value={d.root} onChange={(k) => update({ root: k })} label="根音" />
        </div>
        <div className="widget-controls">
          {drone.on ? (
            <button className="btn btn-primary" onClick={stopDrone}>
              <IconStop /> 停止
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => startDrone(d.root, d.fifth)}>
              <IconPlay /> 開始 {pretty(d.root)} 持續音
            </button>
          )}
          <label className="chip-toggle">
            <input type="checkbox" checked={d.fifth} onChange={(e) => update({ fifth: e.target.checked })} /> 加 5 度
          </label>
        </div>
      </section>

      <section className="card">
        <h2>調式</h2>
        <Seg label="調式" value={d.mode} onChange={(m) => update({ mode: m })} options={MODES.map((m) => [m.id, m.name])} />
        <p className="mood">
          <b>
            {pretty(d.root)} {mode.name}
          </b>
          ：{mode.mood}
        </p>
        <p className="muted small">
          音階：{notes.map((n) => `${pretty(n)}（${scaleDegree(d.root, n)}）`).join('・')}。粉紅色是根音，橘色是和大調不一樣的音。
        </p>
        <Keyboard from={48} to={83} marks={marks} labelMode="note" />
        <p className="muted small">點鍵盤會發聲。可以先只彈根音、3 度、5 度，再慢慢加上招牌音。</p>
      </section>
    </div>
  );
}
