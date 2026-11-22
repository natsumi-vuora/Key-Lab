import { useEffect, useState } from 'react';
import { UNITS } from './data/keys.js';
import Home from './pages/Home.jsx';
import Unit from './pages/Unit.jsx';
import Plan from './pages/Plan.jsx';
import ChordBook from './pages/ChordBook.jsx';
import Backing from './pages/Backing.jsx';
import DronePage from './pages/DronePage.jsx';
import Quiz from './pages/Quiz.jsx';
import Dock from './components/Dock.jsx';
import { ensureAudio, playNote } from './lib/audio.js';

function safeDecode(t) {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}
function useHashRoute() {
  const get = () => window.location.hash.replace(/^#\/?/, '');
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => {
      setRoute(get());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

// 電腦鍵盤彈奏：A–K 白鍵、W E T Y U 黑鍵，Z / X 換八度
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 };
function useComputerKeys() {
  useEffect(() => {
    let base = 60;
    const down = new Set();
    const onDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === 'z') return void (base = Math.max(36, base - 12));
      if (k === 'x') return void (base = Math.min(84, base + 12));
      if (!(k in KEYMAP) || down.has(k)) return;
      down.add(k);
      const midi = base + KEYMAP[k];
      ensureAudio().then(() => playNote(midi, { duration: 1.2 }));
      window.dispatchEvent(new CustomEvent('keylab:key', { detail: { midi } }));
    };
    const onUp = (e) => down.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);
}

const NAV = [
  { to: '', label: '首頁' },
  ...UNITS.map((u) => ({ to: `unit/${u.id}`, label: u.title, no: u.no })),
  { to: 'plan', label: '課表' },
  { to: 'chords', label: '和弦表' },
  { to: 'backing', label: '配樂' },
  { to: 'drone', label: 'Drone' },
  { to: 'quiz', label: '測驗' },
];

export default function App() {
  const route = useHashRoute();
  useComputerKeys();
  const [head, ...rest] = route.split('/');
  const arg = safeDecode(rest.join('/'));
  let page;
  if (head === 'unit') page = <Unit key={arg} id={arg} />;
  else if (head === 'plan') page = <Plan />;
  else if (head === 'chords') page = <ChordBook arg={arg} />;
  else if (head === 'backing') page = <Backing id={arg} />;
  else if (head === 'drone') page = <DronePage arg={arg} />;
  else if (head === 'quiz') page = <Quiz arg={arg} />;
  else page = <Home />;
  const active = head === 'unit' ? `unit/${arg}` : head || '';

  return (
    <>
      <div className="haze" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#/">
          Key Lab
        </a>
        <nav aria-label="主選單">
          {NAV.map((n) => (
            <a key={n.to} href={`#/${n.to}`} className={active === n.to ? 'is-on' : ''} aria-current={active === n.to ? 'page' : undefined}>
              {n.no && <small>{n.no}</small>}
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{page}</main>
      <Dock />
    </>
  );
}
