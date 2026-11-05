import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { EFFECT_TEXTURES } from '../art/effects.js';

// 결재 서류(경험치): 몬스터를 처치한 자리에 떨어지고, 가까이 가면 주인공 쪽으로 빨려 와서 주워진다
// 몬스터의 xp 만큼 서류 한 장의 값이 된다
//
// 장면 이벤트
//   'xp-gained'  { amount }   서류를 주웠을 때 (승진 막대에서 쓴다)
export default class Pickups {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.pool = [];
    scene.events.on('enemy-killed', ({ def, x, y }) => this.drop(x, y, def.xp ?? 1));
  }

  drop(x, y, value) {
    if (value <= 0) return;
    let paper = this.pool.find((p) => !p.active);
    if (!paper) {
      if (this.pool.length >= CONFIG.pickup.poolSize) return;
      paper = this.scene.add.image(0, 0, EFFECT_TEXTURES.document).setOrigin(0.5, 1);
      this.pool.push(paper);
    }
    const s = CONFIG.pickup.scatter;
    paper
      .setPosition(x + Phaser.Math.Between(-s, s), y + Phaser.Math.Between(-s, s))
      .setActive(true)
      .setVisible(true)
      .setDepth(y);
    paper.value = value;
    paper.pulled = false;
    paper.speed = 0;
  }

  // 히트스톱 중에는 부르지 않는다 (GameScene.update)
  update(delta) {
    const { magnetRadius, pullAccel, pullMaxSpeed, collectRadius } = CONFIG.pickup;
    const { x: px, y: py } = this.player;
    const dt = delta / 1000;
    for (const paper of this.pool) {
      if (!paper.active) continue;
      const dx = px - paper.x;
      const dy = py - paper.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= collectRadius) {
        this.collect(paper);
        continue;
      }
      // 한 번 끌려오기 시작하면 멀어져도 끝까지 따라온다
      if (!paper.pulled && dist > magnetRadius) continue;
      paper.pulled = true;
      paper.speed = Math.min(pullMaxSpeed, paper.speed + pullAccel * dt);
      const step = Math.min(dist, paper.speed * dt);
      paper.setPosition(paper.x + (dx / dist) * step, paper.y + (dy / dist) * step).setDepth(paper.y);
    }
  }

  collect(paper) {
    paper.setActive(false).setVisible(false);
    this.scene.events.emit('xp-gained', { amount: paper.value });
  }
}
