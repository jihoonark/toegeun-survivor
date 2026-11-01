import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { HERO } from '../art/hero.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, HERO.texture, 'down-idle-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const { bodyWidth, bodyHeight } = CONFIG.player;
    // 기준점을 발바닥에 두고, 충돌 판정은 발 부분만
    this.setOrigin(0.5, HERO.footY / HERO.size);
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset((HERO.size - bodyWidth) / 2, HERO.footY - bodyHeight);
    this.setCollideWorldBounds(true);

    this.shadow = scene.add.image(x, y, HERO.shadow);
    this.facing = 'down';
    this.play('hero-idle-down');
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

  // 그림자와 앞뒤 정렬은 물리 이동이 끝난 뒤에 맞춘다
  syncAfterPhysics() {
    this.shadow.setPosition(this.x, this.y).setDepth(this.y - 1);
    this.setDepth(this.y);
  }
}
