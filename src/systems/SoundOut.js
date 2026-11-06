import { CONFIG } from '../config.js';

// 효과음과 배경음악이 함께 지나가는 마지막 출구. 여기서 소리 켜기/끄기를 한 번에 처리한다
// 끈 상태는 이 브라우저에 기억한다 (저장이 막힌 환경이면 그냥 켠 상태로 시작)

let out = null;
let muted = load();

function load() {
  try {
    return localStorage.getItem(CONFIG.sound.muteStorageKey) === '1';
  } catch {
    return false;
  }
}

function save() {
  try {
    localStorage.setItem(CONFIG.sound.muteStorageKey, muted ? '1' : '0');
  } catch {
    // 저장이 막혀 있어도 이번 접속 동안은 그대로 동작한다
  }
}

// 모든 소리는 ctx.destination 대신 여기에 연결한다
export function soundOut(ctx) {
  if (!out || out.context !== ctx) {
    out = ctx.createGain();
    out.gain.value = muted ? 0 : 1;
    out.connect(ctx.destination);
  }
  return out;
}

export const isMuted = () => muted;

export function setMuted(on) {
  muted = on;
  save();
  if (out) out.gain.setTargetAtTime(muted ? 0 : 1, out.context.currentTime, 0.02);
}
