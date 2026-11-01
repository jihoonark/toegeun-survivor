import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { HERO } from '../art/hero.js';
import { ENEMY_ART, enemyTexture } from '../art/enemies.js';
import { addText } from '../systems/Text.js';

// 풀에서 다시 꺼낼 때마다 새 번호를 준다. 같은 오브젝트라도 새로 나온 적은 다른 적으로 본다
let nextSpawnId = 1;

// 적 하나. 물리 판정은 바닥의 그림자가 맡고, 몸(visual)은 그 위에서 통통 뛴다
// 그래서 점프 높이와 찌그러짐이 충돌 판정에 영향을 주지 않는다
//
// 장면 이벤트
//   'enemy-killed'  { enemy, def, x, y }
export default class Enemy extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, HERO.shadow);
    this.visual = scene.add.image(x, y, '__DEFAULT').setOrigin(0.5, ENEMY_ART.footY / ENEMY_ART.size);
    this.visual.setActive(false).setVisible(false);
  }

  spawn(def, x, y) {
    this.def = def;
    this.spawnId = nextSpawnId++;
    this.hp = def.hp;
    this.hopTime = Math.random() * (def.hop?.duration ?? 1);
    this.flashLeft = 0;
    this.knockLeft = 0;

    this.enableBody(true, x, y, true, true);
    this.body.setSize(def.bodyWidth, def.bodyHeight);

    this.visual.setTexture(enemyTexture(this.scene, def.art)).clearTint().setScale(1).setActive(true).setVisible(true);

    if (def.credit) {
      this.nameplate = addText(this.scene, x, y, `${def.credit.nickname}님의 ${def.name}`, {
        size: CONFIG.ui.smallFontSize,
        color: CONFIG.colors.accent,
      });
    }
    this.syncAfterPhysics();
  }

  chase(target) {
    if (this.knockLeft > 0) return; // 밀려나는 동안은 쫓지 않는다
    this.scene.physics.moveToObject(this, target, this.def.speed);
  }

  // 피격 깜빡임: 몸을 하얗게
  flash(ms) {
    this.flashLeft = ms;
    this.visual.setTintFill(0xffffff);
  }

  // 넉백: (dx, dy) 방향으로 잠깐 밀려난다
  knockback(dx, dy, strength, ms) {
    const len = Math.hypot(dx, dy);
    if (len === 0 || strength <= 0) return;
    this.knockLeft = ms;
    this.body.velocity.set((dx / len) * strength, (dy / len) * strength);
  }

  // 위에서 한 대 맞음. 0이 되면 처치
  takeDamage(amount) {
    if (!this.active) return;
    this.hp -= amount;
    if (this.hp <= 0) this.kill();
  }

  kill() {
    const { x, y } = this;
    this.remove();
    this.scene.events.emit('enemy-killed', { enemy: this, def: this.def, x, y });
  }

  remove() {
    this.disableBody(true, true);
    this.visual.setActive(false).setVisible(false);
    this.nameplate?.destroy();
    this.nameplate = null;
  }

  // 투사체가 노리는 곳: 바닥이 아니라 몸 한가운데
  getAimPoint() {
    return this.visual.getCenter();
  }

  // 물리 이동이 반영된 뒤 몸·이름표 위치와 점프 모양을 맞춘다
  // 히트스톱 중에는 delta 가 0으로 들어와 점프·깜빡임·넉백 시간이 함께 멈춘다
  syncAfterPhysics(delta = 0) {
    if (!this.active) return;
    if (this.flashLeft > 0) {
      this.flashLeft -= delta;
      if (this.flashLeft <= 0) this.visual.clearTint();
    }
    if (this.knockLeft > 0) this.knockLeft -= delta;
    const hop = this.def.hop;
    let lift = 0;
    let squash = 0;
    if (hop) {
      // 한 번 뛰는 시간 중 앞부분(hopAirRatio)은 공중, 나머지는 착지하며 찌그러진다
      this.hopTime = (this.hopTime + delta) % hop.duration;
      const t = this.hopTime / hop.duration;
      const airTime = CONFIG.enemy.hopAirRatio;
      if (t < airTime) lift = Math.sin((Math.PI * t) / airTime) * hop.height;
      else squash = Math.sin((Math.PI * (t - airTime)) / (1 - airTime)) * hop.squash;
    }

    this.visual.setPosition(this.x, this.y - lift).setScale(1 + squash, 1 - squash).setDepth(this.y);
    this.setDepth(this.y - 1);
    this.nameplate?.setPosition(this.x, this.y - lift - CONFIG.enemy.nameplateOffsetY).setDepth(CONFIG.depth.flying);
  }
}
