import { useEffect, useState } from 'react';
import QuizBox from '../components/QuizBox.jsx';
import { Seg } from '../components/Widgets.jsx';
import { QUIZ_MODES } from '../lib/quiz.js';
import { usePrefs, recordQuiz, rememberPage } from '../lib/store.js';

export default function Quiz({ arg }) {
  // #/quiz/note-black → 點出音名＋只出黑鍵
  const parseArg = (a) => {
    const black = /-black$/.test(a || '');
    const m = (a || '').replace(/-black$/, '');
    return { mode: QUIZ_MODES.some((x) => x.id === m) ? m : 'note', black };
  };
  const [{ mode, black }, setState] = useState(() => parseArg(arg));
  const [streak, setStreak] = useState(0);
  const [count, setCount] = useState({ ok: 0, all: 0 });
  const best = usePrefs((s) => s.quiz.best);
  const key = `${mode}${black ? '-black' : ''}`;

  useEffect(() => setState(parseArg(arg)), [arg]);
  useEffect(() => {
    setStreak(0);
    setCount({ ok: 0, all: 0 });
  }, [key]);
  useEffect(() => rememberPage(`quiz/${key}`, '測驗'), [key]);

  const onResult = (ok) => {
    const s = ok ? streak + 1 : 0;
    setStreak(s);
    setCount((c) => ({ ok: c.ok + (ok ? 1 : 0), all: c.all + 1 }));
    recordQuiz(key, ok ? s : 0, ok);
  };
  const go = (m, b) => {
    history.replaceState(null, '', `#/quiz/${m}${b ? '-black' : ''}`);
    setState({ mode: m, black: b });
  };
  const info = QUIZ_MODES.find((m) => m.id === mode);

  return (
    <div className="page quiz">
      <header>
        <h1>測驗</h1>
        <p className="lead">在鍵盤上點出答案（電腦也可以用鍵盤彈）。答錯會直接告訴你正確答案和原因。</p>
      </header>
      <section className="card">
        <div className="widget-controls">
          <Seg label="題型" value={mode} onChange={(m) => go(m, black)} options={QUIZ_MODES.map((m) => [m.id, m.name])} />
          <Seg
            label="範圍"
            value={black ? 'black' : 'all'}
            onChange={(v) => go(mode, v === 'black')}
            options={[
              ['all', '全部'],
              ['black', '只出黑鍵'],
            ]}
          />
        </div>
        <p className="muted small">{info.desc}</p>
        <div className="quiz-stats">
          <span>
            連續答對 <b>{streak}</b>
          </span>
          <span>
            最佳紀錄 <b>{best[key] || 0}</b>
          </span>
          <span>
            這次 {count.ok} / {count.all}
          </span>
        </div>
        <QuizBox key={key} mode={mode} blackOnly={black} onResult={onResult} from={48} to={83} />
      </section>
    </div>
  );
}
