import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { createOfficeTextures } from '../art/office.js';
import { createHeroTextures, createHeroAnimations } from '../art/hero.js';
import { createProjectileTextures } from '../art/projectiles.js';
import { createEnemyTextures } from '../art/enemies.js';

// 코드로 그린 도트 이미지(src/art)를 여기서 만들어 둔다
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createOfficeTextures(this);
    createHeroTextures(this);
    createHeroAnimations(this, CONFIG.player);
    createProjectileTextures(this);
    createEnemyTextures(this);
    this.scene.start('Title');
  }
}
