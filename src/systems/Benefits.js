import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { BENEFIT_ART } from '../art/effects.js';
import { BENEFITS, WALLETS, formatAmount } from '../data/benefits.js';

// 회사 혜택 줍기 (5화): 월급봉투·성과급·명절 상여·복지포인트·식대 쿠폰 (src/data/benefits.js)
// - 몬스터를 잡거나(chance) 보스·엘리트가 퇴근하거나 내 자리 퀴즈를 맞히면 떨어진다
// - 결재 서류처럼 가까이 가면 빨려 와서 주워지고, "+300원 월급봉투" 글자가 뜬다
// - 이번 판에 주운 것은 this.run 에 모으고, 판이 끝날 때 GameScene 이 지갑(Wallet.js)에 정산한다
// - 바닥에 lifetime 동안 있다가 깜빡이며 사라진다
//
// 장면 이벤트
//   'benefit-collected'  { def, amount, run }   주웠을 때 (HUD 지갑 표시)
export default class Benefits {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.pool = [];
    this.run = Object.fromEntries(Object.keys(WALLETS).map((k) => [k, 0]));
    this.byTrigger = { kill: [], boss: [], desk: [] };
    for (const def of BENEFITS) for (const d of def.drops) this.byTrigger[d.on]?.push({ def, chance: d.chance ?? 1 });

    scene.events.on('enemy-killed', ({ def, x, y }) => {
      if (def.boss || def.elite) {
        this.byTrigger.boss.forEach(({ def: b }) => this.drop(b, x, y, CONFIG.pickup.bossScatter));
        return;
      }
      const scale = CONFIG.benefits.chanceScale;
      for (const { def: b, chance } of this.byTrigger.kill) {
        if (Math.random() < chance * scale) {
          this.drop(b, x, y);
          break; // 한 마리에서 하나만
        }
      }
    });
    scene.events.on('desk-done', ({ correct }) => {
      if (!correct) return;
      const { x, y } = this.player;
      this.byTrigger.desk.forEach(({ def }) => this.drop(def, x, y - CONFIG.benefits.deskDropY, CONFIG.pickup.bossScatter));
    });
  }

  drop(def, x, y, scatter = CONFIG.pickup.scatter) {
    const b = CONFIG.benefits;
    let item = this.pool.find((p) => !p.active);
    if (!item) {
      if (this.pool.length >= b.poolSize) return;
      item = this.scene.add.image(0, 0, BENEFIT_ART[def.art]).setOrigin(0.5, 1);
      this.pool.push(item);
    }
    item
      .setTexture(BENEFIT_ART[def.art])
      .setPosition(x + Phaser.Math.Between(-scatter, scatter), y + Phaser.Math.Between(-scatter, scatter))
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setDepth(y);
    item.def = def;
    item.left = b.lifetime;
    item.pulled = false;
    item.speed = 0;
  }

  // 히트스톱 중에는 부르지 않는다 (GameScene.update)
  update(delta) {
    const b = CONFIG.benefits;
    const { magnetRadius, pullAccel, pullMaxSpeed, collectRadius } = CONFIG.pickup;
    const { x: px, y: py } = this.player;
    const dt = delta / 1000;
    for (const item of this.pool) {
      if (!item.active) continue;
      item.left -= delta;
      if (item.left <= 0) {
        item.setActive(false).setVisible(false);
        continue;
      }
      item.setAlpha(item.left < b.blinkFrom && Math.floor(item.left / b.blinkInterval) % 2 === 0 ? b.blinkAlpha : 1);
      const dx = px - item.x;
      const dy = py - item.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= collectRadius) {
        this.collect(item);
        continue;
      }
      if (!item.pulled && dist > magnetRadius) continue;
      item.pulled = true;
      item.speed = Math.min(pullMaxSpeed, item.speed + pullAccel * dt);
      const step = Math.min(dist, item.speed * dt);
      item.setPosition(item.x + (dx / dist) * step, item.y + (dy / dist) * step).setDepth(item.y);
    }
  }

  collect(item) {
    item.setActive(false).setVisible(false);
    const def = item.def;
    const amount = Math.round(def.amount * CONFIG.benefits.amountScale);
    this.run[def.wallet] += amount;
    const color = CONFIG.benefits.colors[def.wallet];
    this.scene.juice.popText(this.player.x, this.player.y - CONFIG.benefits.textY, `+${formatAmount(def.wallet, amount)} ${def.name}`, color);
    this.scene.juice.sfx.play('ping');
    this.scene.events.emit('benefit-collected', { def, amount, run: this.run });
  }
}
