import Phaser from 'phaser';
import { createOfficeTextures } from '../art/office.js';

// 코드로 그린 도트 이미지(src/art)를 여기서 만들어 둔다
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createOfficeTextures(this);
    this.scene.start('Title');
  }
}
