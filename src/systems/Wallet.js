import { CONFIG } from '../config.js';
import { WALLETS } from '../data/benefits.js';

// 지갑 저장 (5화): 판이 끝나도 남는 연봉·복지포인트를 이 브라우저(localStorage)에 남긴다 (Progress.js 와 같은 방식)
// - 칼퇴하면 그 판에서 주운 것을 다 가져가고, 야근이면 config benefits.keepOnOvertime 비율만 가져간다
// - earned: 지금까지 가져간 총액 (가게에서 써도 줄지 않는다. 엔딩의 "이번 시즌 모은 연봉")
// - stats: 시즌 기록 { runs: 판 수, bosses: 퇴근시킨 상사(보스·엘리트) 수 } (엔딩 장면)
// 저장이 막힌 브라우저에서도 게임은 돌아가고, 그 실행 동안만 기억한다

let memory = null;

const empty = () => Object.fromEntries(Object.keys(WALLETS).map((k) => [k, 0]));
const clean = (obj) => Object.fromEntries(Object.keys(WALLETS).map((k) => [k, Math.max(0, Math.floor(Number(obj?.[k]) || 0))]));

const cleanStats = (s) => ({ runs: Math.max(0, Math.floor(Number(s?.runs) || 0)), bosses: Math.max(0, Math.floor(Number(s?.bosses) || 0)) });

function load() {
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.benefits.storageKey));
    memory = { balance: clean(saved?.balance), earned: clean(saved?.earned), stats: cleanStats(saved?.stats) };
  } catch {
    memory = { balance: empty(), earned: empty(), stats: cleanStats(null) };
  }
  return memory;
}

function save() {
  try {
    localStorage.setItem(CONFIG.benefits.storageKey, JSON.stringify(memory));
  } catch {
    // 저장소를 못 쓰면 이번 실행 동안만 기억한다
  }
}

export const wallet = {
  // 지금 쓸 수 있는 돈 { salary, welfare }
  balance() {
    return { ...load().balance };
  },

  earned() {
    return { ...load().earned };
  },

  stats() {
    return { ...load().stats };
  },

  // 판이 끝날 때 한 번. run: 이번 판에 주운 것 { salary, welfare }, bosses: 이번 판에 퇴근시킨 상사 수. 실제로 가져간 값을 돌려준다
  settle(run, clear, bosses = 0) {
    const rate = clear ? 1 : CONFIG.benefits.keepOnOvertime;
    const data = load();
    const kept = {};
    for (const k of Object.keys(WALLETS)) {
      kept[k] = Math.floor((run[k] ?? 0) * rate);
      data.balance[k] += kept[k];
      data.earned[k] += kept[k];
    }
    data.stats.runs++;
    data.stats.bosses += bosses;
    save();
    return kept;
  },

  // 가게에서 쓰기 (모자라면 false)
  spend(key, amount) {
    const data = load();
    if (data.balance[key] < amount) return false;
    data.balance[key] -= amount;
    save();
    return true;
  },
};
