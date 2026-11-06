import { CONFIG } from '../config.js';
import { MUSIC } from '../data/music.js';
import { soundOut } from './SoundOut.js';

// 배경음악 재생기 (곡은 src/data/music.js, 크기·빠르기는 config.js music)
// 장면이 바뀌어도 이어지도록 게임 전체에 하나만 둔다: music.use(scene).play('game')
// 음은 조금 앞서(lookahead) 오디오 시계에 예약해 두어, 게임이 잠깐 느려져도 박자가 흔들리지 않는다
// 브라우저가 소리를 막은 동안(첫 터치·클릭 전, 탭이 숨겨졌을 때)은 예약을 멈췄다가 풀리면 이어서 친다

const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

function frequency(name) {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  if (!m) throw new Error(`알 수 없는 음: ${name}`);
  const midi = NOTE_INDEX[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * 2 ** ((midi - 69) / 12);
}

const tokens = (text) => text.split(/\s+/).filter((t) => t && t !== '|');

// 악기 줄 → 칸마다 시작하는 음 { freq, len(칸 수) }
function parseVoice(text) {
  const at = [];
  let last = null;
  tokens(text).forEach((t, i) => {
    if (t === '.') {
      if (last) last.len++;
    } else if (t === '-') {
      last = null;
    } else {
      last = { freq: frequency(t), len: 1 };
      at[i] = last;
    }
  });
  return { at, length: tokens(text).length };
}

function compile(name) {
  const song = MUSIC[name];
  if (!song) throw new Error(`알 수 없는 배경음악: ${name}`);
  const voices = song.voices.map((v) => ({ ...v, ...parseVoice(v.notes) }));
  const drums = song.drums ? tokens(song.drums) : [];
  const length = Math.max(drums.length, ...voices.map((v) => v.length));
  return { ...song, voices, drums, length };
}

class Music {
  constructor() {
    this.ctx = null;
    this.song = null;
    this.name = null;
    this.tempo = 1;
    this.sources = new Set();
  }

  // 장면에서 부른다. 처음 한 번만 오디오에 연결한다
  use(scene) {
    const ctx = scene.sound.context;
    if (ctx && this.ctx !== ctx) {
      this.ctx = ctx;
      this.bus = ctx.createGain();
      this.bus.gain.value = CONFIG.music.volume;
      this.bus.connect(soundOut(ctx));
      this.timer ??= setInterval(() => this.tick(), CONFIG.music.tick);
    }
    return this;
  }

  // 같은 곡이 이미 나오고 있으면 그대로 둔다 (restart 면 처음부터)
  play(name, { restart = false } = {}) {
    if (!this.ctx || (this.name === name && this.song && !restart)) return;
    this.silence();
    this.name = name;
    this.song = compile(name);
    this.step = 0;
    this.tempo = 1;
    this.nextTime = this.ctx.currentTime + CONFIG.music.startDelay;
    this.duck(false);
  }

  stop() {
    this.name = null;
    this.song = null;
    this.silence();
  }

  // 1 = 원래 빠르기
  setTempo(multiplier) {
    this.tempo = multiplier;
  }

  // 승진 카드를 고르는 동안 등 잠깐 작게
  duck(on) {
    if (!this.bus) return;
    const target = CONFIG.music.volume * (on ? CONFIG.music.duck : 1);
    this.bus.gain.setTargetAtTime(target, this.ctx.currentTime, CONFIG.music.fade);
  }

  stepLength() {
    return 60 / (this.song.bpm * this.tempo) / this.song.stepsPerBeat;
  }

  tick() {
    const ctx = this.ctx;
    if (!ctx || !this.song || ctx.state !== 'running') return;
    // 소리가 막혀 있던 사이 밀린 칸은 건너뛰고 지금부터 이어서 친다
    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + CONFIG.music.startDelay;
    while (this.song && this.nextTime < ctx.currentTime + CONFIG.music.lookahead) {
      if (this.step >= this.song.length) {
        if (!this.song.loop) {
          this.song = null;
          return;
        }
        this.step = 0;
      }
      this.playStep(this.step, this.nextTime);
      this.nextTime += this.stepLength();
      this.step++;
    }
  }

  playStep(step, time) {
    const unit = this.stepLength();
    for (const voice of this.song.voices) {
      const note = voice.at[step];
      if (note) this.tone(voice, note.freq, time, note.len * unit * voice.staccato);
    }
    const drum = this.song.drums[step];
    if (drum && drum !== '-') this.drum(drum, time);
  }

  tone(voice, freq, start, duration) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = voice.wave;
    osc.frequency.setValueAtTime(freq, start);
    const peak = voice.gain;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peak, start + 0.005);
    env.gain.exponentialRampToValueAtTime(peak * 0.4, start + duration);
    env.gain.linearRampToValueAtTime(0, start + duration + 0.03);
    osc.connect(env).connect(this.bus);
    this.track(osc, start, start + duration + 0.04);
  }

  // K 큰북(낮게 떨어지는 음), S 작은북(잡음), h 하이햇(짧고 높은 잡음)
  drum(kind, start) {
    const ctx = this.ctx;
    const d = CONFIG.music.drums[kind];
    if (!d) return;
    const env = ctx.createGain();
    env.gain.setValueAtTime(d.gain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + d.duration);
    let source;
    if (kind === 'K') {
      source = ctx.createOscillator();
      source.type = 'sine';
      source.frequency.setValueAtTime(d.from, start);
      source.frequency.exponentialRampToValueAtTime(d.to, start + d.duration);
      source.connect(env);
    } else {
      source = ctx.createBufferSource();
      source.buffer = this.noise();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = d.highpass;
      source.connect(filter).connect(env);
    }
    env.connect(this.bus);
    this.track(source, start, start + d.duration);
  }

  track(source, start, end) {
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
    source.start(start);
    source.stop(end);
  }

  // 곡을 바꿀 때 이미 예약해 둔 음을 지운다
  silence() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // 이미 끝난 음
      }
    }
    this.sources.clear();
  }

  noise() {
    if (!this.noiseBuffer) {
      const ctx = this.ctx;
      const length = Math.floor(ctx.sampleRate * 0.2);
      this.noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }
}

export const music = new Music();
