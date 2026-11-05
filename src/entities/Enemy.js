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

  // boost: 시간대별 난이도 배율 { hp, speed } (Spawner 가 준다)
  spawn(def, x, y, boost = { hp: 1, speed: 1 }) {
    this.def = def;
    this.spawnId = nextSpawnId++;
    this.hp = Math.max(1, Math.round(def.hp * boost.hp));
    this.speed = def.speed * boost.speed;
    this.baseScale = def.scale ?? 1;
    this.hopTime = Math.random() * (def.hop?.duration ?? 1);
    this.flashLeft = 0;
    this.knockLeft = 0;
    this.stunLeft = 0;

    this.enableBody(true, x, y, true, true);
    this.body.setSize(def.bodyWidth, def.bodyHeight);

    this.visual.setTexture(enemyTexture(this.scene, def.art)).clearTint().setScale(1).setActive(true).setVisible(true);

    // 시청자 몬스터는 "○○님의 [이름]", 아니면 label 이 있을 때만 머리 위 글자
    const plate = def.credit ? `${def.credit.nickname}님의 ${def.name}` : def.label;
    if (plate) {
      this.nameplate = addText(this.scene, x, y, plate, {
        size: CONFIG.ui.smallFontSize,
        color: def.credit ? CONFIG.colors.accent : CONFIG.colors.text,
      });
      if (!def.credit && def.labelTime) {
        this.scene.tweens.add({ targets: this.nameplate, alpha: 0, delay: def.labelTime, duration: CONFIG.enemy.labelFade });
      }
    }
    this.syncAfterPhysics();
  }

  chase(target) {
    if (this.knockLeft > 0) return; // 밀려나는 동안은 쫓지 않는다
    if (this.stunLeft > 0) {
      this.body.velocity.set(0, 0); // 스테이플러에 고정된 동안은 제자리
      return;
    }
    this.scene.physics.moveToObject(this, target, this.speed);
  }

  // 피격 깜빡임: 몸을 하얗게
  flash(ms) {
    this.flashLeft = ms;
    this.visual.setTintFill(0xffffff);
  }

  // 고정: ms 동안 움직이지 않고, 점프도 멈추고, 색이 바랜다 (이어서 맞으면 더 긴 쪽으로)
  stun(ms) {
    this.stunLeft = Math.max(this.stunLeft, ms);
    if (this.flashLeft <= 0) this.visual.setTint(CONFIG.enemy.stunTint);
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
    if (this.nameplate) this.scene.tweens.killTweensOf(this.nameplate);
    this.nameplate?.destroy();
    this.nameplate = null;
  }

  // 하얀 깜빡임이 끝나면: 고정 중이면 바랜 색, 아니면 원래 색
  restoreTint() {
    if (this.stunLeft > 0) this.visual.setTint(CONFIG.enemy.stunTint);
    else this.visual.clearTint();
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
      if (this.flashLeft <= 0) this.restoreTint();
    }
    if (this.knockLeft > 0) this.knockLeft -= delta;
    if (this.stunLeft > 0) {
      this.stunLeft -= delta;
      if (this.stunLeft <= 0 && this.flashLeft <= 0) this.restoreTint();
    }
    const hop = this.def.hop;
    let lift = 0;
    let squash = 0;
    if (hop && this.stunLeft <= 0) {
      // 한 번 뛰는 시간 중 앞부분(hopAirRatio)은 공중, 나머지는 착지하며 찌그러진다
      this.hopTime = (this.hopTime + delta) % hop.duration;
      const t = this.hopTime / hop.duration;
      const airTime = CONFIG.enemy.hopAirRatio;
      if (t < airTime) lift = Math.sin((Math.PI * t) / airTime) * hop.height;
      else squash = Math.sin((Math.PI * (t - airTime)) / (1 - airTime)) * hop.squash;
    }

    const s = this.baseScale;
    this.visual.setPosition(this.x, this.y - lift).setScale(s * (1 + squash), s * (1 - squash)).setDepth(this.y);
    this.setDepth(this.y - 1);
    this.nameplate?.setPosition(this.x, this.y - lift - CONFIG.enemy.nameplateOffsetY * s).setDepth(CONFIG.depth.flying);
  }
}
