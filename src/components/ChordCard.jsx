import Keyboard, { rangeFor } from './Keyboard.jsx';
import { marksFor } from '../lib/chordbook.js';
import { pretty } from '../lib/theory.js';
import { playNotes, ensureAudio } from '../lib/audio.js';
import { IconPlay } from './Icons.jsx';

/** 一個和弦：名稱、排法名稱、鍵盤圖、播放鍵。v = { name, left: [midi], right: [midi], label, tip } */
export default function ChordCard({ v, title, common = [], compact = true, range, href }) {
  if (!v) return null;
  const all = [...(v.left || []), ...(v.right || [])];
  const [from, to] = range || rangeFor(all, { minOctaves: 2 });
  const play = async (arp) => {
    await ensureAudio();
    const sorted = [...all].sort((a, b) => a - b);
    playNotes(sorted, { strum: arp ? 0.11 : 0.012, duration: 2 });
  };
  return (
    <figure className="chord-card">
      <figcaption>
        <div>
          {href ? (
            <a className="chord-name" href={href}>
              {pretty(title || v.name)}
            </a>
          ) : (
            <span className="chord-name">{pretty(title || v.name)}</span>
          )}
          {v.label && <span className="chord-label">{v.label}</span>}
        </div>
        <div className="chord-actions">
          <button className="icon-btn" onClick={() => play(false)} aria-label={`播放 ${v.name}`}>
            <IconPlay />
          </button>
          <button className="text-btn" onClick={() => play(true)}>
            分解
          </button>
        </div>
      </figcaption>
      <Keyboard from={from} to={to} marks={marksFor(v, { common })} compact={compact} />
      {v.tip && <p className="chord-tip">{v.tip}</p>}
    </figure>
  );
}
