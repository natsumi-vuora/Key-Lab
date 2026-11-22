# Key Lab

鍵盤和弦練習站。從「左手根音、右手原位三和弦」出發，用八週學會三和弦轉位、七和弦、色彩和弦與持續音。架構與教法參考宇的 [Chord Lab](https://unih.github.io/chord-lab/)（吉他版），程式碼與配樂資料為重新撰寫。

純靜態網站，繁體中文介面，手機、iPad、電腦都能用，不接 MIDI。

## 功能

- **首頁**：網站地圖、繼續上次、每日一題、基本樂理兩件事（順階和弦、怎麼看鍵盤圖）＋速查卡、單元串連、學習路徑、每日練法
- **五個單元**：00 起點、01 三和弦轉位、02 七和弦放進手裡、03 色彩和弦、04 持續音。每個單元有鍵盤圖與可播放的譜例（五線譜大譜表）
- **八週課表**：每週一個目標，項目做完打勾，可匯出／匯入紀錄
- **和弦表**：常用和弦、搜尋（`F#m7`、`sus4`、`大七`、`C E G` 反查）、原位／轉位／shell／開放排列切換、依調性看順階和弦
- **配樂**：進行依風格分類、13 種節奏型，鍵盤示範用最近轉位自動排，顯示現在與下一個和弦與共同音，可移調
- **Drone**：任一根音（可加 5 度），七種調式與情緒說明，鍵盤標出音階音
- **測驗**：點出音名、和弦內音、3 度與 7 度、順階和弦根音；可選「只出黑鍵」，記錄連續答對
- **底部工具列**：配樂、節拍器（拍號、點擊測速）、Drone、混音器（鋼琴取樣／合成器 pad 音色切換）
- **電腦鍵盤彈奏**：A S D F G H J K 白鍵、W E T Y U 黑鍵、Z / X 換八度

## 修改教材

所有內容都在 [`src/data/keys.js`](src/data/keys.js) 的 `KEY_LAB` 物件裡，檔頭有格式說明。一個和弦：

```js
{ id: 'C-inv1', name: 'C', label: '第一轉位', left: 'C3', right: 'E4 G4 C5', tip: '最低音是 3 度' }
```

級數與顏色由程式依和弦名稱自動算。改完跑一次檢查：

```bash
npm run check
```

會檢查每個排法的音都屬於那個和弦、該有的音都有彈到、配樂每小節都找得到和弦。

## 本機開發

需要 Node.js 20 以上。

```bash
npm install
npm run dev
npm run build   # 輸出到 dist/
```

## 部署

`.github/workflows/deploy.yml` 在推到 `main` 時建置並部署到 GitHub Pages（第一次需在 repo 的 **Settings → Pages** 把 **Source** 設成 **GitHub Actions**）。`vite.config.js` 的 `base` 是相對路徑，repo 改名也不用調整。

## 使用的套件

| 用途 | 套件 |
|---|---|
| 樂理計算 | [tonal](https://github.com/tonaljs/tonal) |
| 時脈、合成音、效果 | [Tone.js](https://tonejs.github.io) |
| 鋼琴與貝斯取樣 | [smplr](https://github.com/danigb/smplr) |
| 介面與建置 | React、Vite |

鍵盤圖與五線譜是自己畫的 SVG，不需要額外套件。鋼琴取樣第一次使用時從網路下載，下載失敗或離線時自動改用內建合成音。
