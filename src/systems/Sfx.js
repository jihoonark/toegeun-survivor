import { CONFIG } from '../config.js';

// 코드로 만든 간단한 효과음 (GAME_SPEC.md 6장). 나중에 녹음한 소리로 바꿀 수 있다
// 음 하나 = { wave, from, to, duration(초), gain, delay(초) }. wave 가 'noise' 면 잡음
const SOUNDS = {
  hit: [{ wave: 'square', from: 660, to: 330, duration: 0.05, gain: 0.35 }],
  kill: [
    { wave: 'noise', duration: 0.12, gain: 0.5 },
    { wave: 'triangle', from: 440, to: 110, duration: 0.14, gain: 0.5 },
  ],
  levelUp: [
    { wave: 'square', from: 523, to: 523, duration: 0.08, gain: 0.3 },
    { wave: 'square', from: 659, to: 659, duration: 0.08, gain: 0.3, delay: 0.08 },
    { wave: 'square', from: 784, to: 784, duration: 0.16, gain: 0.3, delay: 0.16 },
  ],
  hurt: [{ wave: 'sawtooth', from: 240, to: 80, duration: 0.2, gain: 0.45 }],
};

export default class Sfx {
  constructor(scene) {
    // Phaser가 첫 터치·클릭에서 열어 둔 오디오를 같이 쓴다 (휴대폰은 사용자 입력 전에는 소리가 막혀 있다)
    this.ctx = scene.sound.context ?? null;
    this.lastPlayed = {};
  }

  play(name) {
    const ctx = this.ctx;
    const notes = SOUNDS[name];
    if (!ctx || ctx.state !== 'running' || !notes) return;

    const now = ctx.currentTime;
    const last = this.lastPlayed[name] ?? -Infinity;
    if ((now - last) * 1000 < CONFIG.sound.minInterval) return;
    this.lastPlayed[name] = now;

    for (const note of notes) this.playNote(note, now + (note.delay ?? 0));
  }

  playNote(note, start) {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    const peak = note.gain * CONFIG.sound.volume;
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    gain.connect(ctx.destination);

    let source;
    if (note.wave === 'noise') {
      source = ctx.createBufferSource();
      source.buffer = this.noiseBuffer();
    } else {
      source = ctx.createOscillator();
      source.type = note.wave;
      source.frequency.setValueAtTime(note.from, start);
      source.frequency.exponentialRampToValueAtTime(note.to, start + note.duration);
    }
    source.connect(gain);
    source.start(start);
    source.stop(start + note.duration);
  }

  noiseBuffer() {
    if (!this.noise) {
      const ctx = this.ctx;
      const length = Math.floor(ctx.sampleRate * 0.2);
      this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }
}
