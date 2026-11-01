import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';

// 1단계: 세팅 확인용 화면. 다음 단계에서 사무실 바닥과 주인공이 들어온다
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = CONFIG.screen;
    addText(this, width / 2, height / 2 - 10, '게임 화면 (준비 중)');
    this.info = addText(this, width / 2, height / 2 + 12, '', { size: CONFIG.ui.smallFontSize, color: CONFIG.colors.textDim });
    this.input.on('pointerdown', (p) => this.showInput(`터치 ${Math.round(p.x)}, ${Math.round(p.y)}`));
    this.input.keyboard?.on('keydown', (e) => this.showInput(`키 ${e.key}`));
    this.scale.on('resize', () => this.showInput());
    this.showInput();
  }

  showInput(last = '') {
    const zoom = this.scale.zoom;
    const z = Number.isInteger(zoom) ? zoom : zoom.toFixed(2);
    this.info.setText(`확대 ${z}배${last ? ` · 마지막 입력: ${last}` : ''}`);
  }
}
