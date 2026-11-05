import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { WEAPONS, maxLevelOf, levelDesc } from '../data/weapons.js';
import { UPGRADES } from '../data/upgrades.js';

// 승진(레벨업): 결재 서류가 승진 막대를 채우면 게임을 멈추고 카드 3장(LevelUp 장면)을 보여 준다
// 카드는 새 무기와 가진 무기 강화가 섞여 나온다. 무기 칸이 다 차면 강화만 나오고,
// 고를 것이 하나도 없으면 upgrades.js 의 fallback 카드(멘탈 회복 등)가 나온다
//
// 장면 이벤트
//   'xp-changed'  { xp, need, level, rank, nextRank }
//   'promoted'    { level, rank }
export default class Promotion {
  constructor(scene, combat, player) {
    this.scene = scene;
    this.combat = combat;
    this.player = player;
    this.level = 1;
    this.xp = 0;
    this.need = Promotion.needFor(1);
    this.pending = 0;
    this.choosing = false;
    scene.events.on('xp-gained', ({ amount }) => this.gain(amount));
  }

  // level 에서 다음 직급으로 가는 데 필요한 서류 수
  static needFor(level) {
    const { firstNeed, growth } = CONFIG.progression;
    return Math.round(firstNeed * growth ** (level - 1));
  }

  static rankName(level) {
    const { ranks } = CONFIG.progression;
    return level <= ranks.length ? ranks[level - 1] : `${ranks[ranks.length - 1]} ${level - ranks.length + 1}년차`;
  }

  get rank() {
    return Promotion.rankName(this.level);
  }

  gain(amount) {
    this.xp += amount;
    while (this.xp >= this.need) {
      this.xp -= this.need;
      this.level++;
      this.need = Promotion.needFor(this.level);
      this.pending++;
    }
    this.emitChanged();
    if (this.pending && !this.choosing) this.open();
  }

  emitChanged() {
    this.scene.events.emit('xp-changed', {
      xp: this.xp,
      need: this.need,
      level: this.level,
      rank: this.rank,
      nextRank: Promotion.rankName(this.level + 1),
    });
  }

  // 아직 고르지 않은 승진 중 가장 앞의 것 (여러 번 한꺼번에 승진하면 차례로 고른다)
  open() {
    const level = this.level - this.pending + 1;
    this.choosing = true;
    this.scene.scene.pause();
    this.scene.scene.launch('LevelUp', {
      fromRank: Promotion.rankName(level - 1),
      toRank: Promotion.rankName(level),
      choices: this.choices(),
      onPick: (choice) => this.pick(choice),
    });
    this.scene.events.emit('promoted', { level, rank: Promotion.rankName(level) });
  }

  choices() {
    const slots = this.combat.weapons;
    const owned = new Set(slots.map((s) => s.def.id));
    const upgrades = slots
      .filter((s) => s.level < maxLevelOf(s.def))
      .map((s) => ({ type: 'upgrade', weapon: s.def, level: s.level + 1, desc: levelDesc(s.def, s.level + 1) }));
    const fresh = slots.length < CONFIG.weapons.slots
      ? WEAPONS.filter((w) => !owned.has(w.id)).map((w) => ({ type: 'new', weapon: w, level: 1, desc: w.description }))
      : [];
    const picks = Phaser.Utils.Array.Shuffle([...upgrades, ...fresh]).slice(0, CONFIG.levelUp.cardCount);
    if (picks.length) return picks;
    return UPGRADES.filter((u) => u.fallback).map((u) => ({ type: 'upgrade-item', item: u, desc: u.description }));
  }

  pick(choice) {
    if (choice.type === 'new') this.combat.addWeapon(choice.weapon);
    else if (choice.type === 'upgrade') this.combat.upgradeWeapon(choice.weapon.id);
    else if (choice.type === 'upgrade-item') this.applyItem(choice.item);

    this.pending--;
    this.choosing = false;
    if (this.pending) {
      this.open();
      return;
    }
    this.scene.scene.resume();
  }

  applyItem(item) {
    const { heal } = item.effect ?? {};
    if (heal) this.player.heal(heal);
  }
}
