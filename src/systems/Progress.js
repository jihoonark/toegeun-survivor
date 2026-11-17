import { CONFIG } from '../config.js';
import { FLOORS } from '../data/floors.js';

// 진행 상황 저장 (GAME_SPEC.md 12장 "판 구조"): 클리어한 층 번호를 이 브라우저(localStorage)에 남긴다
// 층 목록(FLOORS) 첫 층은 처음부터 열려 있고, 바로 앞 층을 클리어하면 다음 층이 열린다
// 저장이 막힌 브라우저(사생활 보호 모드 등)에서도 게임은 돌아가고, 그 판 동안만 기억한다

let memory = [];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.progress.storageKey));
    if (Array.isArray(saved?.cleared)) memory = saved.cleared.filter((id) => typeof id === 'number');
  } catch {
    // 저장소를 못 쓰면 메모리 값 그대로
  }
  return memory;
}

function save(cleared) {
  memory = cleared;
  try {
    localStorage.setItem(CONFIG.progress.storageKey, JSON.stringify({ cleared }));
  } catch {
    // 저장소를 못 쓰면 이번 실행 동안만 기억한다
  }
}

const indexOf = (id) => FLOORS.findIndex((f) => f.id === id);

export const progress = {
  isCleared(id) {
    return load().includes(id);
  },

  isOpen(id) {
    const i = indexOf(id);
    if (i < 0) return false;
    return i === 0 || load().includes(FLOORS[i - 1].id);
  },

  // 이 층을 열려면 클리어해야 하는 층 이름 ("15층")
  previousName(id) {
    return FLOORS[indexOf(id) - 1]?.name ?? '';
  },

  // 다음 층 (없으면 null)
  next(id) {
    return FLOORS[indexOf(id) + 1]?.id ?? null;
  },

  // 엘리베이터에서 처음 골라 둘 층: 열린 층 중 아직 클리어하지 않은 첫 층 (다 깼으면 마지막 층)
  suggested() {
    const open = FLOORS.filter((f) => this.isOpen(f.id));
    return (open.find((f) => !this.isCleared(f.id)) ?? open[open.length - 1]).id;
  },

  // 클리어 기록. 이번에 새로 열린 층 번호를 돌려준다 (없으면 null)
  markCleared(id) {
    const cleared = load();
    const next = this.next(id);
    const newlyOpened = next !== null && !this.isOpen(next) ? next : null;
    if (!cleared.includes(id)) save([...cleared, id]);
    return newlyOpened;
  },
};
