import { CONFIG } from '../config.js';
import { addText } from './Text.js';
import Sfx from './Sfx.js';
import { EFFECT_TEXTURES } from '../art/effects.js';

// 타격감 (GAME_SPEC.md 6장): 장면 이벤트를 듣고 효과를 낸다. 수치는 모두 CONFIG.juice
//   'enemy-hit'     피격 깜빡임, 넉백, 데미지 숫자, 무기별 타격 효과(무기 데이터의 hitFx)
//   'enemy-killed'  화면 흔들림, 종이 조각, 처치음, 히트스톱
//   'player-hit'    화면 흔들림, 주인공 깜빡임, 피격음
// 히트스톱은 처치할 때만, cooldown 안에 한 번만 건다. 맞힐 때마다 멈추면 몬스터가 많을 때 계속 끊겨 보인다
export default class Juice {
  constructor(scene) {
    this.scene = scene;
    this.sfx = new Sfx(scene);
    this.frozenUntil = 0;
    this.frozen = false;
    this.lastHitStop = -Infinity;

    this.paper = this.emitter(EFFECT_TEXTURES.paper, EFFECT_TEXTURES.paperFrames, CONFIG.juice.particles);
    // 무기별 파편 (hitFx.particle 키)과 투사체 잔상 (투사체 그림 키). 처음 쓸 때 만든다
    this.hitEmitters = {};
    this.trailEmitters = {};
    this.trailTimers = new WeakMap();

    this.numbers = [];
    for (let i = 0; i < CONFIG.juice.damageNumber.poolSize; i++) {
      const d = CONFIG.juice.damageNumber;
      this.numbers.push(addText(scene, 0, 0, '', { size: d.size, color: d.color, stroke: d.stroke }).setDepth(CONFIG.depth.flying).setVisible(false));
    }

    scene.events.on('enemy-hit', this.onEnemyHit, this);
    scene.events.on('enemy-killed', this.onEnemyKilled, this);
    scene.events.on('player-hit', this.onPlayerHit, this);
  }

  // frames: 파편 이미지 프레임 목록 (없으면 그림 한 장)
  emitter(texture, frames, p) {
    return this.scene.add
      .particles(0, 0, texture, {
        ...(frames && { frame: frames }),
        speed: { min: p.speedMin, max: p.speedMax },
        angle: { min: 0, max: 360 },
        rotate: p.rotate === false ? 0 : { min: 0, max: 360 },
        gravityY: p.gravity,
        lifespan: p.lifespan,
        alpha: { start: p.alpha ?? 1, end: 0 },
        emitting: false,
      })
      .setDepth(CONFIG.depth.flying);
  }

  hitEmitter(key) {
    const frames = EFFECT_TEXTURES.hitFrames[key];
    if (!frames) return null;
    this.hitEmitters[key] ??= this.emitter(EFFECT_TEXTURES.hit, frames, CONFIG.juice.hitParticles);
    return this.hitEmitters[key];
  }

  onEnemyHit({ enemy, damage, x, y, vx, vy, weapon }) {
    const j = CONFIG.juice;
    const fx = weapon?.hitFx ?? {};
    this.damageNumber(x, y, damage);
    this.sfx.play(fx.sound ?? 'hit');
    this.hitEmitter(fx.particle)?.explode(fx.particleCount ?? j.hitParticles.count, x, y);
    if (fx.text) this.popText(x, y, fx.text);
    if (!enemy.active) return; // 이 한 방에 처치됐으면 깜빡임·넉백은 생략
    enemy.flash?.(j.flash.duration, fx.flashColor);
    enemy.knockback?.(vx, vy, j.knockback.strength, j.knockback.duration);
  }

  onEnemyKilled({ enemy }) {
    const j = CONFIG.juice;
    this.hitStop(j.hitStop.duration);
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

  // 히트스톱: 물리를 잠깐 멈춘다. 마지막으로 건 뒤 cooldown 이 지나야 다시 건다
  hitStop(ms) {
    const now = this.scene.time.now;
    if (ms <= 0 || now - this.lastHitStop < CONFIG.juice.hitStop.cooldown) return;
    this.lastHitStop = now;
    this.frozenUntil = Math.max(this.frozenUntil, now + ms);
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

  // 무기 데이터의 trail 이 있는 투사체 뒤에 잔상을 남긴다 (trail: 잔상 간격 ms)
  trails(projectiles, delta) {
    for (const p of projectiles.getChildren()) {
      if (!p.active || !p.weapon.trail) continue;
      const left = (this.trailTimers.get(p) ?? 0) - delta;
      if (left > 0) {
        this.trailTimers.set(p, left);
        continue;
      }
      this.trailTimers.set(p, p.weapon.trail);
      const key = p.texture.key;
      this.trailEmitters[key] ??= this.emitter(key, null, CONFIG.juice.trail);
      this.trailEmitters[key].emitParticleAt(p.x, p.y, 1);
    }
  }

  shake({ duration, intensity }) {
    const strength = CONFIG.juice.shake.strength;
    if (strength <= 0) return;
    this.scene.cameras.main.shake(duration, intensity * strength);
  }

  // 데미지 숫자는 미리 만든 글자를 돌려 쓴다 (맞을 때마다 글자를 새로 만들면 휴대폰이 버벅인다)
  damageNumber(x, y, damage) {
    const text = this.numbers.find((t) => !t.visible);
    if (!text) return;
    const d = CONFIG.juice.damageNumber;
    const label = Number.isInteger(damage) ? String(damage) : damage.toFixed(1);
    this.rise(text.setText(label).setColor(d.color), x, y, d);
  }

  // 무기별 짧은 글자 ("승인" 등). 데미지 숫자 글자를 같이 돌려 쓴다
  popText(x, y, message) {
    const text = this.numbers.find((t) => !t.visible);
    if (!text) return;
    const d = CONFIG.juice.damageNumber;
    this.rise(text.setText(message).setColor(d.popColor), x, y - d.popOffsetY, d);
  }

  rise(text, x, y, d) {
    text.setPosition(x, y).setAlpha(1).setVisible(true);
    this.scene.tweens.add({
      targets: text,
      y: y - d.rise,
      alpha: 0,
      duration: d.duration,
      ease: 'Quad.out',
      onComplete: () => text.setVisible(false),
    });
  }
}
