import { CONFIG } from '../config.js';
import { SHOPS, SHOP_ITEMS } from '../data/shop.js';
import { WEAPONS } from '../data/weapons.js';
import { wallet } from './Wallet.js';

// 가게에서 산 것 저장 (5화). 이 브라우저(localStorage)에 남긴다 (Progress.js 와 같은 방식)
// - bought: 항목별 산 단계 수 (영구 항목), pending: 다음 판에 쓸 일회용 항목
// - starter: 고른 시작 무기 id (사직서를 사면 고를 수 있다)
// 판을 시작할 때 startRun() 이 효과를 모아 돌려주고 일회용은 비운다

let memory = null;

function load() {
  if (memory) return memory;
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(CONFIG.shop.storageKey));
  } catch {
    saved = null;
  }
  const bought = {};
  const pending = {};
  for (const item of SHOP_ITEMS) {
    const n = Math.floor(Number(saved?.bought?.[item.id]) || 0);
    if (!item.consumable) bought[item.id] = Math.max(0, Math.min(item.prices.length, n));
    else if (saved?.pending?.[item.id]) pending[item.id] = true;
  }
  memory = { bought, pending, starter: saved?.starter ?? null };
  if (!shop.starterOptions().some((w) => w.id === memory.starter)) memory.starter = shop.starterOptions()[0].id;
  return memory;
}

function save() {
  try {
    localStorage.setItem(CONFIG.shop.storageKey, JSON.stringify(memory));
  } catch {
    // 저장소를 못 쓰면 이번 실행 동안만 기억한다
  }
}

export const shop = {
  // 저장소를 다시 읽는다 (자동 시험이 강화 단계를 바꿔 끼울 때)
  reload() {
    memory = null;
  },

  items(shopId) {
    return SHOP_ITEMS.filter((i) => i.shop === shopId);
  },

  // 영구 항목은 산 단계 수, 일회용은 담아 뒀으면 1
  level(item) {
    const data = load();
    return item.consumable ? (data.pending[item.id] ? 1 : 0) : data.bought[item.id];
  },

  // 다음에 살 값 (더 못 사면 null)
  price(item) {
    const n = this.level(item);
    return n < item.prices.length ? item.prices[n] : null;
  },

  // 'ok' | 'max' | 'poor'
  buy(item) {
    const price = this.price(item);
    if (price === null) return 'max';
    if (!wallet.spend(SHOPS[item.shop].wallet, price)) return 'poor';
    const data = load();
    if (item.consumable) data.pending[item.id] = true;
    else data.bought[item.id]++;
    save();
    return 'ok';
  },

  // 시작 무기로 고를 수 있는 무기: 처음부터 들던 무기 + 가게에서 연 무기
  starterOptions() {
    const unlocked = new Set(SHOP_ITEMS.filter((i) => i.unlockWeapon && memory?.bought[i.id] > 0).map((i) => i.unlockWeapon));
    return WEAPONS.filter((w) => w.starter || unlocked.has(w.id));
  },

  starter() {
    load();
    return WEAPONS.find((w) => w.id === memory.starter);
  },

  setStarter(id) {
    load();
    if (!this.starterOptions().some((w) => w.id === id)) return;
    memory.starter = id;
    save();
  },

  // 산 효과 합계 (영구 + 담아 둔 일회용)
  effects() {
    const data = load();
    const total = { starterDamage: 0, maxMental: 0, startMental: 0, leave: 0, bomb: 0 };
    for (const item of SHOP_ITEMS) {
      const n = this.level(item);
      for (const [k, v] of Object.entries(item.effect ?? {})) total[k] = (total[k] ?? 0) + v * n;
    }
    total.starter = data.starter;
    return total;
  },

  // 시작 무기 데미지 배율 (가게 화면의 "한 발" 표시와 게임이 같은 값을 쓴다)
  starterMultiplier() {
    return 1 + this.effects().starterDamage;
  },

  // 판을 시작할 때 한 번: 효과를 돌려주고 일회용은 쓴 것으로 비운다
  startRun() {
    const effects = this.effects();
    memory.pending = {};
    save();
    return effects;
  },
};
