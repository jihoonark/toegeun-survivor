import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { WEAPONS, maxLevelOf, levelDesc } from '../data/weapons.js';
import { UPGRADES } from '../data/upgrades.js';

// 레벨업: 결재 서류가 막대를 채우면 호봉이 오르고(호봉 UP!), 호봉이 다 차면 직급이 오른다(승진!)
// 그때마다 게임을 멈추고 카드 3장(LevelUp 장면)을 보여 준다
// 카드는 새 무기와 가진 무기 강화가 섞여 나온다. 무기 칸이 다 차면 강화만 나오고,
// 고를 것이 하나도 없거나 멘탈이 많이 깎였으면 upgrades.js 의 fallback 카드(멘탈 회복 등)가 나온다
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

  // level → { rank: '사원', step: 3 } (사원 3호봉)
  static rankOf(level) {
    const { ranks, stepsPerRank, maxRankInRun } = CONFIG.progression;
    const index = Math.min(Math.floor((level - 1) / stepsPerRank), ranks.indexOf(maxRankInRun));
    return { rank: ranks[index], step: level - index * stepsPerRank };
  }

  static rankName(level) {
    const { rank, step } = Promotion.rankOf(level);
    return `${rank} ${step}호봉`;
  }

  // 다음 레벨에서 직급이 바뀌면 새 직급 이름, 아니면 "N호봉"
  static nextLabel(level) {
    const now = Promotion.rankOf(level);
    const next = Promotion.rankOf(level + 1);
    return next.rank !== now.rank ? next.rank : `${next.step}호봉`;
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
      nextRank: Promotion.nextLabel(this.level),
    });
  }

  // 아직 고르지 않은 승진 중 가장 앞의 것 (여러 번 한꺼번에 승진하면 차례로 고른다)
  open() {
    const level = this.level - this.pending + 1;
    this.choosing = true;
    this.scene.scene.pause();
    const promoted = Promotion.rankOf(level).rank !== Promotion.rankOf(level - 1).rank;
    this.scene.scene.launch('LevelUp', {
      promoted,
      fromRank: promoted ? Promotion.rankOf(level - 1).rank : Promotion.rankName(level - 1),
      toRank: promoted ? Promotion.rankOf(level).rank : Promotion.rankName(level),
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
    const welfare = UPGRADES.filter((u) => u.fallback).map((u) => ({ type: 'upgrade-item', item: u, desc: u.description }));
    const picks = Phaser.Utils.Array.Shuffle([...upgrades, ...fresh]).slice(0, CONFIG.levelUp.cardCount);
    if (!picks.length) return welfare;
    // 멘탈이 많이 깎였으면 마지막 카드 자리에 복지 카드를 넣는다
    const low = this.player.mental <= CONFIG.player.maxMental * CONFIG.progression.welfareBelow;
    if (low && welfare.length) picks.splice(Math.min(picks.length, CONFIG.levelUp.cardCount - 1), 1, welfare[0]);
    return picks;
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
