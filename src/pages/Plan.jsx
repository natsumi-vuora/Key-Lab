import { useEffect, useRef, useState } from 'react';
import { KEY_LAB } from '../data/keys.js';
import { usePrefs, togglePlan, exportData, importData, rememberPage } from '../lib/store.js';
import { IconCheck } from '../components/Icons.jsx';

export default function Plan() {
  const plan = usePrefs((s) => s.plan);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  useEffect(() => rememberPage('plan', '八週課表'), []);

  const onImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await importData(f);
      setMsg('匯入完成');
    } catch (err) {
      setMsg(`匯入失敗：${err.message}`);
    }
    e.target.value = '';
  };

  return (
    <div className="page plan">
      <header>
        <h1>八週課表</h1>
        <p className="lead">每週一個做得到的目標。項目做完就打勾，不鎖關卡、不扣分；一週沒做完也可以先往下走。</p>
      </header>
      <ol className="weeks">
        {KEY_LAB.plan.map((w) => {
          const n = w.items.filter((i) => plan[i.id]).length;
          const all = n === w.items.length;
          return (
            <li key={w.week} className={`card week ${all ? 'is-done' : ''}`}>
              <div className="week-head">
                <small>第 {w.week} 週</small>
                <h2>{w.theme}</h2>
                <span className="week-count">
                  {n} / {w.items.length}
                </span>
              </div>
              <p className="week-goal">
                <span>目標</span>
                {w.goal}
              </p>
              <ul className="checks">
                {w.items.map((it) => (
                  <li key={it.id} className={plan[it.id] ? 'is-on' : ''}>
                    <button className="check" onClick={() => togglePlan(it.id)} aria-pressed={!!plan[it.id]} aria-label={`完成：${it.text}`}>
                      {plan[it.id] && <IconCheck />}
                    </button>
                    <span>{it.text}</span>
                    {it.to && (
                      <a className="go" href={`#/${it.to}`}>
                        去練 →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <section className="card">
        <h2>練習紀錄</h2>
        <p className="muted">打勾、測驗紀錄和偏好設定存在這個瀏覽器裡，不會跨裝置同步。換裝置時用匯出、匯入。</p>
        <div className="row">
          <button className="btn" onClick={exportData}>
            匯出紀錄
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            匯入紀錄
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
          {msg && <span className="muted small">{msg}</span>}
        </div>
      </section>
    </div>
  );
}
