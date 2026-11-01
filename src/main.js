import Phaser from 'phaser';
import { CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';

const { width, height, minZoom, backgroundColor } = CONFIG.screen;

// 창 크기에 맞는 정수배 확대값. 기본 해상도보다 작은 화면만 소수 배율로 줄인다
function fitZoom() {
  const raw = Math.min(window.innerWidth / width, window.innerHeight / height);
  if (raw >= 1) return Math.floor(raw);
  return Math.max(minZoom, raw);
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width,
  height,
  backgroundColor,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: fitZoom(),
  },
  input: {
    activePointers: 2,
  },
  scene: [BootScene, TitleScene, GameScene],
});

function onResize() {
  game.scale.setZoom(fitZoom());
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
