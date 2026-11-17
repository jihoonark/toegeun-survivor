import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from './Text.js';

// 몬스터가 쏘는 공격 (팀장의 잔소리 말풍선)
// 몬스터 데이터의 attack 이 있으면 interval 마다 사거리 안의 주인공에게 말풍선 하나를 날린다
// 화가 나면(rageAfter 가 지나거나 체력이 rageBelow 아래) 더 자주, rageCount 갈래로 부채꼴 발사
//
// 무기 투사체로 말풍선을 맞히면 깨진다 (맞받아치기). 그 자리에 attack.parryLines 중 하나가 도장처럼 찍힌다
//
// 장면 이벤트
//   'enemy-rage'    { enemy }         몬스터가 화났을 때 (경고 글자)
//   'shot-parried'  { x, y, line }    말풍선을 깨뜨렸을 때
export default class EnemyShots {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.fired = 0;
  }

  update(delta, enemies, player, projectiles) {
    for (const e of enemies.getChildren()) {
      const a = e.active && e.def.attack;
      if (!a) continue;
      e.age += delta;
      if (!e.raging && (e.age >= a.rageAfter || e.hp / e.maxHp <= a.rageBelow)) this.enrage(e);
      e.attackLeft -= delta;
      if (e.attackLeft > 0 || e.stunLeft > 0) continue;
      const d = Phaser.Math.Distance.Between(e.x, e.y, player.x, player.y);
      if (d > a.range) continue;
      e.attackLeft = e.raging ? a.rageInterval : a.interval;
      this.volley(e, player);
    }
    this.moveShots(delta, player);
    if (projectiles) this.parry(projectiles);
  }

  parry(projectiles) {
    const r = CONFIG.parry.radius;
    for (const shot of this.pool) {
      if (!shot.active) continue;
      for (const p of projectiles.getChildren()) {
        if (!p.active) continue;
        const reach = r + p.radius;
        if (Phaser.Math.Distance.Squared(shot.x, shot.y, p.x, p.y) > reach * reach) continue;
        if (!p.hit(shot)) continue;
        shot.setActive(false).setVisible(false);
        const line = shot.parryLines?.length ? Phaser.Utils.Array.GetRandom(shot.parryLines) : null;
        this.scene.events.emit('shot-parried', { x: shot.x, y: shot.y, line });
        break;
      }
    }
  }

  enrage(e) {
    const a = e.def.attack;
    e.raging = true;
    e.speed *= a.rageSpeed;
    e.restoreTint();
    e.nameplate?.setText(a.rageLabel).setColor(CONFIG.colors.danger);
    this.scene.events.emit('enemy-rage', { enemy: e });
  }

  // 한 번에 한 발, 화나면 부채꼴 여러 발
  volley(e, player) {
    const a = e.def.attack;
    const from = e.getAimPoint();
    const base = Math.atan2(player.y - CONFIG.player.handHeight - from.y, player.x - from.x);
    const count = e.raging ? a.rageCount : 1;
    const spread = Phaser.Math.DegToRad(a.rageSpread);
    const line = Phaser.Utils.Array.GetRandom(a.lines);
    for (let i = 0; i < count; i++) {
      const angle = base + (i - (count - 1) / 2) * spread;
      this.fire(from.x, from.y, angle, line, a);
    }
  }

  fire(x, y, angle, line, a) {
    const s = CONFIG.enemyShot;
    let shot = this.pool.find((t) => !t.active);
    if (!shot) {
      shot = addText(this.scene, 0, 0, '', { size: CONFIG.ui.smallFontSize, color: s.color, stroke: 0 })
        .setBackgroundColor(s.back)
        .setPadding(2, 1, 2, 1)
        .setDepth(CONFIG.depth.flying);
      this.pool.push(shot);
    }
    shot.setText(line).setPosition(x, y).setActive(true).setVisible(true).setAlpha(1);
    shot.vx = Math.cos(angle) * a.speed;
    shot.vy = Math.sin(angle) * a.speed;
    shot.life = a.lifetime;
    shot.damage = a.damage;
    shot.parryLines = a.parryLines;
    shot.spawnId = `shot-${++this.fired}`;
  }

  moveShots(delta, player) {
    const dt = delta / 1000;
    const r = CONFIG.enemyShot.hitRadius;
    const px = player.x;
    const py = player.y - CONFIG.player.handHeight;
    for (const shot of this.pool) {
      if (!shot.active) continue;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= delta;
      if (shot.life < CONFIG.enemyShot.fadeTime) shot.setAlpha(Math.max(0, shot.life / CONFIG.enemyShot.fadeTime));
      const hit = Math.abs(shot.x - px) < r + shot.width / 2 && Math.abs(shot.y - py) < r;
      if (hit) player.hurt(shot.damage);
      if (hit || shot.life <= 0) shot.setActive(false).setVisible(false);
    }
  }
}
