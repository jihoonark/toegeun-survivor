import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import { requestFullscreen } from '../systems/Fullscreen.js';
import { music } from '../systems/Music.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    // 브라우저는 첫 클릭·터치 전까지 소리를 막아 두므로, 누르는 순간부터 들린다
    music.use(this).play('title');
    const { width, height } = CONFIG.screen;
    const { ui, colors } = CONFIG;
    const layout = ui.title;

    addText(this, width / 2, height * layout.nameY, '퇴근 서바이버', { size: ui.titleFontSize, color: colors.accent });
    addText(this, width / 2, height * layout.subtitleY, '17:00 → 18:00, 칼퇴를 노려라', { color: colors.textDim });

    const prompt = addText(this, width / 2, height * layout.promptY, '화면을 누르거나 아무 키나 눌러 시작');
    this.tweens.add({ targets: prompt, alpha: ui.blinkMinAlpha, duration: ui.blinkDuration, yoyo: true, repeat: -1 });

    // 에셋 출처 표기 자리 (GAME_SPEC.md 5장). 구매 에셋을 쓰기 전까지는 임시 문구
    addText(this, width / 2, height - layout.creditBottom, '임시 그래픽: 코드로 그린 도트', {
      size: ui.smallFontSize,
      color: colors.textDim,
    });

    const start = () => this.scene.start('Game');
    // 손을 뗄 때 시작한다. 브라우저는 터치를 뗀 순간에만 전체화면을 허락한다
    this.input.once('pointerup', (pointer) => {
      if (pointer.wasTouch && CONFIG.fullscreen.autoOnTouchStart) requestFullscreen();
      start();
    });
    this.input.keyboard?.once('keydown', start);
  }
}
