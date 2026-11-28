import { useState } from 'react';
import { KEY_LAB } from '../data/keys.js';
import { usePrefs } from '../lib/store.js';
import { DiatonicExplorer, KeyboardLegend, Roadmap } from '../components/Widgets.jsx';
import QuizBox from '../components/QuizBox.jsx';
import { INTERVALS, SEVENTH_TYPES, pretty } from '../lib/theory.js';

const MAP = [
  {
    group: '學',
    items: [
      ...KEY_LAB.units.map((u) => ({ to: `unit/${u.id}`, no: u.no, title: u.title, text: u.gain })),
      { to: 'plan', no: '8W', title: '八週課表', text: '每週一個做得到的目標，做完打勾' },
    ],
  },
  { group: '查', items: [{ to: 'chords', title: '和弦表', text: '鍵盤圖、轉位、shell、開放排列，依調性看順階和弦' }] },
  {
    group: '練',
    items: [
      { to: 'drills', title: '基本功', text: '節拍閃卡：順階換算、七和弦看到就彈、ii–V–I 繞調' },
      { to: 'backing', title: '配樂', text: `${KEY_LAB.progressions.length} 段進行、${KEY_LAB.patterns.length} 種節奏，鍵盤示範用最近轉位` },
      { to: 'drone', title: 'Drone', text: '任一根音持續響，鍵盤上標調式音階' },
      { to: 'quiz', title: '測驗', text: '在鍵盤上點音名、和弦內音，可以只出黑鍵' },
    ],
  },
];

function DailyQuestion() {
  const modes = ['note', 'tone', 'diatonic', 'tone-37'];
  const [mode, setMode] = useState(() => modes[new Date().getDate() % modes.length]);
  const [seed, setSeed] = useState(0);
  return (
    <section className="card daily">
      <div className="section-head">
        <h2>每日一題</h2>
        <span className="muted small">沒時間的時候，30 秒就好</span>
      </div>
      <QuizBox key={seed + mode} mode={mode} single from={48} to={71} />
      <button
        className="text-btn"
        onClick={() => {
          setMode(modes[Math.floor(Math.random() * modes.length)]);
          setSeed((s) => s + 1);
        }}
      >
        換一題
      </button>
    </section>
  );
}

function since(ts) {
  const d = Math.round((Date.now() - ts) / 86400000);
  if (d <= 0) return '今天';
  if (d === 1) return '昨天';
  return `${d} 天前`;
}

export default function Home() {
  const last = usePrefs((s) => s.last);
  const plan = usePrefs((s) => s.plan);
  const total = KEY_LAB.plan.reduce((n, w) => n + w.items.length, 0);
  const done = KEY_LAB.plan.reduce((n, w) => n + w.items.filter((i) => plan[i.id]).length, 0);
  const week = KEY_LAB.plan.find((w) => w.items.some((i) => !plan[i.id])) || KEY_LAB.plan[KEY_LAB.plan.length - 1];

  return (
    <div className="page home">
      {last && (
        <a className="resume" href={`#/${last.to}`}>
          <small>繼續上次・{since(last.at)}</small>
          <b>{last.title}</b>
          <span aria-hidden="true">→</span>
        </a>
      )}

      <header className="hero">
        <h1>
          Key Lab <span>鍵盤和弦練習</span>
        </h1>
        <p>
          從「左手根音、右手原位三和弦」出發，用八週學會轉位、七和弦、色彩和弦與持續音。每次打開練 3 到 5 分鐘，隨時可以停。
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={`#/unit/start`}>
            從 00 起點開始
          </a>
          <a className="btn" href="#/plan">
            第 {week.week} 週：{week.theme}
          </a>
        </div>
      </header>

      <section>
        <h2>網站地圖</h2>
        <div className="sitemap">
          {MAP.map((g) => (
            <div key={g.group} className="sitemap-col">
              <h3>{g.group}</h3>
              {g.items.map((it) => (
                <a key={it.to} href={`#/${it.to}`} className="map-item">
                  {it.no && <small>{it.no}</small>}
                  <b>{it.title}</b>
                  <span>{it.text}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>

      <DailyQuestion />

      <section id="theory">
        <h2>基本樂理：只講看懂這個網站需要的兩件事</h2>
        <p className="muted">音程、級數、七和弦的種類你已經懂了，這裡不重講；忘記時打開最下面的速查卡。</p>

        <article className="card" id="diatonic">
          <h3>1. 順階和弦：一個調為什麼剛好是這七個和弦</h3>
          <ul className="points">
            <li>
              大調音階是「<b>全全半全全全半</b>」。從 C 開始，剛好全是白鍵；換一個調，同樣的距離就會用到黑鍵。
            </li>
            <li>在音階的每個音上，只用音階裡的音往上疊兩次三度，就得到七個順階三和弦：I ii iii IV V vi vii°。</li>
            <li>
              為什麼有大、小、減：疊出來的兩個三度剛好是 <b>4+3</b>（大三）、<b>3+4</b>（小三）或 <b>3+3</b>（減三）個半音。
            </li>
            <li>選一個調，點七個級數聽聲音、看鍵盤亮起來。按「七和弦」再疊一次三度。</li>
          </ul>
          <DiatonicExplorer showScale />
        </article>

        <article className="card">
          <h3>2. 怎麼看鍵盤圖</h3>
          <ul className="points">
            <li>根音是粉紅色；3 度、5 度、7 度、延伸音各一色。</li>
            <li>可以切換標示：音名（C、E、G）或級數（R、3、5、7、9）。</li>
            <li>左手的音是外框圓圈，右手的音是實心圓。有白色虛線外圈的是和上一個和弦共同的音——那根手指不用動。</li>
            <li>鍵盤可以點，點了會發聲。電腦上可以用鍵盤彈：A S D F G H J K 是白鍵，W E T Y U 是黑鍵，Z / X 換八度。</li>
          </ul>
          <KeyboardLegend />
        </article>

        <details className="card quickref">
          <summary>速查卡：音程、七和弦公式、級數</summary>
          <div className="quickref-grid">
            <div>
              <h4>音程半音數</h4>
              <table>
                <tbody>
                  {INTERVALS.map(([n, zh, deg]) => (
                    <tr key={n}>
                      <td>{n}</td>
                      <td>{zh}</td>
                      <td>{deg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4>五種七和弦</h4>
              <table>
                <tbody>
                  {SEVENTH_TYPES.map((t) => (
                    <tr key={t.name}>
                      <td>
                        <a href={`#/chords/${encodeURIComponent(t.ex)}`}>{pretty(t.ex)}</a>
                      </td>
                      <td>{t.zh}</td>
                      <td>{t.formula}</td>
                      <td className="muted">{t.steps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4>大調級數對照</h4>
              <table>
                <tbody>
                  <tr>
                    <td>三和弦</td>
                    <td>I ii iii IV V vi vii°</td>
                  </tr>
                  <tr>
                    <td>七和弦</td>
                    <td>Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7</td>
                  </tr>
                  <tr>
                    <td>C 大調</td>
                    <td>C Dm Em F G Am B°</td>
                  </tr>
                  <tr>
                    <td>延伸音</td>
                    <td>9 = 2、11 = 4、13 = 6（高八度）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>

      <section>
        <h2>五個單元怎麼串</h2>
        <p className="muted">每個單元都在解決同一件事：右手原位三和弦每換一個和弦就要整個跳，接起來不順、聲音也單調。</p>
        <Roadmap />
      </section>

      <section>
        <h2>學習路徑</h2>
        <div className="card path">
          <p>
            照<a href="#/plan">八週課表</a>走，每週一個目標。已完成 {done} / {total} 項。
          </p>
          <div className="progress" aria-label={`完成 ${done} / ${total}`}>
            <i style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <ol className="weeks-mini">
            {KEY_LAB.plan.map((w) => {
              const n = w.items.filter((i) => plan[i.id]).length;
              return (
                <li key={w.week} className={n === w.items.length ? 'is-done' : w.week === week.week ? 'is-now' : ''}>
                  <a href={`#/plan`}>
                    <small>W{w.week}</small>
                    {w.theme}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section>
        <h2>每天 30 分鐘</h2>
        <ol className="routine">
          {KEY_LAB.routine.map((r) => (
            <li key={r.title}>
              <a href={`#/${r.to}`}>
                <b>{r.min} 分鐘</b>
                <span>{r.title}</span>
                <em>{r.text}</em>
              </a>
            </li>
          ))}
        </ol>
        <p className="muted small">沒時間時，做上面的「每日一題」就好。</p>
      </section>
    </div>
  );
}
