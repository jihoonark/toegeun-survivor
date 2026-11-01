import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import Controls from '../systems/Controls.js';
import Player from '../entities/Player.js';
import { OFFICE_TEXTURES } from '../art/office.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.buildOffice();

    const { worldWidth, worldHeight } = CONFIG.office;
    this.player = new Player(this, worldWidth / 2, worldHeight / 2);
    this.controls = new Controls(this);

    const lerp = CONFIG.camera.followLerp;
    this.cameras.main.startFollow(this.player, true, lerp, lerp);

    this.showControlsHint();
    // 물리 이동이 끝난 뒤 그림자·앞뒤 정렬을 맞춘다
    this.physics.world.on('worldstep', () => this.player.syncAfterPhysics());
  }

  buildOffice() {
    const { worldWidth, worldHeight, furniture } = CONFIG.office;

    this.add.tileSprite(0, 0, worldWidth, worldHeight, OFFICE_TEXTURES.floor).setOrigin(0).setDepth(-Infinity);

    // 탑다운 3/4 시점: 발밑 y가 클수록 앞에 그려지도록 깊이를 y로 둔다
    for (const { type, positions } of furniture) {
      const key = OFFICE_TEXTURES[type];
      if (!key) throw new Error(`알 수 없는 가구 종류: ${type}`);
      for (const [x, y] of positions) this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    }

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  }

  showControlsHint() {
    const { width, height } = CONFIG.screen;
    const { ui } = CONFIG;
    const hint = addText(this, width / 2, height - ui.title.creditBottom, '방향키·WASD 또는 화면을 눌러 끌면 이동')
      .setScrollFactor(0)
      .setDepth(Infinity);
    this.tweens.add({ targets: hint, alpha: 0, delay: ui.hintDuration, duration: ui.hintFade, onComplete: () => hint.destroy() });
  }

  update() {
    this.player.move(this.controls.read());
  }
}
