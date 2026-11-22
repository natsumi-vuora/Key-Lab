import { useEffect } from 'react';
import { UNITS, unitById } from '../data/keys.js';
import { fromSpec } from '../lib/chordbook.js';
import { rememberPage } from '../lib/store.js';
import ChordCard from '../components/ChordCard.jsx';
import Example from '../components/Example.jsx';
import { Widget, LabelToggle } from '../components/Widgets.jsx';

export default function Unit({ id }) {
  const u = unitById(id) || UNITS[0];
  const idx = UNITS.indexOf(u);
  const prev = UNITS[idx - 1];
  const next = UNITS[idx + 1];

  useEffect(() => {
    rememberPage(`unit/${u.id}`, `${u.no} ${u.title}`);
  }, [u.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <article className="page unit">
      <header className="unit-head">
        <small className="unit-no">{u.no}</small>
        <h1>{u.title}</h1>
        <p className="unit-sub">{u.subtitle}</p>
        <p className="unit-gain">
          <span>學完得到</span>
          {u.gain}
        </p>
        {u.intro.map((p, i) => (
          <p key={i} className="lead">
            {p}
          </p>
        ))}
        <div className="unit-tools">
          <span className="muted small">鍵盤標示</span>
          <LabelToggle />
        </div>
      </header>

      {u.sections.map((s, i) => (
        <section key={i} className="unit-section">
          <h2>
            <small>
              {u.no}.{i + 1}
            </small>
            {s.title}
          </h2>
          {s.body?.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
          {s.chords && (
            <div className={`card-grid ${s.chords.length % 3 === 0 ? 'three' : ''}`}>
              {s.chords.map((c) => (
                <ChordCard key={c.id} v={fromSpec(c)} href={`#/chords/${encodeURIComponent(c.name)}`} />
              ))}
            </div>
          )}
          {s.widget && <Widget name={s.widget} />}
          {s.example && <Example example={s.example} />}
          {s.link && (
            <p>
              <a className="btn" href={`#/${s.link.to}`}>
                {s.link.text} →
              </a>
            </p>
          )}
        </section>
      ))}

      <nav className="unit-nav">
        {prev ? (
          <a href={`#/unit/${prev.id}`}>
            ← {prev.no} {prev.title}
          </a>
        ) : (
          <a href="#/">← 首頁</a>
        )}
        {next ? (
          <a href={`#/unit/${next.id}`}>
            {next.no} {next.title} →
          </a>
        ) : (
          <a href="#/plan">八週課表 →</a>
        )}
      </nav>
    </article>
  );
}
