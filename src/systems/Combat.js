import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { WEAPONS } from '../data/weapons.js';
import Projectile from '../entities/Projectile.js';

// 자동 공격: 무기마다 쿨다운이 차면 사거리 안의 가장 가까운 적에게 던진다
// 적 그룹에 들어가는 오브젝트는 active, x, y, takeDamage(amount, source)가 있어야 하고
// spawnId(등장할 때마다 새 번호)가 있으면 관통 무기가 같은 적을 두 번 맞히지 않는 데 쓴다
// getAimPoint()가 있으면 그곳을, 없으면 오브젝트 가운데를 노린다
// 명중은 물리 판정이 아니라 조준점과의 거리로 본다. 탑다운 3/4에서 몸은 바닥(물리 판정)보다 위에 그려지기 때문
// 반지름은 적 데이터의 hitRadius, 없으면 오브젝트 크기의 절반
//
// 장면 이벤트 (타격감·점수에서 쓴다)
//   'enemy-hit'     { enemy, damage, x, y, vx, vy }
//   'weapon-added'  { weapon }   무기를 얻었을 때 (credit 알림에서 쓴다)
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
  }

  // weapons.js 에서 starter: true 인 무기를 들고 시작한다
  addStarterWeapons() {
    WEAPONS.filter((w) => w.starter).forEach((w) => this.addWeapon(w));
  }

  addWeapon(def) {
    this.weapons.push({ def, cooldownLeft: 0 });
    this.scene.events.emit('weapon-added', { weapon: def });
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
    this.checkHits();
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
    const center = target.getAimPoint ? target.getAimPoint() : target.getCenter();
    const angle = Phaser.Math.Angle.Between(x, y, center.x, center.y);
    projectile.fire(weapon, x, y, angle, damage);
  }

  checkHits() {
    const enemies = this.enemies.getChildren();
    for (const projectile of this.projectiles.getChildren()) {
      if (!projectile.active) continue;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const aim = enemy.getAimPoint ? enemy.getAimPoint() : enemy.getCenter();
        const reach = (enemy.def?.hitRadius ?? enemy.width / 2) + projectile.radius;
        if (Phaser.Math.Distance.Squared(projectile.x, projectile.y, aim.x, aim.y) > reach * reach) continue;
        this.onHit(projectile, enemy);
        if (!projectile.active) break;
      }
    }
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
