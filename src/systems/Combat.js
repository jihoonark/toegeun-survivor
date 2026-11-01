import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { getWeapon } from '../data/weapons.js';
import Projectile from '../entities/Projectile.js';

// 자동 공격: 무기마다 쿨다운이 차면 사거리 안의 가장 가까운 적에게 던진다
// 적 그룹에 들어가는 오브젝트는 active, x, y, takeDamage(amount, source)만 있으면 된다
//
// 장면 이벤트 (타격감·점수에서 쓴다)
//   'enemy-hit'  { enemy, damage, x, y, vx, vy }
export default class Combat {
  constructor(scene, player, enemies) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.weapons = [];

    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      maxSize: CONFIG.combat.projectilePoolSize,
      runChildUpdate: false,
    });

    scene.physics.add.overlap(this.projectiles, enemies, this.onHit, null, this);
    CONFIG.player.startWeapons.forEach((id) => this.addWeapon(id));
  }

  addWeapon(id) {
    this.weapons.push({ def: getWeapon(id), cooldownLeft: 0 });
  }

  nearestEnemy(range) {
    let best = null;
    let bestDist = range * range;
    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active) continue;
      const d = Phaser.Math.Distance.Squared(this.player.x, this.player.y, enemy.x, enemy.y);
      if (d <= bestDist) {
        best = enemy;
        bestDist = d;
      }
    }
    return best;
  }

  update(delta) {
    const { attackSpeedMultiplier, damageMultiplier } = CONFIG.combat;
    for (const slot of this.weapons) {
      slot.cooldownLeft -= delta * attackSpeedMultiplier;
      if (slot.cooldownLeft > 0) continue;

      const target = this.nearestEnemy(slot.def.range);
      if (!target) {
        // 적이 없으면 쿨다운이 찬 상태로 기다렸다가 나타나는 즉시 던진다
        slot.cooldownLeft = 0;
        continue;
      }
      this.fire(slot.def, target, slot.def.damage * damageMultiplier);
      slot.cooldownLeft += slot.def.cooldown;
    }
  }

  fire(weapon, target, damage) {
    const projectile = this.projectiles.get();
    if (!projectile) return; // 풀이 가득 찼으면 이번 발사는 건너뛴다

    const x = this.player.x;
    const y = this.player.y - CONFIG.player.handHeight;
    const center = target.getCenter();
    const angle = Phaser.Math.Angle.Between(x, y, center.x, center.y);
    projectile.fire(weapon, x, y, angle, damage);
  }

  onHit(projectile, enemy) {
    if (!projectile.active || !enemy.active) return;
    // 관통이 끝나 투사체가 꺼지면 속도가 0이 되므로 먼저 읽어 둔다
    const { x, y } = projectile;
    const { x: vx, y: vy } = projectile.body.velocity;
    if (!projectile.hit(enemy)) return;

    enemy.takeDamage(projectile.damage, projectile);
    this.scene.events.emit('enemy-hit', { enemy, damage: projectile.damage, x, y, vx, vy });
  }
}
