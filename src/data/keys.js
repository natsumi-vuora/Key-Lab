/*
 * Key Lab 教材資料。改這個檔案就能改教材。
 *
 * ── 和弦（單元裡的鍵盤圖、譜例的每個小節）──
 *   { id: 'C-inv1', name: 'C', label: '第一轉位', left: 'C3', right: 'E4 G4 C5', tip: '最低音是 3 度' }
 *   - name  : 和弦名稱（英文，例 'Am7'、'C/E'）。級數與顏色由程式依名稱自動算
 *   - left  : 左手的音，音名加八度，空白分隔（'C3'、'D2 A2'）
 *   - right : 右手的音（'E4 G4 C5'）
 *   - label : 顯示在和弦名稱下的小字（可省略）
 *   - tip   : 一句提示（可省略）
 *   - common: 和上一個和弦共同的音（不動的手指），寫音名；譜例裡會自動算，不用寫
 *   - check : false 時 npm run check 不檢查這個和弦（例如故意示範的「打架」聲音）
 *
 * ── 單元 units ──
 *   { id, no, title, subtitle, gain（學完得到）, intro: [兩段], sections: [...] }
 *   section: { title, body: [段落...], chords: [...], example: {...}, widget, link: { to, text } }
 *   - example : 譜例 { id: '1-1', title, bpm, bars: [和弦...] }；pedal: true 表示左手是持續音，可以不在和弦裡
 *   - widget  : 互動元件：'inversions'（任一調轉位總覽）、'diatonic'（順階和弦）、'diatonic7'、'roadmap'（單元地圖）
 *
 * ── 配樂 progressions ──
 *   { id, name, desc, cat, bpm, style, bars: ['C', 'Am', 'F G', ...] }
 *   - bars 每一格是一個小節；一格寫兩個和弦（空白分隔）就是一小節換兩個
 *   - cat 對應 progressionCats，style 對應 patterns
 *
 * ── 節奏型 patterns ──（每一格是一個 16 分音符，「.」是不彈）
 *   kick / snare / hat / rim：鼓。snare 的 g 是輕聲；hat 的 x 閉合、o 開放、g 輕聲
 *   bass：x 根音、o 5 度、8 高八度根音、- 延長
 *   keys：x 整個和弦、r 只有右手、l 只有左手、0–5 分解（0 是左手，1 起是右手由低到高）、- 延長
 *
 * ── 課表 plan ──
 *   { week, theme, goal, items: [{ id, text, to }] }；to 是站內頁面（'unit/inversions'、'backing/pop-1564'、'quiz/black'）
 */

export const KEY_LAB = {
  units: [
    {
      id: 'start',
      no: '00',
      title: '起點',
      subtitle: '左手根音、右手原位三和弦',
      gain: '看清楚你現在的彈法，和接下來四個單元要解決的問題',
      intro: [
        '你已經會在任何調組出大小三和弦：左手按根音，右手彈原位三和弦。這是最穩的起點，所有和弦都彈得出來。',
        '問題是：每換一個和弦，右手就要整個搬家。這一頁先把這件事看清楚，後面四個單元每一個都只往前推一步，把它解決掉。',
      ],
      sections: [
        {
          title: '你已經會的彈法',
          body: [
            '用 C – Am – F – G 示範。左手彈根音，右手彈原位三和弦（根音在最下面）。',
            '點譜例上的小節可以看那個和弦在鍵盤上的位置；按播放會一個小節一個和弦。',
          ],
          example: {
            id: '0-1',
            title: '譜例 0-1：C – Am – F – G（全部原位）',
            bpm: 76,
            bars: [
              { name: 'C', left: 'C3', right: 'C4 E4 G4' },
              { name: 'Am', left: 'A2', right: 'A3 C4 E4' },
              { name: 'F', left: 'F2', right: 'F3 A3 C4' },
              { name: 'G', left: 'G2', right: 'G3 B3 D4' },
            ],
          },
        },
        {
          title: '問題在哪',
          body: [
            '從 C 換到 Am，右手三根手指全部往下移三到四個半音；從 Am 換到 F 再移一次。每換一個和弦，手就跳一次，聲部一個一個斷開，聽起來是「一塊、一塊、一塊」。',
            '其實 C 和 Am 有兩個共同音（C、E），Am 和 F 也有兩個（A、C）。共同音可以不動，只移動剩下的音——這就是 01 要學的事。',
          ],
        },
        {
          title: '後面四個單元怎麼串',
          body: ['每個單元都從上一個單元的手型出發，只加一件事。'],
          widget: 'roadmap',
        },
      ],
    },
    {
      id: 'inversions',
      no: '01',
      title: '三和弦轉位',
      subtitle: '同一個和弦的三種排法',
      gain: '用最小的動作連接和弦',
      intro: [
        '三和弦只有三個音，但排的順序可以換：根音在最下面是原位，3 度在最下面是第一轉位，5 度在最下面是第二轉位。三種排法都是同一個和弦，左手還是彈根音。',
        '會了三種排法，換和弦時就可以挑「離現在的手最近的那一個」：共同音不動，其他手指只挪一兩個半音。',
      ],
      sections: [
        {
          title: 'C 大三和弦的三種排法',
          body: [
            '把最下面的音搬到最上面，就得到下一個轉位：C E G → E G C → G C E。',
            '右手的形狀會變：原位是兩個三度疊起來；轉位會有一個四度（兩個手指之間空比較多）。四度上面那個音就是根音，這是在鍵盤上一眼認出根音的方法。',
          ],
          chords: [
            { id: 'C-inv0', name: 'C', label: '原位', left: 'C3', right: 'C4 E4 G4', tip: '最低音是根音' },
            { id: 'C-inv1', name: 'C', label: '第一轉位', left: 'C3', right: 'E4 G4 C5', tip: '最低音是 3 度' },
            { id: 'C-inv2', name: 'C', label: '第二轉位', left: 'C3', right: 'G4 C5 E5', tip: '最低音是 5 度' },
          ],
          example: {
            id: '1-1',
            title: '譜例 1-1：C 的三個轉位，上行再下行',
            bpm: 72,
            bars: [
              { name: 'C', label: 'C 原位', left: 'C3', right: 'C4 E4 G4' },
              { name: 'C', label: 'C 一轉', left: 'C3', right: 'E4 G4 C5' },
              { name: 'C', label: 'C 二轉', left: 'C3', right: 'G4 C5 E5' },
              { name: 'C', label: 'C 原位', left: 'C3', right: 'C5 E5 G5' },
              { name: 'C', label: 'C 二轉', left: 'C3', right: 'G4 C5 E5' },
              { name: 'C', label: 'C 一轉', left: 'C3', right: 'E4 G4 C5' },
              { name: 'C', label: 'C 原位', left: 'C3', right: 'C4 E4 G4' },
            ],
          },
        },
        {
          title: '小三和弦的三個轉位',
          body: ['小三和弦一樣有三種排法，規則完全相同。C 大調裡的三個小三和弦是 Dm、Em、Am，都是白鍵，先從它們開始。'],
          chords: [
            { id: 'Am-inv0', name: 'Am', label: '原位', left: 'A2', right: 'A3 C4 E4' },
            { id: 'Am-inv1', name: 'Am', label: '第一轉位', left: 'A2', right: 'C4 E4 A4' },
            { id: 'Am-inv2', name: 'Am', label: '第二轉位', left: 'A2', right: 'E4 A4 C5' },
            { id: 'Dm-inv0', name: 'Dm', label: '原位', left: 'D3', right: 'D4 F4 A4' },
            { id: 'Dm-inv1', name: 'Dm', label: '第一轉位', left: 'D3', right: 'F4 A4 D5' },
            { id: 'Dm-inv2', name: 'Dm', label: '第二轉位', left: 'D3', right: 'A3 D4 F4' },
            { id: 'Em-inv0', name: 'Em', label: '原位', left: 'E3', right: 'E4 G4 B4' },
            { id: 'Em-inv1', name: 'Em', label: '第一轉位', left: 'E3', right: 'G4 B4 E5' },
            { id: 'Em-inv2', name: 'Em', label: '第二轉位', left: 'E3', right: 'B3 E4 G4' },
          ],
        },
        {
          title: '最近轉位連接：C – Am – F – G',
          body: [
            '規則只有兩條：① 共同音不動；② 其他的音走到最近的和弦內音。',
            'C（C E G）→ Am：C、E 不動，G 往上一個全音到 A，就是 Am 的第一轉位。Am → F：A、C 不動，E 往上半音到 F，得到 F 的第二轉位。F → G：沒有共同音，三個手指一起往下一兩個半音，得到 G 的第一轉位。',
            '鍵盤圖上有虛線外圈的是共同音（不動的手指）。整段右手都留在 C4 附近，不用再跳。',
          ],
          example: {
            id: '1-2',
            title: '譜例 1-2：C – Am – F – G 最近轉位',
            bpm: 76,
            bars: [
              { name: 'C', left: 'C3', right: 'C4 E4 G4' },
              { name: 'Am', left: 'A2', right: 'C4 E4 A4' },
              { name: 'F', left: 'F2', right: 'C4 F4 A4' },
              { name: 'G', left: 'G2', right: 'B3 D4 G4' },
            ],
          },
          link: { to: 'backing/l-1', text: '跟著配樂彈 C – Am – F – G' },
        },
        {
          title: '任一調總覽',
          body: ['選一個根音和大小調，三個轉位並排顯示。換一個根音，看三種形狀在黑鍵上長什麼樣子。'],
          widget: 'inversions',
        },
      ],
    },
    {
      id: 'sevenths',
      no: '02',
      title: '七和弦放進手裡',
      subtitle: '你懂七和弦的種類，這裡學怎麼彈',
      gain: '同一個進行聽起來更柔、更有層次',
      intro: [
        '在順階三和弦上再疊一個三度，就得到順階七和弦。你已經知道 maj7、m7、7、m7♭5 是什麼，這一單元處理的是手：四個音怎麼排、哪些音可以省。',
        '兩個方向：一是只彈最重要的 3 度與 7 度（shell voicing），左手彈根音；二是把 7 度加進 01 學的三和弦轉位，一樣用最近連接。',
      ],
      sections: [
        {
          title: '順階七和弦',
          body: [
            '大調裡的七個七和弦：Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7。跟首頁的順階三和弦對照：大三和弦變成 maj7（I、IV）或 7（V），小三和弦變成 m7，減三和弦變成 m7♭5。',
            '整個大調只有一個屬七和弦（V7），它是最想「回家」的和弦。',
          ],
          widget: 'diatonic7',
        },
        {
          title: 'Shell voicing：只彈 3 度和 7 度',
          body: [
            '3 度決定大調還是小調，7 度決定是 maj7 還是 ♭7。這兩個音一出來，和弦的性格就定了。5 度在 maj7、m7、7 裡都一樣，省掉也不會改變和弦是誰；根音交給左手。',
            '右手只有兩個音，3 度在下面或 7 度在下面都可以，選離上一個和弦最近的那一種。',
          ],
          chords: [
            { id: 'Cmaj7-shell', name: 'Cmaj7', label: 'Shell（3 在下）', left: 'C3', right: 'E4 B4' },
            { id: 'Dm7-shell', name: 'Dm7', label: 'Shell（3 在下）', left: 'D3', right: 'F4 C5' },
            { id: 'G7-shell', name: 'G7', label: 'Shell（7 在下）', left: 'G2', right: 'F4 B4' },
            { id: 'Am7-shell', name: 'Am7', label: 'Shell（7 在下）', left: 'A2', right: 'G4 C5' },
          ],
        },
        {
          title: '右手四音版本',
          body: [
            '把 7 度加進右手的三和弦，四個音排成最近的位置。Cmaj7 → Am7 只要把 B 換成 A；Am7 → Dm7 把 E、G 換成 D、F；Dm7 → G7 每個音最多走一個全音。',
            '四音的轉位一樣用「共同音不動」的規則。手會一直停在同一個位置，只有手指在換。',
          ],
          example: {
            id: '2-1',
            title: '譜例 2-1：Cmaj7 – Am7 – Dm7 – G7',
            bpm: 72,
            bars: [
              { name: 'Cmaj7', left: 'C3', right: 'C4 E4 G4 B4' },
              { name: 'Am7', left: 'A2', right: 'C4 E4 G4 A4' },
              { name: 'Dm7', left: 'D3', right: 'C4 D4 F4 A4' },
              { name: 'G7', left: 'G2', right: 'B3 D4 F4 G4' },
            ],
          },
        },
        {
          title: 'ii – V – I：三全音想解決',
          body: [
            'G7 的 3 度（B）和 7 度（F）相差三個全音，這個音程很不穩定，聽起來「想走」。B 想往上半音到 C，F 想往下半音到 E——剛好落在 C 和弦上。',
            '用 shell 彈 Dm7 – G7 – Cmaj7，每次換和弦只有一個音走半音：Dm7（F C）→ G7（F B）是 C 往下到 B；G7（F B）→ Cmaj7（E B）是 F 往下到 E。另一個音不動。',
          ],
          example: {
            id: '2-2',
            title: '譜例 2-2：Dm7 – G7 – Cmaj7（shell）',
            bpm: 72,
            bars: [
              { name: 'Dm7', left: 'D3', right: 'F4 C5' },
              { name: 'G7', left: 'G2', right: 'F4 B4' },
              { name: 'Cmaj7', left: 'C3', right: 'E4 B4' },
              { name: 'Cmaj7', left: 'C3', right: 'E4 B4' },
            ],
          },
          link: { to: 'backing/j-1', text: '跟著配樂彈 ii – V – I' },
        },
      ],
    },
    {
      id: 'colors',
      no: '03',
      title: '色彩和弦',
      subtitle: '在三和弦上只動一個音',
      gain: '同一個進行可以有很多種聲音',
      intro: [
        '色彩和弦不是新的和弦家族，而是在你會的三和弦上換掉或加上一個音：把 3 度換成 2 度或 4 度就是 sus；加上 9 度就是 add9；加上 6 度就是 6。',
        '鍵盤上的重點是「放在哪」：色彩音放在右手最上面最明顯，放在中間比較融合；音太多時先省 5 度。',
      ],
      sections: [
        {
          title: 'sus2 / sus4：把 3 度換掉',
          body: [
            '3 度是決定大調或小調的音。拿掉它，換成 2 度（sus2）或 4 度（sus4），和弦就不大也不小，聽起來懸在半空中。',
            'sus4 很想回到 3 度（G 往下到 F♯），sus2 比較開闊，可以停著不解決。',
          ],
          chords: [
            { id: 'Dsus2', name: 'Dsus2', left: 'D3', right: 'D4 E4 A4', tip: '3 度往下一個全音' },
            { id: 'D', name: 'D', left: 'D3', right: 'D4 F#4 A4' },
            { id: 'Dsus4', name: 'Dsus4', left: 'D3', right: 'D4 G4 A4', tip: '3 度往上半音' },
          ],
          example: {
            id: '3-2',
            title: '譜例 3-2：Dsus2 – D – Dsus4 – D',
            bpm: 72,
            bars: [
              { name: 'Dsus2', left: 'D3', right: 'D4 E4 A4' },
              { name: 'D', left: 'D3', right: 'D4 F#4 A4' },
              { name: 'Dsus4', left: 'D3', right: 'D4 G4 A4' },
              { name: 'D', left: 'D3', right: 'D4 F#4 A4' },
            ],
          },
        },
        {
          title: 'add9 與 maj9 / m9：差在有沒有 7 度',
          body: [
            'add9 是三和弦加上 9 度（就是高八度的 2 度），沒有 7 度，聲音清亮。maj9、m9 是七和弦再加 9 度，比較濃、比較爵士。',
            '五個音一隻右手彈不完：左手彈根音，右手就不用再彈根音；還是太多就省 5 度。',
          ],
          chords: [
            { id: 'Cadd9', name: 'Cadd9', left: 'C3', right: 'E4 G4 D5', tip: '沒有 7 度' },
            { id: 'Cmaj9', name: 'Cmaj9', left: 'C3', right: 'E4 G4 B4 D5', tip: '右手省掉根音' },
            { id: 'Am9', name: 'Am9', left: 'A2', right: 'C4 E4 G4 B4', tip: '右手省掉根音' },
          ],
        },
        {
          title: '6 與 m6',
          body: ['6 和弦是三和弦加上 6 度，沒有 7 度。C6 的音和 Am7 一樣，差在左手彈誰；m6 的 6 度是大六度，聽起來比 m7 更有懸疑感。'],
          chords: [
            { id: 'C6', name: 'C6', left: 'C3', right: 'E4 G4 A4' },
            { id: 'Dm6', name: 'Dm6', left: 'D3', right: 'F4 A4 B4' },
          ],
        },
        {
          title: '鍵盤排法：9 度放哪、開放排列',
          body: [
            '9 度放在右手最上面，旋律感最強；放在中間（和 3 度擠在一起），聲音比較霧、比較融合。兩種都省掉 5 度。',
            '開放排列：左手張開彈根音與 5 度，右手彈 3、7、9。和弦在低音區不會糊在一起，上面又有延伸音的顏色，是鋼琴上最常聽到的「好聽排法」。',
          ],
          chords: [
            { id: 'Cmaj9-top', name: 'Cmaj9', label: '9 在最上面', left: 'C3', right: 'E4 B4 D5' },
            { id: 'Cmaj9-mid', name: 'Cmaj9', label: '9 在中間', left: 'C3', right: 'B3 D4 E4' },
            { id: 'Cmaj9-open', name: 'Cmaj9', label: '開放排列', left: 'C3 G3', right: 'E4 B4 D5' },
            { id: 'Am9-open', name: 'Am9', label: '開放排列', left: 'A2 E3', right: 'C4 G4 B4' },
            { id: 'Fmaj9-open', name: 'Fmaj9', label: '開放排列', left: 'F2 C3', right: 'A3 E4 G4' },
          ],
          example: {
            id: '3-1',
            title: '譜例 3-1：Cadd9 – Cmaj7 – Am7 – Fmaj7',
            bpm: 70,
            bars: [
              { name: 'Cadd9', left: 'C3', right: 'E4 G4 D5' },
              { name: 'Cmaj7', left: 'C3', right: 'E4 G4 B4' },
              { name: 'Am7', left: 'A2', right: 'E4 G4 C5' },
              { name: 'Fmaj7', left: 'F2', right: 'E4 A4 C5' },
            ],
          },
        },
        {
          title: '避免音：大三和弦上的 11 度',
          body: [
            'C 大三和弦加上 F（11 度），F 和 3 度 E 只差半音，而且 F 在 E 上面一個八度又多一點（小九度），兩個音互相磨擦，聽起來像彈錯。',
            '要用 4 度的顏色，就把 3 度拿掉變成 sus4；或者把 F 升半音變成 ♯11（Lydian 的聲音），這時它和 E 是大七度，就不打架了。',
          ],
          chords: [
            { id: 'C-avoid', name: 'C', label: '加 F：打架', left: 'C3', right: 'E4 G4 F5', tip: 'E 與 F 相差小九度', check: false },
            { id: 'Csus4-fix', name: 'Csus4', label: '改成 sus4', left: 'C3', right: 'F4 G4 C5' },
            { id: 'C-lyd', name: 'Cmaj7#11', label: '改成 ♯11', left: 'C3', right: 'E4 B4 F#5' },
          ],
        },
      ],
    },
    {
      id: 'pedal',
      no: '04',
      title: '持續音',
      subtitle: '左手不動，只移動右手',
      gain: '底下不動、上面在飄的聲音',
      intro: [
        '左手壓住一個音（或根音加 5 度）一直不動，右手在上面換和弦。低音不變，上面的和弦每換一次，和低音的關係就變一次，顏色跟著變。',
        '這是電影配樂、後搖、氛圍音樂最常用的手法，也是最容易「自己彈得很好聽」的方法：右手用你最熟的三和弦就夠了。',
      ],
      sections: [
        {
          title: '同一個手型，不同位置',
          body: [
            '左手彈 D 和 A，右手用原位三和弦在 D 大調裡往上走：D、Em、G、A。右手形狀幾乎不變，只是換位置；但因為底下一直是 D，每個和弦聽起來都不一樣。',
            '寫法上，右手的和弦配上不同的低音，就寫成 slash chord：Em/D、G/D、A/D。',
          ],
          example: {
            id: '4-1',
            pedal: true,
            title: '譜例 4-1：D 持續音上的 D – Em/D – G/D – A/D',
            bpm: 66,
            bars: [
              { name: 'D', left: 'D2 A2', right: 'D4 F#4 A4' },
              { name: 'Em/D', left: 'D2 A2', right: 'E4 G4 B4' },
              { name: 'G/D', left: 'D2 A2', right: 'G4 B4 D5' },
              { name: 'A/D', left: 'D2 A2', right: 'A4 C#5 E5' },
            ],
          },
          link: { to: 'backing/p-1', text: '跟著 D 持續音配樂彈' },
        },
        {
          title: 'Slash chord：低音和和弦分開看',
          body: [
            '斜線左邊是右手的和弦，右邊是左手的低音。C/E 是 C 和弦配 E 低音（其實就是第一轉位，只是由左手來彈 3 度）；F/C、G/C 是低音不在和弦裡、或不是根音的情況。',
            '讀 slash chord 時不用想「這是什麼複雜和弦」，直接拆成兩隻手：左手彈斜線後面，右手彈斜線前面。',
          ],
          chords: [
            { id: 'C/E', name: 'C/E', left: 'E2', right: 'G3 C4 E4', tip: '左手彈 3 度' },
            { id: 'F/C', name: 'F/C', left: 'C3', right: 'F4 A4 C5', tip: '左手彈 5 度' },
            { id: 'G/C', name: 'G/C', left: 'C3', right: 'D4 G4 B4', tip: 'C 不在 G 和弦裡' },
          ],
        },
        {
          title: '反過來：上面不動，低音移動',
          body: ['右手固定彈 G C E（C 和弦的第二轉位），左手低音依序換成 C、A、F、G。上面一個音都沒動，和弦卻變成 C、Am7、Fmaj9（沒有 3 度）、C/G。'],
          example: {
            id: '4-3',
            title: '練習：右手不動，左手換低音',
            bpm: 66,
            bars: [
              { name: 'C', left: 'C3', right: 'G4 C5 E5' },
              { name: 'Am7', left: 'A2', right: 'G4 C5 E5' },
              { name: 'C/F', label: 'C/F', left: 'F2', right: 'G4 C5 E5' },
              { name: 'C/G', left: 'G2', right: 'G4 C5 E5' },
            ],
          },
        },
        {
          title: '調式初探：同一個持續音，換情緒',
          body: [
            '同樣是 C 持續音：右手彈 Cmaj7 是大調，安定；換成 D/C（D 大三和弦在 C 上面），裡面的 F♯ 是 C 的 ♯4，聲音立刻變亮、變飄，這是 Lydian。',
            '換到 D 持續音：Dm7 → G/D 裡的 B 是 D 的大六度，小調卻不暗，這是 Dorian。到 Drone 頁開一個持續音，切換調式，鍵盤上會標出每個調式的音。',
          ],
          example: {
            id: '4-2',
            pedal: true,
            title: '譜例 4-2：C 持續音上的 Cmaj7 – D/C（Lydian）',
            bpm: 60,
            bars: [
              { name: 'Cmaj7', left: 'C2 G2', right: 'E4 G4 B4' },
              { name: 'D/C', left: 'C2 G2', right: 'D4 F#4 A4' },
              { name: 'Cmaj7', left: 'C2 G2', right: 'E4 G4 B4' },
              { name: 'D/C', left: 'C2 G2', right: 'D4 F#4 A4' },
            ],
          },
          chords: [
            { id: 'Dm7-dor', name: 'Dm7', label: 'Dorian 1', left: 'D3', right: 'C4 F4 A4' },
            { id: 'G/D-dor', name: 'G/D', label: 'Dorian 2', left: 'D3', right: 'B3 D4 G4', tip: 'B 是 D 的大六度' },
          ],
          link: { to: 'drone/C/lydian', text: '打開 C Lydian Drone' },
        },
      ],
    },
  ],

  // 單元地圖（00 頁與首頁使用）
  roadmap: [
    { id: 'inversions', step: '右手不跳', text: '同一個和弦換排法，共同音不動' },
    { id: 'sevenths', step: '多一個音', text: '在轉位上加 7 度；或只彈 3、7' },
    { id: 'colors', step: '換一個音', text: 'sus、add9、6：三和弦只動一個音' },
    { id: 'pedal', step: '左手不動', text: '低音固定，右手用前面學的手型移動' },
  ],

  plan: [
    {
      week: 1,
      theme: '順階和弦 + 黑鍵',
      goal: '任選 C、G、F 大調，能彈出七個順階三和弦',
      items: [
        { id: 'w1-quiz', text: '測驗「只出黑鍵」連續答對 15 題', to: 'quiz/note-black' },
        { id: 'w1-g', text: 'G 大調順階三和弦上行下行，節拍器 60', to: 'chords/key/G' },
        { id: 'w1-f', text: 'F 大調順階三和弦上行下行，節拍器 60', to: 'chords/key/F' },
        { id: 'w1-root', text: '測驗「順階和弦的根音」連續答對 10 題', to: 'quiz/diatonic' },
      ],
    },
    {
      week: 2,
      theme: '大三和弦轉位',
      goal: '任一大三和弦能彈出三個轉位',
      items: [
        { id: 'w2-11', text: '譜例 1-1 跟著播放彈三次', to: 'unit/inversions' },
        { id: 'w2-cgdf', text: 'C、G、D、F 三個轉位上行下行，節拍器 70', to: 'unit/inversions' },
        { id: 'w2-black', text: 'E♭、A♭、B♭ 三個轉位各彈一次（看總覽）', to: 'unit/inversions' },
      ],
    },
    {
      week: 3,
      theme: '小三和弦 + 最近連接',
      goal: '換和弦時右手不跳，用最近轉位接',
      items: [
        { id: 'w3-min', text: 'Am、Dm、Em 三個轉位上行下行', to: 'unit/inversions' },
        { id: 'w3-12', text: '譜例 1-2 跟著播放彈三次', to: 'unit/inversions' },
        { id: 'w3-back', text: '配樂「C – Am – F – G」彈完三輪，右手保持在同一個八度內', to: 'backing/l-1' },
        { id: 'w3-pop', text: '配樂「G – D – Em – C」用最近轉位彈三輪', to: 'backing/pop-g' },
      ],
    },
    {
      week: 4,
      theme: '順階七和弦',
      goal: 'C 大調七個七和弦不看圖彈得出來',
      items: [
        { id: 'w4-quiz', text: '測驗：找和弦的 3 度與 7 度，連續答對 10 題', to: 'quiz/tone-37' },
        { id: 'w4-21', text: '譜例 2-1 跟著播放彈三次', to: 'unit/sevenths' },
        { id: 'w4-dia', text: 'C 大調七個七和弦上行下行（不看圖）', to: 'unit/sevenths' },
      ],
    },
    {
      week: 5,
      theme: 'Shell 與 ii–V–I',
      goal: '在 C、F、G 三個調彈 ii–V–I shell',
      items: [
        { id: 'w5-22', text: '譜例 2-2 跟著播放彈三次', to: 'unit/sevenths' },
        { id: 'w5-keys', text: 'F 大調（Gm7 – C7 – Fmaj7）、G 大調（Am7 – D7 – Gmaj7）shell 各彈五次', to: 'chords/Gm7' },
        { id: 'w5-back', text: '配樂「Am7 – Dm7 – G7 – Cmaj7」只彈 shell', to: 'backing/j-2' },
      ],
    },
    {
      week: 6,
      theme: 'sus 與 add9',
      goal: '同一個進行能換出三種顏色',
      items: [
        { id: 'w6-32', text: '譜例 3-2 跟著播放彈三次', to: 'unit/colors' },
        { id: 'w6-color', text: '配樂 I–V–vi–IV：每個和弦都加一個色彩音（sus2、sus4 或 add9）', to: 'backing/pop-1564' },
        { id: 'w6-three', text: '同一段 I–V–vi–IV 彈三輪：原本、全部 sus2、全部 add9', to: 'backing/pop-1564' },
      ],
    },
    {
      week: 7,
      theme: '延伸音與開放排列',
      goal: '能用開放排列彈 maj9、m9',
      items: [
        { id: 'w7-31', text: '譜例 3-1 跟著播放彈三次', to: 'unit/colors' },
        { id: 'w7-open', text: 'Cmaj9、Fmaj9、Am9、Dm9 開放排列各彈五次', to: 'chords/Dm9' },
        { id: 'w7-back', text: '配樂「Fmaj7 – Cmaj7 – Am7 – Em7」開放排列彈三輪', to: 'backing/n-1' },
      ],
    },
    {
      week: 8,
      theme: '持續音',
      goal: '在一個持續音上自由彈 3 分鐘',
      items: [
        { id: 'w8-41', text: '譜例 4-1 跟著播放彈三次', to: 'unit/pedal' },
        { id: 'w8-42', text: '譜例 4-2 跟著播放彈三次', to: 'unit/pedal' },
        { id: 'w8-major', text: '開 D Drone，用大調彈 3 分鐘', to: 'drone/D/major' },
        { id: 'w8-dorian', text: '開 D Drone，用 Dorian 彈 3 分鐘', to: 'drone/D/dorian' },
      ],
    },
  ],

  routine: [
    { min: 5, title: '暖手', text: '黑鍵測驗，或這週的調的順階和弦上行下行。', to: 'quiz/note-black' },
    { min: 10, title: '新內容', text: '這週單元的譜例，開節拍器，彈得乾淨就好，不求快。', to: 'plan' },
    { min: 10, title: '放進音樂', text: '挑一段配樂：第一輪柱式、第二輪分解、第三輪只彈右手。', to: 'backing' },
    { min: 5, title: '自由彈', text: '開 Drone，不看譜，用這週學的手型隨便彈。', to: 'drone' },
  ],

  progressionCats: [
    { id: 'lesson', name: '單元練習' },
    { id: 'pop', name: '流行' },
    { id: 'ballad', name: '抒情・鋼琴' },
    { id: 'minor', name: '小調' },
    { id: 'jazz', name: '爵士・Neo Soul' },
    { id: 'groove', name: '藍調・放克' },
    { id: 'modal', name: '持續音・調式' },
  ],

  progressions: [
    // 單元練習
    { id: 'l-1', name: 'C – Am – F – G', desc: '01 的最近轉位連接。右手留在 C4 附近，不要跳。', cat: 'lesson', bpm: 80, style: 'pop8', bars: ['C', 'Am', 'F', 'G'] },
    { id: 'l-2', name: 'C 的三個轉位', desc: '同一個和弦停四小節，自己輪流換原位、一轉、二轉。', cat: 'lesson', bpm: 70, style: 'block', bars: ['C', 'C', 'C', 'C'] },
    { id: 'l-3', name: 'Am – Dm – Em – Am', desc: '三個小三和弦的轉位練習。', cat: 'lesson', bpm: 76, style: 'ballad', bars: ['Am', 'Dm', 'Em', 'Am'] },
    { id: 'l-4', name: 'C 大調順階三和弦', desc: 'I 到 vii° 上行再下行，一小節一個。', cat: 'lesson', bpm: 70, style: 'block', bars: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'C'] },
    { id: 'l-5', name: 'Cmaj7 – Am7 – Dm7 – G7', desc: '譜例 2-1，右手四音最近連接。', cat: 'lesson', bpm: 76, style: 'ballad', bars: ['Cmaj7', 'Am7', 'Dm7', 'G7'] },
    { id: 'l-6', name: 'Dsus2 – D – Dsus4 – D', desc: '譜例 3-2，只動一根手指。', cat: 'lesson', bpm: 72, style: 'arp', bars: ['Dsus2', 'D', 'Dsus4', 'D'] },
    { id: 'l-7', name: 'Cadd9 – Cmaj7 – Am7 – Fmaj7', desc: '譜例 3-1，每換一個和弦只有一個音在動。', cat: 'lesson', bpm: 70, style: 'arp', bars: ['Cadd9', 'Cmaj7', 'Am7', 'Fmaj7'] },
    { id: 'l-8', name: 'G 大調順階三和弦', desc: 'G Am Bm C D Em F♯°：第一週練黑鍵用。', cat: 'lesson', bpm: 60, style: 'block', bars: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim', 'G'] },
    { id: 'l-9', name: 'F 大調順階三和弦', desc: 'F Gm Am B♭ C Dm E°。', cat: 'lesson', bpm: 60, style: 'block', bars: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim', 'F'] },

    // 流行
    { id: 'pop-1564', name: 'C – G – Am – F', desc: 'I–V–vi–IV，最常聽到的流行進行。第六週用來加色彩音。', cat: 'pop', bpm: 92, style: 'pop8', bars: ['C', 'G', 'Am', 'F'] },
    { id: 'pop-g', name: 'G – D – Em – C', desc: '同樣是 I–V–vi–IV，換到 G 大調，多一個 F♯。', cat: 'pop', bpm: 96, style: 'pop8', bars: ['G', 'D', 'Em', 'C'] },
    { id: 'pop-6415', name: 'Am – F – C – G', desc: 'vi–IV–I–V，從小和弦開始，比較有情緒。', cat: 'pop', bpm: 88, style: 'pop8', bars: ['Am', 'F', 'C', 'G'] },
    { id: 'pop-1451', name: 'D – G – A – D', desc: 'I–IV–V–I，最基本的「回家」。', cat: 'pop', bpm: 100, style: 'rock', bars: ['D', 'G', 'A', 'D'] },
    { id: 'pop-50s', name: 'C – Am – Dm – G', desc: 'I–vi–ii–V，老歌的循環。', cat: 'pop', bpm: 84, style: 'waltz', bars: ['C', 'Am', 'Dm', 'G'] },
    { id: 'pop-eb', name: 'E♭ – B♭ – Cm – A♭', desc: 'I–V–vi–IV 在 E♭：全部都有黑鍵。', cat: 'pop', bpm: 90, style: 'pop8', bars: ['Eb', 'Bb', 'Cm', 'Ab'] },
    { id: 'pop-sus', name: 'Csus2 – G – Am7 – Fadd9', desc: '把 I–V–vi–IV 加上顏色之後的樣子。', cat: 'pop', bpm: 88, style: 'arp', bars: ['Csus2', 'G', 'Am7', 'Fadd9'] },
    { id: 'pop-4536', name: 'F – G – Em – Am', desc: 'IV–V–iii–vi，日系流行常見的走法。', cat: 'pop', bpm: 96, style: 'pop8', bars: ['F', 'G', 'Em', 'Am'] },
    { id: 'pop-climb', name: 'C – C/E – F – G', desc: '低音一路往上爬：C、E、F、G。', cat: 'pop', bpm: 90, style: 'rock', bars: ['C', 'C/E', 'F', 'G'] },

    // 抒情・鋼琴
    { id: 'b-1', name: 'C – G/B – Am – F', desc: '低音一步一步往下走，抒情歌的經典開頭。', cat: 'ballad', bpm: 68, style: 'arp', bars: ['C', 'G/B', 'Am', 'F'] },
    { id: 'b-2', name: 'Fmaj7 – G – Em7 – Am', desc: 'IVmaj7 開頭，柔和不刺耳。', cat: 'ballad', bpm: 70, style: 'ballad', bars: ['Fmaj7', 'G', 'Em7', 'Am'] },
    { id: 'b-3', name: 'D – A/C# – Bm – G', desc: 'D 大調的下行低音。', cat: 'ballad', bpm: 66, style: 'arp', bars: ['D', 'A/C#', 'Bm', 'G'] },
    { id: 'b-4', name: 'Cadd9 – Em7 – Fmaj7 – G6', desc: '每個和弦都帶一點顏色。', cat: 'ballad', bpm: 64, style: 'arp68', bars: ['Cadd9', 'Em7', 'Fmaj7', 'G6'] },
    { id: 'b-5', name: 'A♭ – E♭/G – Fm7 – D♭maj7', desc: 'A♭ 大調，黑鍵很多但手很舒服。', cat: 'ballad', bpm: 66, style: 'ballad', bars: ['Ab', 'Eb/G', 'Fm7', 'Dbmaj7'] },
    { id: 'b-6', name: 'F – C/E – Dm – B♭', desc: 'F 大調下行低音，最後落在 IV。', cat: 'ballad', bpm: 70, style: 'arp', bars: ['F', 'C/E', 'Dm', 'Bb'] },

    // 小調
    { id: 'm-1', name: 'Am – G – F – E', desc: '小調下行（安達魯西亞進行），E 是大三和弦。', cat: 'minor', bpm: 92, style: 'rock', bars: ['Am', 'G', 'F', 'E'] },
    { id: 'm-2', name: 'Am – Dm – E7 – Am', desc: 'i–iv–V7–i，和聲小調的回家。', cat: 'minor', bpm: 80, style: 'waltz', bars: ['Am', 'Dm', 'E7', 'Am'] },
    { id: 'm-3', name: 'Em – C – G – D', desc: '從 vi 開始的 G 大調，聽起來是小調。', cat: 'minor', bpm: 94, style: 'pop8', bars: ['Em', 'C', 'G', 'D'] },
    { id: 'm-4', name: 'Dm – B♭ – F – C', desc: 'D 小調的流行走法。', cat: 'minor', bpm: 88, style: 'pop8', bars: ['Dm', 'Bb', 'F', 'C'] },
    { id: 'm-5', name: 'Cm – A♭ – E♭ – B♭', desc: 'C 小調：E♭、A♭、B♭ 三個黑鍵根音。', cat: 'minor', bpm: 84, style: 'ballad', bars: ['Cm', 'Ab', 'Eb', 'Bb'] },
    { id: 'm-6', name: 'F♯m – D – A – E', desc: 'F♯ 小調，練黑鍵三和弦。', cat: 'minor', bpm: 90, style: 'pop8', bars: ['F#m', 'D', 'A', 'E'] },

    // 爵士・Neo Soul
    { id: 'j-1', name: 'Dm7 – G7 – Cmaj7', desc: 'ii–V–I，譜例 2-2 用 shell 彈。', cat: 'jazz', bpm: 90, style: 'swing', bars: ['Dm7', 'G7', 'Cmaj7', 'Cmaj7'] },
    { id: 'j-2', name: 'Am7 – Dm7 – G7 – Cmaj7', desc: 'vi–ii–V–I，第五週只彈 shell。', cat: 'jazz', bpm: 92, style: 'swing', bars: ['Am7', 'Dm7', 'G7', 'Cmaj7'] },
    { id: 'j-3', name: 'Gm7 – C7 – Fmaj7', desc: 'F 大調的 ii–V–I。', cat: 'jazz', bpm: 90, style: 'swing', bars: ['Gm7', 'C7', 'Fmaj7', 'Fmaj7'] },
    { id: 'j-4', name: 'Am7 – D7 – Gmaj7', desc: 'G 大調的 ii–V–I。', cat: 'jazz', bpm: 90, style: 'swing', bars: ['Am7', 'D7', 'Gmaj7', 'Gmaj7'] },
    { id: 'j-5', name: 'Cmaj7 – A7 – Dm7 – G7', desc: 'I–VI7–ii–V，A7 借來的屬七讓進行更推。', cat: 'jazz', bpm: 100, style: 'bossa', bars: ['Cmaj7', 'A7', 'Dm7', 'G7'] },
    { id: 'n-1', name: 'Fmaj7 – Cmaj7 – Am7 – Em7', desc: '第七週用開放排列彈三輪。', cat: 'jazz', bpm: 76, style: 'neosoul', bars: ['Fmaj7', 'Cmaj7', 'Am7', 'Em7'] },
    { id: 'n-2', name: 'Dm9 – G13 – Cmaj9', desc: '延伸音版本的 ii–V–I。', cat: 'jazz', bpm: 80, style: 'neosoul', bars: ['Dm9', 'G13', 'Cmaj9', 'Cmaj9'] },
    { id: 'n-3', name: 'E♭maj7 – D7 – Gm7 – Gm7', desc: 'Neo soul 常見的四小節循環。', cat: 'jazz', bpm: 78, style: 'neosoul', bars: ['Ebmaj7', 'D7', 'Gm7', 'Gm7'] },
    { id: 'n-4', name: 'Fmaj9 – Em7 – Dm9 – Cmaj9', desc: '一路往下的順階七和弦。', cat: 'jazz', bpm: 74, style: 'bossa', bars: ['Fmaj9', 'Em7', 'Dm9', 'Cmaj9'] },

    // 藍調・放克
    { id: 'g-blues', name: 'C 十二小節藍調', desc: '三個屬七和弦：C7、F7、G7。', cat: 'groove', bpm: 100, style: 'shuffle', bars: ['C7', 'F7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7'] },
    { id: 'g-fk', name: 'Am7 – D7', desc: 'Dorian 放克的兩個和弦，右手短促的 stab。', cat: 'groove', bpm: 102, style: 'funk', bars: ['Am7', 'Am7', 'D7', 'D7'] },
    { id: 'g-fk2', name: 'Em7 – A7', desc: '同樣是 i7–IV7，換到 E。', cat: 'groove', bpm: 98, style: 'funk', bars: ['Em7', 'A7', 'Em7', 'A7'] },
    { id: 'g-mixo', name: 'D – C – G – D', desc: 'Mixolydian 的 I–♭VII–IV–I，搖滾味。', cat: 'groove', bpm: 108, style: 'rock', bars: ['D', 'C', 'G', 'D'] },

    // 持續音・調式
    { id: 'p-1', name: 'D – Em/D – G/D – A/D', desc: '譜例 4-1：左手 D 不動，右手往上移。', cat: 'modal', bpm: 66, style: 'pedal', bars: ['D', 'Em/D', 'G/D', 'A/D'] },
    { id: 'p-2', name: 'Cmaj7 – D/C', desc: '譜例 4-2：C Lydian，兩個和弦來回。', cat: 'modal', bpm: 60, style: 'pedal', bars: ['Cmaj7', 'D/C', 'Cmaj7', 'D/C'] },
    { id: 'p-3', name: 'Dm7 – G/D', desc: 'D Dorian：小調但 6 度是亮的。', cat: 'modal', bpm: 84, style: 'neosoul', bars: ['Dm7', 'G/D', 'Dm7', 'G/D'] },
    { id: 'p-4', name: 'C – F/C – G/C – F/C', desc: 'C 持續音上的 I、IV、V。', cat: 'modal', bpm: 70, style: 'arp', bars: ['C', 'F/C', 'G/C', 'F/C'] },
    { id: 'p-5', name: 'E – D/E – A/E – E', desc: 'E Mixolydian，D/E 是 ♭VII。', cat: 'modal', bpm: 92, style: 'rock', bars: ['E', 'D/E', 'A/E', 'E'] },
    { id: 'p-6', name: 'Am – Bm/A – C/A – Bm/A', desc: 'A Dorian：右手在 A 上面往上走。', cat: 'modal', bpm: 72, style: 'pedal', bars: ['Am', 'Bm/A', 'C/A', 'Bm/A'] },
    { id: 'p-7', name: 'E♭ 持續音（自由練習）', desc: '只有 E♭ 和弦的鋪底，沒有鼓。試大調、Lydian、Mixolydian。', cat: 'modal', bpm: 72, style: 'pedal', bars: ['Eb', 'Eb', 'Eb', 'Eb'] },
  ],

  patterns: [
    { id: 'block', name: '柱式（全音符）', meter: '4/4', steps: 16, keys: 'x---------------', bass: 'x---------------' },
    { id: 'ballad', name: '抒情（二分音符）', meter: '4/4', steps: 16, keys: 'x-------x-------', bass: 'x-------x-------', kick: 'x.........x.....', snare: '........x.......', hat: 'g...g...g...g...' },
    { id: 'arp', name: '分解（八分）', meter: '4/4', steps: 16, keys: '0.1.2.3.0.1.2.3.', bass: 'x---------------', hat: 'g...g...g...g...' },
    { id: 'pop8', name: '流行八分', meter: '4/4', steps: 16, keys: 'x...x...x...x...', bass: 'x.....x.x.......', kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    { id: 'rock', name: '搖滾', meter: '4/4', steps: 16, keys: 'x.x.x.x.x.x.x.x.', bass: 'x.x.x.x.x.x.x.x.', kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    { id: 'waltz', name: '華爾滋（3/4）', meter: '3/4', steps: 12, beat: 4, keys: 'l...r...r...', bass: 'x-----------', kick: 'x...........', hat: '....g...g...' },
    { id: 'arp68', name: '6/8 分解', meter: '6/8', steps: 12, beat: 2, accent: [0, 6], keys: '0.1.2.3.2.1.', bass: 'x-----------', kick: 'x.....x.....', hat: 'g.g.g.g.g.g.' },
    { id: 'swing', name: '搖擺（shell 用）', meter: '4/4', steps: 16, keys: 'x-----r-....r...', bass: 'x...o...x...8...', hat: 'x...x..gx...x..g', rim: '....x.......x...' },
    { id: 'bossa', name: 'Bossa Nova', meter: '4/4', steps: 16, keys: 'x..r..r...r..r..', bass: 'x..o..o.x..o..o.', kick: 'x..x..x.x..x..x.', rim: 'x..x..x...x..x..', hat: 'gggggggggggggggg' },
    { id: 'neosoul', name: 'Neo Soul', meter: '4/4', steps: 16, keys: 'x-------...r-...', bass: 'x.....x...x.....', kick: 'x......x..x.....', snare: '....x.......x..g', hat: 'x.x.x.x.x.x.x.x.' },
    { id: 'funk', name: '放克十六分', meter: '4/4', steps: 16, keys: '..r...r...r..r..', bass: 'x..x..x.8...x.o.', kick: 'x..x..x...x..x..', snare: '....x..g.g..x...', hat: 'xgxgxgxgxgxgxgxg' },
    { id: 'shuffle', name: '藍調 Shuffle', meter: '4/4', steps: 16, keys: 'x..r....x..r....', bass: 'x..o8..ox..o8..o', kick: 'x.......x.......', snare: '....x.......x...', hat: 'x..gx..gx..gx..g' },
    { id: 'pedal', name: '持續音（無鼓）', meter: '4/4', steps: 16, keys: 'x---------------', bass: 'x---------------' },
  ],
};

export const UNITS = KEY_LAB.units;
export const unitById = (id) => KEY_LAB.units.find((u) => u.id === id);
export const progressionById = (id) => KEY_LAB.progressions.find((p) => p.id === id);
export const patternById = (id) => KEY_LAB.patterns.find((p) => p.id === id) || KEY_LAB.patterns[0];
