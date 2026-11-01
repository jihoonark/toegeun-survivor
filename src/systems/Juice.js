import { CONFIG } from '../config.js';
import { addText } from './Text.js';
import Sfx from './Sfx.js';
import { EFFECT_TEXTURES } from '../art/effects.js';

// 타격감 (GAME_SPEC.md 6장): 장면 이벤트를 듣고 효과를 낸다. 수치는 모두 CONFIG.juice
//   'enemy-hit'     히트스톱, 피격 깜빡임, 넉백, 데미지 숫자, 타격음
//   'enemy-killed'  화면 흔들림, 종이 조각, 처치음, 조금 긴 히트스톱
//   'player-hit'    화면 흔들림, 주인공 깜빡임, 피격음 (7화 멘탈 바에서 보낸다)
export default class Juice {
  constructor(scene) {
    this.scene = scene;
    this.sfx = new Sfx(scene);
    this.frozenUntil = 0;
    this.frozen = false;

    const p = CONFIG.juice.particles;
    this.paper = scene.add
      .particles(0, 0, EFFECT_TEXTURES.paper, {
        frame: EFFECT_TEXTURES.paperFrames,
        speed: { min: p.speedMin, max: p.speedMax },
        angle: { min: 0, max: 360 },
        rotate: { min: 0, max: 360 },
        gravityY: p.gravity,
        lifespan: p.lifespan,
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(CONFIG.depth.flying);

    scene.events.on('enemy-hit', this.onEnemyHit, this);
    scene.events.on('enemy-killed', this.onEnemyKilled, this);
    scene.events.on('player-hit', this.onPlayerHit, this);
  }

  onEnemyHit({ enemy, damage, x, y, vx, vy }) {
    const j = CONFIG.juice;
    this.hitStop(j.hitStop.duration);
    this.damageNumber(x, y, damage);
    this.sfx.play('hit');
    if (!enemy.active) return; // 이 한 방에 처치됐으면 깜빡임·넉백은 생략
    enemy.flash?.(j.flash.duration);
    enemy.knockback?.(vx, vy, j.knockback.strength, j.knockback.duration);
  }

  onEnemyKilled({ enemy }) {
    const j = CONFIG.juice;
    this.hitStop(j.hitStop.duration * j.hitStop.killMultiplier);
    this.shake(j.shake.kill);
    const aim = enemy.getAimPoint ? enemy.getAimPoint() : enemy;
    this.paper.explode(j.particles.count, aim.x, aim.y);
    this.sfx.play('kill');
  }

  onPlayerHit({ player }) {
    const j = CONFIG.juice;
    this.shake(j.shake.playerHit);
    player?.flash?.(j.flash.duration);
    this.sfx.play('hurt');
  }

  // 히트스톱: 물리를 잠깐 멈춘다. 이어서 맞으면 끝나는 시각만 늘린다
  hitStop(ms) {
    if (ms <= 0) return;
    this.frozenUntil = Math.max(this.frozenUntil, this.scene.time.now + ms);
    if (!this.frozen) {
      this.frozen = true;
      this.scene.physics.world.pause();
    }
  }

  // 매 프레임 가장 먼저 부른다. 멈춘 동안에는 true
  update(time) {
    if (this.frozen && time >= this.frozenUntil) {
      this.frozen = false;
      this.scene.physics.world.resume();
    }
    return this.frozen;
  }

  shake({ duration, intensity }) {
    const strength = CONFIG.juice.shake.strength;
    if (strength <= 0) return;
    this.scene.cameras.main.shake(duration, intensity * strength);
  }

  damageNumber(x, y, damage) {
    const d = CONFIG.juice.damageNumber;
    const label = Number.isInteger(damage) ? String(damage) : damage.toFixed(1);
    const text = addText(this.scene, x, y, label, { size: d.size, color: d.color, stroke: d.stroke }).setDepth(
      CONFIG.depth.flying,
    );
    this.scene.tweens.add({
      targets: text,
      y: y - d.rise,
      alpha: 0,
      duration: d.duration,
      ease: 'Quad.out',
      onComplete: () => text.destroy(),
    });
  }
}
