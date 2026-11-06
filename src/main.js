import Phaser from 'phaser';
import { CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';
import LevelUpScene from './scenes/LevelUpScene.js';
import Fullscreen from './systems/Fullscreen.js';
import SoundToggle from './systems/SoundToggle.js';

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

// 확대값. 휴대폰은 화면 표시 단위(CSS px) 하나에 실제 픽셀이 2~3개라서
// 실제 픽셀 기준으로 정수배를 정하고, CSS 크기로는 그걸 devicePixelRatio 로 나눈다
// 그래야 화면을 꽉 채우면서도 도트 한 칸이 실제 픽셀 정수 개로 선명하게 그려진다
// device 가 0이면 기본 해상도가 들어가지 않는 것
function fitZoom({ w, h }) {
  const dpr = window.devicePixelRatio || 1;
  const device = Math.floor(Math.min((w * dpr) / width, (h * dpr) / height));
  return { device, css: device / dpr };
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
    zoom: Math.max(1, fitZoom(area).css),
  },
  input: {
    activePointers: CONFIG.input.activePointers,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } },
  },
  scene: [BootScene, TitleScene, GameScene, LevelUpScene, ResultScene],
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
  // 이 게임은 가로 전용. 세로로 든 휴대폰은 들어가더라도 너무 작아서 돌려 달라고 한다
  const portraitPhone = a.h > a.w && (navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches);
  const tooSmall = zoom.device < 1 || portraitPhone;
  rotateHint.hidden = !tooSmall;
  // 세로 휴대폰이면 회전 안내(전체화면으로 가로 고정 버튼과 함께), 그 외에는 창 크기 안내
  fullscreen.setRotateMode(portraitPhone);
  if (tooSmall) {
    rotateText.textContent = portraitPhone ? '휴대폰을 가로로 돌려주세요' : '창을 조금 더 크게 늘려주세요';
    if (game.loop.running) game.loop.sleep();
  } else {
    game.scale.setZoom(zoom.css);
    if (!game.loop.running) game.loop.wake();
  }
  game.scale.refresh();
}

const fullscreen = new Fullscreen(layout);
new SoundToggle();

// 게임 루프가 준비된 뒤에 배치를 시작해야 sleep/wake가 꼬이지 않는다
game.events.once(Phaser.Core.Events.READY, layout);
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', layout);
window.visualViewport?.addEventListener('resize', layout);
window.visualViewport?.addEventListener('scroll', layout);
