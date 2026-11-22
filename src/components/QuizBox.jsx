import { useEffect, useRef, useState } from 'react';
import Keyboard from './Keyboard.jsx';
import { makeQuestion } from '../lib/quiz.js';
import { chroma, pcName, pretty } from '../lib/theory.js';
import { playNotes } from '../lib/audio.js';
import { IconCheck, IconX } from './Icons.jsx';

/** 一題一題出：在鍵盤上點答案。答錯直接顯示正確答案和原因。 */
export default function QuizBox({ mode, blackOnly = false, onResult, from = 48, to = 71, autoNext = true, single = false }) {
  const [q, setQ] = useState(() => makeQuestion(mode, { blackOnly }));
  const [result, setResult] = useState(null); // null | 'ok' | 'bad'
  const [picked, setPicked] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    setQ(makeQuestion(mode, { blackOnly }));
    setResult(null);
    setPicked(null);
  }, [mode, blackOnly]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const next = () => {
    clearTimeout(timer.current);
    setQ((prev) => makeQuestion(mode, { blackOnly, prev }));
    setResult(null);
    setPicked(null);
  };

  const answer = (m) => {
    if (result) {
      if (result === 'bad' || single) return;
      return;
    }
    const ok = chroma(m) === q.target;
    setPicked(m);
    setResult(ok ? 'ok' : 'bad');
    onResult?.(ok, q);
    if (ok && autoNext && !single) timer.current = setTimeout(next, 900);
  };

  // 電腦鍵盤也可以作答
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    const fn = (e) => answerRef.current(e.detail.midi);
    window.addEventListener('keylab:key', fn);
    return () => window.removeEventListener('keylab:key', fn);
  }, []);

  const marks = {};
  for (let m = from; m <= to; m += 1) {
    const c = chroma(m);
    if (q.root != null && c === q.root && c !== q.target) marks[m] = { hand: 'R', degree: 'R', label: 'R' };
    if (result && c === q.target) marks[m] = { hand: 'R', state: m === picked ? 'ok' : 'hint', label: pretty(q.answer), color: m === picked ? undefined : '#5fe3a1' };
  }
  if (result === 'bad' && picked != null) marks[picked] = { hand: 'R', state: 'bad', label: pretty(pcName(picked, 'sharp').split('/')[0]) };

  return (
    <div className={`quizbox ${result ? `is-${result}` : ''}`}>
      <div className="quiz-q">
        <b>{q.text}</b>
        <span className="muted">{q.sub}</span>
      </div>
      <Keyboard from={from} to={to} marks={marks} onPress={answer} />
      <div className="quiz-feedback" aria-live="polite">
        {result === 'ok' && (
          <p className="ok">
            <IconCheck /> 答對了。{q.explain}
          </p>
        )}
        {result === 'bad' && (
          <p className="bad">
            <IconX /> 正確答案是 {pretty(q.answer)}。{q.explain}
          </p>
        )}
        {result && !single && (
          <button className="btn" onClick={next}>
            下一題
          </button>
        )}
        {result && single && (
          <button className="btn" onClick={() => playNotes([60 + ((q.target - 0 + 12) % 12)], { duration: 1 })}>
            聽答案
          </button>
        )}
      </div>
    </div>
  );
}
