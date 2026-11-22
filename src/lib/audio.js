// 音訊引擎：Tone.js 負責時脈、合成音、效果；smplr 負責鋼琴與貝斯取樣。
// 匯流排：keys（鍵盤：鋼琴或 pad）、pad（配樂鋪底）、bass、drums、click（節拍器）、drone
import { useSyncExternalStore } from 'react';
import * as Tone from 'tone';
import { Soundfont, CacheStorage } from 'smplr';
import { getPrefs, setPrefs, subscribe as subscribePrefs } from './store.js';
import { midiOf } from './theory.js';

const BUSES = ['keys', 'pad', 'bass', 'drums', 'click', 'drone'];
const E = { ready: false };
let initPromise = null;

function storage() {
  try {
    return new CacheStorage('key-lab');
  } catch {
    return undefined;
  }
}

function build() {
  const ctx = Tone.getContext().rawContext;
  E.ctx = ctx;
  E.master = new Tone.Volume(0).toDestination();
  E.limiter = new Tone.Limiter(-1);
  E.master.disconnect();
  E.master.chain(E.limiter, Tone.getDestination());
  E.bus = {};
  for (const b of BUSES) E.bus[b] = new Tone.Volume(0).connect(E.master);

  // 共用殘響
  E.room = new Tone.Reverb({ decay: 2.6, wet: 0.22 }).connect(E.bus.keys);
  E.hall = new Tone.Reverb({ decay: 8, wet: 0.6 });

  // 鋼琴（取樣）→ keys
  E.pianoIn = ctx.createGain();
  Tone.connect(E.pianoIn, E.room);
  // 取樣還沒載好或失敗時的替代音色
  E.pianoFallback = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 24,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.004, decay: 1.4, sustain: 0.12, release: 1.2 },
    volume: -10,
  }).connect(E.room);

  // 合成器 pad：慢起音、長殘響 → keys
  E.padFilter = new Tone.Filter(2200, 'lowpass');
  E.padChorus = new Tone.Chorus({ frequency: 0.6, delayTime: 4, depth: 0.5, wet: 0.4 }).start();
  E.padSynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 24,
    oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
    envelope: { attack: 0.7, decay: 0.6, sustain: 0.8, release: 2.8 },
    volume: -20,
  });
  E.padSynth.chain(E.padFilter, E.padChorus, E.hall);
  E.hall.connect(E.bus.keys);

  // 配樂鋪底（和 keys 分開調音量）
  E.bedVerb = new Tone.Reverb({ decay: 5, wet: 0.5 }).connect(E.bus.pad);
  E.bed = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 16,
    oscillator: { type: 'fatsine', count: 3, spread: 18 },
    envelope: { attack: 0.5, decay: 0.4, sustain: 0.85, release: 1.6 },
    volume: -16,
  }).connect(E.bedVerb);

  // 貝斯
  E.bassIn = ctx.createGain();
  Tone.connect(E.bassIn, E.bus.bass);
  E.bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    filter: { Q: 1, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.25 },
    filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.3, baseFrequency: 180, octaves: 2.5 },
    volume: -6,
  }).connect(E.bus.bass);

  // 鼓（合成）
  E.kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 6, envelope: { attack: 0.001, decay: 0.32, sustain: 0 }, volume: -2 }).connect(E.bus.drums);
  E.snareF = new Tone.Filter(1400, 'highpass').connect(E.bus.drums);
  E.snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 }, volume: -10 }).connect(E.snareF);
  E.snareBody = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.1, sustain: 0 }, volume: -14 }).connect(E.bus.drums);
  E.hatF = new Tone.Filter(7500, 'highpass').connect(E.bus.drums);
  E.hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 }, volume: -18 }).connect(E.hatF);
  E.ohat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.28, sustain: 0 }, volume: -20 }).connect(E.hatF);
  E.rim = new Tone.MembraneSynth({ pitchDecay: 0.005, octaves: 1, envelope: { attack: 0.001, decay: 0.04, sustain: 0 }, volume: -12 }).connect(E.bus.drums);

  // 節拍器
  E.click = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }, volume: -4 }).connect(E.bus.click);

  // Drone
  E.droneVerb = new Tone.Reverb({ decay: 9, wet: 0.5 }).connect(E.bus.drone);
  E.droneFilter = new Tone.Filter(900, 'lowpass').connect(E.droneVerb);
  E.droneLfo = new Tone.LFO(0.07, 500, 1300).connect(E.droneFilter.frequency).start();
  E.droneGain = new Tone.Gain(0).connect(E.droneFilter);
  E.droneOscs = [];

  applyMix();
  subscribePrefs(applyMix);
  E.ready = true;
}

/** 第一次互動時呼叫（瀏覽器規定要使用者手勢才能出聲） */
export function ensureAudio() {
  if (!initPromise) {
    initPromise = (async () => {
      await Tone.start();
      build();
      loadPiano();
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  } else if (Tone.getContext().state !== 'running') {
    Tone.start();
  }
  return initPromise;
}

const listeners = new Set();
/** React hook：音訊狀態（配樂、節拍器、Drone、取樣載入）改變時重繪 */
export function useAudio() {
  useSyncExternalStore(onAudio, getAudioVersion, getAudioVersion);
  return { transport: S, drone: droneState, status };
}
const status = { piano: 'idle', bass: 'idle' };
export const getAudioStatus = () => status;
function setStatus(k, v) {
  status[k] = v;
  emit();
}

function loadPiano() {
  if (E.piano || status.piano === 'loading') return;
  setStatus('piano', 'loading');
  try {
    const inst = Soundfont(E.ctx, { instrument: 'acoustic_grand_piano', destination: E.pianoIn, storage: storage(), volume: 100 });
    inst.ready
      .then(() => {
        E.piano = inst;
        setStatus('piano', 'ready');
      })
      .catch(() => setStatus('piano', 'failed'));
  } catch {
    setStatus('piano', 'failed');
  }
}
function loadBass() {
  if (E.bassSample || status.bass === 'loading') return;
  setStatus('bass', 'loading');
  try {
    const inst = Soundfont(E.ctx, { instrument: 'electric_bass_finger', destination: E.bassIn, storage: storage(), volume: 105 });
    inst.ready
      .then(() => {
        E.bassSample = inst;
        setStatus('bass', 'ready');
      })
      .catch(() => setStatus('bass', 'failed'));
  } catch {
    setStatus('bass', 'failed');
  }
}

function applyMix() {
  if (!E.master) return;
  const p = getPrefs();
  E.master.volume.rampTo(p.vol.master ?? 0, 0.05);
  for (const b of BUSES) {
    const v = E.bus[b];
    v.mute = !!p.mute[b];
    v.volume.rampTo(p.vol[b] ?? 0, 0.05);
  }
}

// ---------- 彈鍵盤 ----------

const freq = (m) => Tone.Frequency(m, 'midi').toFrequency();

/**
 * 彈一組音。notes：midi 或音名陣列。opts: { time（秒，AudioContext 時間）, duration（秒）, velocity 0–127 }
 */
export function playNotes(notes, opts = {}) {
  if (!E.ready) {
    ensureAudio().then(() => playNotes(notes, opts));
    return;
  }
  const list = (Array.isArray(notes) ? notes : [notes]).map(midiOf).filter((m) => m != null);
  if (!list.length) return;
  const voice = getPrefs().voice;
  const time = opts.time ?? Tone.now();
  const dur = opts.duration ?? (voice === 'pad' ? 2.4 : 1.6);
  const vel = opts.velocity ?? 80;
  const strum = opts.strum ?? 0;
  list.forEach((m, i) => {
    const t = time + i * strum;
    if (voice === 'pad') {
      E.padSynth.triggerAttackRelease(freq(m), dur, t, vel / 127);
    } else if (E.piano) {
      E.piano.start({ note: m, time: t, duration: dur, velocity: vel });
    } else {
      E.pianoFallback.triggerAttackRelease(freq(m), dur, t, vel / 127);
    }
  });
}
export const playNote = (m, opts) => playNotes([m], opts);

/** 停掉鍵盤上正在響的音 */
export function stopKeys() {
  if (!E.ready) return;
  E.piano?.stop();
  E.padSynth.releaseAll();
  E.pianoFallback.releaseAll();
}

// ---------- 譜例播放（不用 Transport，和配樂互不干擾） ----------

let seq = null;
/**
 * 依序播放每個和弦（一個和弦一小節）。
 * items: [{ left: [midi], right: [midi] }]；opts: { bpm, beats, loop, onStep(i), onEnd(), arpeggio }
 */
export async function playSequence(items, opts = {}) {
  await ensureAudio();
  stopSequence();
  const bpm = opts.bpm || 72;
  const beats = opts.beats || 4;
  const beat = 60 / bpm;
  const bar = beat * beats;
  const token = {};
  seq = token;
  let i = 0;
  const tick = () => {
    if (seq !== token) return;
    if (i >= items.length) {
      if (opts.loop) i = 0;
      else {
        seq = null;
        opts.onEnd?.();
        return;
      }
    }
    const it = items[i];
    const t = Tone.now() + 0.03;
    if (opts.arpeggio) {
      const all = [...(it.left || []), ...(it.right || [])];
      all.forEach((m, k) => playNotes([m], { time: t + k * (bar / Math.max(all.length, 4)), duration: bar - k * (bar / Math.max(all.length, 4)) }));
    } else {
      playNotes([...(it.left || []), ...(it.right || [])], { time: t, duration: bar * 0.96 });
    }
    opts.onStep?.(i);
    i += 1;
    token.timer = setTimeout(tick, bar * 1000);
  };
  tick();
}
export function stopSequence() {
  if (seq?.timer) clearTimeout(seq.timer);
  seq = null;
  stopKeys();
}

// ---------- Transport：配樂與節拍器 ----------

const S = {
  playing: false, // 配樂播放中
  metro: false, // 節拍器開著
  bar: 0,
  step: 0,
  beat: 0,
  progId: null,
  name: '',
};
export const getTransportState = () => S;
let version = 0;
export const getAudioVersion = () => version;
function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}
export function onAudio(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let current = null; // { bars: [[voicing...]], pattern, id, name }
let repeatId = null;
let gStep = 0;

export function setBpm(bpm) {
  bpm = Math.max(30, Math.min(240, Math.round(bpm)));
  setPrefs({ bpm });
  Tone.getTransport().bpm.rampTo(bpm, 0.05);
}

const METERS = {
  '4/4': { steps: 16, beat: 4, accent: [0] },
  '3/4': { steps: 12, beat: 4, accent: [0] },
  '6/8': { steps: 12, beat: 2, accent: [0, 6] },
};

function meterNow() {
  if (S.playing && current) return { steps: current.pattern.steps, beat: current.pattern.beat || 4, accent: current.pattern.accent || [0] };
  return METERS[getPrefs().meter] || METERS['4/4'];
}

function startTransport() {
  const tr = Tone.getTransport();
  tr.bpm.value = getPrefs().bpm;
  if (repeatId === null) repeatId = tr.scheduleRepeat(onStep, '16n', 0);
  if (tr.state !== 'started') {
    gStep = 0;
    tr.start('+0.06');
  }
}
function maybeStopTransport() {
  if (S.playing || S.metro) return;
  const tr = Tone.getTransport();
  tr.stop();
  if (repeatId !== null) tr.clear(repeatId);
  repeatId = null;
}

const hit = (str, i) => (str ? str[i % str.length] : '.');

function onStep(time) {
  const m = meterNow();
  const s = gStep % m.steps;
  const barCount = Math.floor(gStep / m.steps);
  const p = current?.pattern;

  if (S.metro && s % m.beat === 0) {
    const accent = m.accent.includes(s);
    E.click.triggerAttackRelease(accent ? 1760 : 1175, 0.03, time, accent ? 1 : 0.6);
  }

  if (S.playing && current) {
    const barIdx = barCount % current.bars.length;
    const chords = current.bars[barIdx];
    const per = m.steps / chords.length;
    const ci = Math.min(chords.length - 1, Math.floor(s / per));
    const v = chords[ci];
    const chordStart = s % per === 0;
    const stepDur = Tone.Time('16n').toSeconds();

    if (v && v.right?.length) {
      // 鋪底：每個和弦開始時鋪一次
      if (chordStart) {
        const bedNotes = [...v.right.map((x) => x - 12), v.left[0] + 12].filter((x) => x > 36);
        E.bed.triggerAttackRelease(bedNotes.map(freq), per * stepDur * 0.98, time, 0.5);
      }
      // 鍵盤示範：依節奏型的 keys 欄位
      const k = hit(p.keys, s);
      if (k !== '.' && k !== '-') {
        let len = 1;
        while (len < m.steps - s && hit(p.keys, s + len) === '-') len += 1;
        if (len === 1 && k === 'x') len = Math.max(2, nextHitDistance(p.keys, s, m.steps));
        let notes;
        let dur = len * stepDur * 0.95;
        if (/\d/.test(k)) {
          // 分解：0 是左手，1 起是右手由低到高；超過就繞回去
          const all = [v.left[0], ...[...v.right].sort((a, b) => a - b)];
          notes = [all[Number(k) % all.length]];
          dur = Math.max(dur, (m.steps - s) * stepDur * 0.95);
        } else notes = k === 'r' ? v.right : k === 'l' ? v.left : [...v.left, ...v.right];
        if (!getPrefs().mute.keys) playNotes(notes, { time, duration: dur, velocity: k === 'x' && m.accent.includes(s) ? 88 : 74 });
      }
      // 貝斯
      const b = hit(p.bass, s);
      if (b !== '.' && b !== '-') {
        const root = v.left[0];
        const note = b === 'o' ? root + 7 : b === '8' ? root + 12 : root;
        let len = 1;
        while (len < m.steps - s && hit(p.bass, s + len) === '-') len += 1;
        const dur = Math.max(len, 2) * stepDur * 0.9;
        const bm = note - 12 >= 28 ? note - 12 : note;
        if (E.bassSample) E.bassSample.start({ note: bm, time, duration: dur, velocity: 90 });
        else E.bassSynth.triggerAttackRelease(freq(bm), dur, time);
      }
    }
    // 鼓
    if (p.kick && hit(p.kick, s) !== '.') E.kick.triggerAttackRelease('C1', '8n', time, hit(p.kick, s) === 'X' ? 1 : 0.8);
    if (p.snare && hit(p.snare, s) !== '.') {
      const g = hit(p.snare, s) === 'g' ? 0.25 : 0.9;
      E.snare.triggerAttackRelease('16n', time, g);
      E.snareBody.triggerAttackRelease('G2', '32n', time, g);
    }
    if (p.hat) {
      const h = hit(p.hat, s);
      if (h === 'x') E.hat.triggerAttackRelease('32n', time, 0.7);
      else if (h === 'o') E.ohat.triggerAttackRelease('8n', time, 0.6);
      else if (h === 'g') E.hat.triggerAttackRelease('32n', time, 0.3);
    }
    if (p.rim && hit(p.rim, s) !== '.') E.rim.triggerAttackRelease('E5', '32n', time, 0.7);

    Tone.getDraw().schedule(() => {
      S.bar = barIdx;
      S.chord = ci;
      S.step = s;
      S.beat = Math.floor(s / m.beat);
      emit();
    }, time);
  } else if (S.metro && s % m.beat === 0) {
    Tone.getDraw().schedule(() => {
      S.beat = Math.floor(s / m.beat);
      emit();
    }, time);
  }
  gStep += 1;
}
function nextHitDistance(str, s, steps) {
  for (let d = 1; d < steps - s; d += 1) if (hit(str, s + d) !== '.' && hit(str, s + d) !== '-') return d;
  return steps - s;
}

/**
 * 播放配樂。bars：每小節一個陣列，裡面是該小節的排法（[{left,right,name}]，一小節可放兩個和弦）
 */
export async function startBacking({ id, name, bars, pattern, bpm }) {
  await ensureAudio();
  loadBass();
  current = { id, name, bars, pattern };
  if (bpm) setBpm(bpm);
  S.progId = id;
  S.name = name;
  S.bar = 0;
  S.chord = 0;
  const wasRunning = Tone.getTransport().state === 'started';
  S.playing = true;
  if (wasRunning) {
    // 從下一個小節頭開始
    const m = meterNow();
    gStep = Math.ceil(gStep / m.steps) * m.steps;
  }
  startTransport();
  emit();
}
/** 換節奏型或更新排法，不中斷播放 */
export function updateBacking(patch) {
  if (current) Object.assign(current, patch);
}
export function stopBacking() {
  S.playing = false;
  E.bed?.releaseAll();
  stopKeys();
  maybeStopTransport();
  emit();
}
export async function toggleMetronome(on = !S.metro) {
  await ensureAudio();
  S.metro = on;
  if (on) startTransport();
  else maybeStopTransport();
  emit();
}

// ---------- Drone ----------

const droneState = { on: false, root: null, fifth: false };
export const getDroneState = () => droneState;

export async function startDrone(rootPc, fifth = true) {
  await ensureAudio();
  const base = Tone.Frequency(`${rootPc}2`).toMidi();
  const r = base < 38 ? base + 12 : base; // 根音落在 D2–C♯3 之間
  const notes = [r - 12, r, r + 12];
  if (fifth) notes.push(r + 7);
  const now = Tone.now();
  // 交叉淡入：舊的淡出
  const old = E.droneOscs;
  E.droneOscs = notes.map((m, i) => {
    const osc = new Tone.FatOscillator({ frequency: freq(m), type: i === 0 ? 'sine' : 'sawtooth', count: i === 0 ? 1 : 3, spread: 14 });
    const g = new Tone.Gain(0).connect(E.droneGain);
    osc.connect(g);
    osc.start(now);
    g.gain.rampTo(i === 0 ? 0.5 : i === 3 ? 0.14 : 0.2, 1.2, now);
    return { osc, g };
  });
  E.droneGain.gain.rampTo(0.5, 0.8, now);
  fadeOut(old, 1.2);
  Object.assign(droneState, { on: true, root: rootPc, fifth });
  emit();
}
function fadeOut(list, secs) {
  const now = Tone.now();
  list.forEach(({ osc, g }) => {
    g.gain.cancelScheduledValues(now);
    g.gain.rampTo(0, secs, now);
    setTimeout(() => {
      osc.stop();
      osc.dispose();
      g.dispose();
    }, secs * 1000 + 200);
  });
}
export function stopDrone() {
  if (!E.ready) return;
  fadeOut(E.droneOscs, 1.5);
  E.droneOscs = [];
  droneState.on = false;
  emit();
}

/** 換音色時預先載入 */
export function preloadVoice() {
  if (E.ready) loadPiano();
}
