import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { EFFECT_TEXTURES } from '../art/effects.js';

// 줍는 아이템 "전체 회신 폭탄" (GAME_SPEC.md 12장 "줍는 아이템"): 주우면 화면 안 몬스터를 한 번에 날려버린다
// - 몬스터를 잡으면 가끔 떨어진다 (config bomb.dropChance, 마지막으로 떨어진 뒤 minGap 이 지나야)
// - 보스·엘리트는 퇴근하면서 반드시 하나 떨어뜨린다
// - 주우면 화면 안 일반 몬스터는 모두 처치, 보스·엘리트는 최대 체력의 bossDamage 비율만큼 피해
//   폭탄으로 처치된 몬스터(enemy.bombed)는 쪼개지지 않고, 종이 조각·도장 연출은 fxLimit 마리까지만 (휴대폰에서 한 번에 많이 잡을 때)
// - 바닥에 lifetime 동안 있다가 깜빡이며 사라진다
//
// 장면 이벤트
//   'bomb-dropped'   { x, y }
//   'bomb-exploded'  { count }   날려버린 몬스터 수
export default class Bombs {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.items = [];
    // 폭발 중 상사가 퇴근하며 떨어뜨린 폭탄은 여기 모았다가 목록 정리가 끝난 뒤 넣는다
    this.incoming = [];
    this.lastDrop = -Infinity;
    // 폭탄으로 처치될 때 연출을 더 보여 줄 수 있는 마리 수 (폭발할 때만 fxLimit, 평소엔 제한 없음)
    scene.bombFxLeft = Infinity;
    scene.events.on('enemy-killed', ({ def, x, y }) => {
      const b = CONFIG.bomb;
      const now = scene.time.now;
      if (def.boss || def.elite || (now - this.lastDrop >= b.minGap && Math.random() < b.dropChance)) this.drop(x, y);
    });
  }

  drop(x, y) {
    const b = CONFIG.bomb;
    this.lastDrop = this.scene.time.now;
    const image = this.scene.add.image(x, y, EFFECT_TEXTURES.bomb).setOrigin(0.5, 1).setDepth(y);
    // 눈에 띄게 통통 튄다
    this.scene.tweens.add({ targets: image, y: y - b.bob, duration: b.bobTime, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.incoming.push({ image, x, y, left: b.lifetime, pulled: false, speed: 0 });
    this.scene.events.emit('bomb-dropped', { x, y });
  }

  // 히트스톱 중에는 부르지 않는다 (GameScene.update)
  update(delta) {
    const b = CONFIG.bomb;
    const { magnetRadius, pullAccel, pullMaxSpeed, collectRadius } = CONFIG.pickup;
    const dt = delta / 1000;
    this.items.push(...this.incoming.splice(0));
    this.items = this.items.filter((item) => {
      item.left -= delta;
      if (item.left <= 0) {
        item.image.destroy();
        return false;
      }
      // 사라지기 전 blinkFrom(ms) 동안 깜빡인다
      item.image.setAlpha(item.left < b.blinkFrom && Math.floor(item.left / b.blinkInterval) % 2 === 0 ? b.blinkAlpha : 1);
      const dx = this.player.x - item.x;
      const dy = this.player.y - item.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= collectRadius) {
        item.image.destroy();
        this.explode();
        return false;
      }
      if (!item.pulled && dist > magnetRadius) return true;
      item.pulled = true;
      item.speed = Math.min(pullMaxSpeed, item.speed + pullAccel * dt);
      const step = Math.min(dist, item.speed * dt);
      item.x += (dx / dist) * step;
      item.y += (dy / dist) * step;
      this.scene.tweens.killTweensOf(item.image);
      item.image.setPosition(item.x, item.y).setDepth(item.y);
      return true;
    });
    this.items.push(...this.incoming.splice(0));
  }

  // 화면(조금 더 넓게) 안의 몬스터를 한 번에
  explode() {
    const b = CONFIG.bomb;
    const view = new Phaser.Geom.Rectangle(0, 0, 0, 0);
    Phaser.Geom.Rectangle.CopyFrom(this.scene.cameras.main.worldView, view);
    Phaser.Geom.Rectangle.Inflate(view, b.margin, b.margin);
    const targets = this.scene.enemies.getChildren().filter((e) => e.active && view.contains(e.x, e.y));
    this.scene.bombFxLeft = b.fxLimit;
    for (const e of targets) {
      if (!e.active) continue; // 앞에서 처치된 것
      e.bombed = true;
      e.takeDamage(e.def.boss || e.def.elite ? Math.ceil(e.maxHp * b.bossDamage) : e.hp);
      e.bombed = false; // 버틴 보스·엘리트는 나중에 평소처럼 처치된다
    }
    this.scene.bombFxLeft = Infinity;
    this.scene.events.emit('bomb-exploded', { count: targets.length });
  }
}
