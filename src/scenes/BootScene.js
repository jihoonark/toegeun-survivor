import Phaser from 'phaser';

// 이후 단계에서 코드로 그린 도트 이미지(src/art)를 여기서 만들어 둔다
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Title');
  }
}
