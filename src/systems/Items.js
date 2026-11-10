import { CONFIG } from '../config.js';

// 아이템 칸 (무기 칸 아래 4칸). 아이템은 공격하지 않고 주인공 능력치를 올린다
// 효과는 레벨마다 쌓인다 (자양강장제 Lv2 = 이동 속도 +20%)
//
// 장면 이벤트
//   'item-added'    { item }          새 아이템을 칸에 넣었을 때 (HUD 아이템 칸, 시청자 이름 알림)
//   'item-upgraded' { item, level }   아이템 레벨이 올랐을 때
export default class Items {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.slots = []; // { def, level }
  }

  static maxLevelOf(def) {
    return def.maxLevel ?? CONFIG.items.maxLevel;
  }

  has(id) {
    return this.slots.some((s) => s.def.id === id);
  }

  add(def) {
    if (this.has(def.id) || this.slots.length >= CONFIG.items.slots) return;
    this.slots.push({ def, level: 1 });
    this.applyOnce(def);
    this.scene.events.emit('item-added', { item: def });
  }

  upgrade(id) {
    const slot = this.slots.find((s) => s.def.id === id);
    if (!slot || slot.level >= Items.maxLevelOf(slot.def)) return;
    slot.level++;
    this.applyOnce(slot.def);
    this.scene.events.emit('item-upgraded', { item: slot.def, level: slot.level });
  }

  // 칸에 넣지 않는 일회용 카드 (탕비실 커피믹스)
  use(def) {
    this.applyOnce(def);
  }

  // 한 레벨만큼 효과를 더한다
  applyOnce(def) {
    const e = def.effect ?? {};
    const p = this.player;
    if (e.moveSpeed) p.speedMultiplier += e.moveSpeed;
    if (e.maxMental) p.raiseMaxMental(e.maxMental);
    if (e.heal) p.heal(e.heal);
  }
}
