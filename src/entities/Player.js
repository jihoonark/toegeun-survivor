import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { HERO } from '../art/hero.js';

// 장면 이벤트
//   'player-hit'  { player, damage, mental }   멘탈이 깎였을 때 (타격감·HUD에서 쓴다)
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, HERO.texture, 'down-idle-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const { bodyWidth, bodyHeight, maxMental } = CONFIG.player;
    // 기준점을 발바닥에 두고, 충돌 판정은 발 부분만
    this.setOrigin(0.5, HERO.footY / HERO.size);
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset((HERO.size - bodyWidth) / 2, HERO.footY - bodyHeight);
    this.setCollideWorldBounds(true);

    this.shadow = scene.add.image(x, y, HERO.shadow);
    this.facing = 'down';
    this.play('hero-idle-down');

    this.mental = maxMental;
    this.invulnerableLeft = 0;
    this.flashLeft = 0;
  }

  move(dir) {
    const speed = CONFIG.player.speed;
    this.setVelocity(dir.x * speed, dir.y * speed);

    const moving = dir.lengthSq() > 0;
    if (moving) {
      // 더 많이 움직이는 축으로 바라보는 방향을 정한다
      if (Math.abs(dir.x) > Math.abs(dir.y)) {
        this.facing = 'side';
        this.setFlipX(dir.x < 0);
      } else {
        this.facing = dir.y < 0 ? 'up' : 'down';
        this.setFlipX(false);
      }
    }
    this.play(`hero-${moving ? 'walk' : 'idle'}-${this.facing}`, true);
  }

  // 적에게 닿았을 때. 무적 시간 중이면 무시하고 false
  // 무적 시간과 깜빡임은 syncAfterPhysics 의 delta 로 줄어서 히트스톱 동안 함께 멈춘다
  hurt(damage) {
    if (this.invulnerableLeft > 0 || this.mental <= 0) return false;

    this.mental = Math.max(0, this.mental - damage);
    this.invulnerableLeft = CONFIG.player.hurtCooldown;

    this.scene.events.emit('player-hit', { player: this, damage, mental: this.mental });
    return true;
  }

  // 피격 깜빡임: 하얗게
  flash(ms) {
    this.flashLeft = ms;
    this.setTintFill(0xffffff);
  }

  // 그림자와 앞뒤 정렬은 물리 이동이 끝난 뒤에 맞춘다
  syncAfterPhysics(delta = 0) {
    if (this.flashLeft > 0) {
      this.flashLeft -= delta;
      if (this.flashLeft <= 0) this.clearTint();
    }
    if (this.invulnerableLeft > 0) {
      this.invulnerableLeft = Math.max(0, this.invulnerableLeft - delta);
      // 무적 시간 동안 hurtBlinkInterval 마다 흐려졌다 돌아온다
      const { hurtCooldown, hurtBlinkInterval, hurtBlinkAlpha } = CONFIG.player;
      const dim = this.invulnerableLeft > 0 && Math.floor((hurtCooldown - this.invulnerableLeft) / hurtBlinkInterval) % 2 === 0;
      this.setAlpha(dim ? hurtBlinkAlpha : 1);
    }
    this.shadow.setPosition(this.x, this.y).setDepth(this.y - 1);
    this.setDepth(this.y);
  }
}
