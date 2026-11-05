import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { projectileTexture } from '../art/projectiles.js';

// 무기 데이터 하나로 움직이는 투사체. Combat의 풀에서 꺼내 쓰고 돌려놓는다
export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, '__DEFAULT');
    this.hitTargets = new Set();
  }

  fire(weapon, x, y, angle, damage, owner) {
    this.weapon = weapon;
    this.damage = damage;
    this.pierceLeft = weapon.pierce;
    this.lifeLeft = weapon.lifetime;
    this.owner = owner;
    this.returning = false;
    this.returnLeft = weapon.returnAfter;
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
  // (적은 풀에서 재사용되므로 오브젝트가 아니라 등장 번호 spawnId 로 기억한다)
  hit(target) {
    const key = target.spawnId ?? target;
    if (this.hitTargets.has(key)) return false;
    this.hitTargets.add(key);
    if (this.pierceLeft-- <= 0) this.remove();
    return true;
  }

  remove() {
    this.disableBody(true, true);
    this.owner = null;
  }

  // 무기 이름과 무관한 왕복 동작. 이동한 주인공의 손을 매번 다시 찾아 회수 경로가 달라진다
  updateReturn(delta) {
    if (this.returnLeft == null) return;
    if (!this.owner?.active) {
      this.remove();
      return;
    }
    this.returnLeft -= delta;
    if (this.returnLeft > 0) return;
    if (!this.returning) {
      this.returning = true;
      this.hitTargets.clear();
      this.pierceLeft = this.weapon.pierce;
    }

    const dx = this.owner.x - this.x;
    const dy = this.owner.y - CONFIG.player.handHeight - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= this.weapon.catchRadius) {
      this.remove();
      return;
    }
    // 낮은 프레임에서도 손을 지나쳐 왕복하지 않도록 이번 프레임 이동 거리를 제한한다
    const speed = delta > 0 ? Math.min(this.weapon.returnSpeed, distance * 1000 / delta) : this.weapon.returnSpeed;
    this.body.setVelocity(dx / distance * speed, dy / distance * speed);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // 히트스톱으로 물리가 멈춘 동안에는 회전·수명도 멈춘다
    if (!this.active || this.scene.physics.world.isPaused) return;
    this.lifeLeft -= delta;
    if (this.lifeLeft <= 0) {
      this.remove();
      return;
    }
    this.updateReturn(delta);
    if (!this.active) return;
    this.angle += (this.weapon.spin * delta) / 1000 * (this.returning ? -1 : 1);
  }
}
