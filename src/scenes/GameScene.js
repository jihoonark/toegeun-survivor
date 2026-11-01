import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import { OFFICE_TEXTURES } from '../art/office.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.buildOffice();
    this.setupDevCamera();
  }

  buildOffice() {
    const { worldWidth, worldHeight, desks, plants } = CONFIG.office;

    this.add.tileSprite(0, 0, worldWidth, worldHeight, OFFICE_TEXTURES.floor).setOrigin(0).setDepth(-Infinity);

    // 탑다운 3/4 시점: 발밑 y가 클수록 앞에 그려지도록 깊이를 y로 둔다
    const place = (key, [x, y]) => this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    desks.forEach((pos) => place(OFFICE_TEXTURES.desk, pos));
    plants.forEach((pos) => place(OFFICE_TEXTURES.plant, pos));

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.centerOn(worldWidth / 2, worldHeight / 2);
  }

  // 임시: 주인공이 들어오기 전까지 방향키·드래그로 사무실을 둘러본다
  setupDevCamera() {
    const cam = this.cameras.main;
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.on('pointermove', (p) => {
      if (!p.isDown) return;
      cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
      cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
    });

    const { width, height } = CONFIG.screen;
    addText(this, width / 2, height - CONFIG.ui.title.creditBottom, '방향키·드래그로 둘러보기 (임시)', {
      size: CONFIG.ui.smallFontSize,
    })
      .setScrollFactor(0)
      .setDepth(Infinity);
  }

  update(_time, delta) {
    if (!this.cursors) return;
    const step = (CONFIG.dev.cameraPanSpeed * delta) / 1000;
    const cam = this.cameras.main;
    if (this.cursors.left.isDown) cam.scrollX -= step;
    if (this.cursors.right.isDown) cam.scrollX += step;
    if (this.cursors.up.isDown) cam.scrollY -= step;
    if (this.cursors.down.isDown) cam.scrollY += step;
  }
}
