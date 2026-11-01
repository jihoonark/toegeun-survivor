import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { projectileTexture } from '../art/projectiles.js';

// 무기 데이터 하나로 움직이는 투사체. Combat의 풀에서 꺼내 쓰고 돌려놓는다
export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, '__DEFAULT');
    this.hitTargets = new Set();
  }

  fire(weapon, x, y, angle, damage) {
    this.weapon = weapon;
    this.damage = damage;
    this.pierceLeft = weapon.pierce;
    this.lifeLeft = weapon.lifetime;
    this.hitTargets.clear();

    this.setTexture(projectileTexture(this.scene, weapon.projectile));
    this.enableBody(true, x, y, true, true);
    this.body.setSize(this.width, this.height);
    // 명중 판정 반지름 (회전해도 같도록 원으로 본다)
    this.radius = Math.min(this.width, this.height) / 2;
    this.setDepth(CONFIG.depth.flying);
    this.setAngle(0);
    this.scene.physics.velocityFromRotation(angle, weapon.speed, this.body.velocity);
  }

  // 적에게 맞았을 때. 같은 적을 두 번 맞히지 않고, 관통 횟수를 다 쓰면 사라진다
  hit(target) {
    if (this.hitTargets.has(target)) return false;
    this.hitTargets.add(target);
    if (this.pierceLeft-- <= 0) this.remove();
    return true;
  }

  remove() {
    this.disableBody(true, true);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    this.angle += (this.weapon.spin * delta) / 1000;
    this.lifeLeft -= delta;
    if (this.lifeLeft <= 0) this.remove();
  }
}
