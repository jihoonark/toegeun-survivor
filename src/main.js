import Phaser from 'phaser';
import { CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';

const { width, height, backgroundColor } = CONFIG.screen;

const parent = document.getElementById('game');
const rotateHint = document.getElementById('rotate-hint');
const rotateText = document.getElementById('rotate-text');

// 휴대폰 주소창이 나타나거나 사라져도 실제로 보이는 영역 기준으로 계산한다
function visibleArea() {
  const vv = window.visualViewport;
  return vv
    ? { w: vv.width, h: vv.height, top: vv.offsetTop, left: vv.offsetLeft }
    : { w: window.innerWidth, h: window.innerHeight, top: 0, left: 0 };
}

// 정수배 확대값. 기본 해상도가 들어가지 않으면 0
function fitZoom({ w, h }) {
  return Math.floor(Math.min(w / width, h / height));
}

const area = visibleArea();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  width,
  height,
  backgroundColor,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: Math.max(1, fitZoom(area)),
  },
  input: {
    activePointers: CONFIG.input.activePointers,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } },
  },
  scene: [BootScene, TitleScene, GameScene, ResultScene],
});

function layout() {
  if (!game.isBooted) return;
  const a = visibleArea();
  Object.assign(parent.style, {
    width: `${a.w}px`,
    height: `${a.h}px`,
    top: `${a.top}px`,
    left: `${a.left}px`,
  });

  const zoom = fitZoom(a);
  const tooSmall = zoom < 1;
  rotateHint.hidden = !tooSmall;
  if (tooSmall) {
    // 세로 휴대폰이면 회전 안내, 그 외에는 창 크기 안내
    rotateText.textContent = a.h > a.w ? '휴대폰을 가로로 돌려주세요' : '창을 조금 더 크게 늘려주세요';
    if (game.loop.running) game.loop.sleep();
  } else {
    game.scale.setZoom(zoom);
    if (!game.loop.running) game.loop.wake();
  }
  game.scale.refresh();
}

// 게임 루프가 준비된 뒤에 배치를 시작해야 sleep/wake가 꼬이지 않는다
game.events.once(Phaser.Core.Events.READY, layout);
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', layout);
window.visualViewport?.addEventListener('resize', layout);
window.visualViewport?.addEventListener('scroll', layout);
