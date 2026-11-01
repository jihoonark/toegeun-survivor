// 몬스터 도트 (32x32, 발바닥 y = 29). 적 데이터의 art 키로 찾고, 없는 키는 기본 몬스터를 쓴다
import { PAL } from './palette.js';
import { createCanvasTexture, rect, dot, box, disc } from './pixel.js';

const PREFIX = 'enemy-';
const DEFAULT_KEY = `${PREFIX}default`;
const SIZE = 32;

export const ENEMY_ART = {
  size: SIZE,
  footY: 29,
};

// 이메일 몬스터: 하얀 편지봉투, 화난 빨간 눈과 눈썹, 주황 발, 머리 위 빨간 알림 배지 "1"
function drawEmail(ctx) {
  const o = PAL.outline;

  // 발
  box(ctx, o, PAL.foot, 8, 26, 6, 4);
  box(ctx, o, PAL.foot, 18, 26, 6, 4);
  rect(ctx, PAL.footDark, 9, 28, 4, 1);
  rect(ctx, PAL.footDark, 19, 28, 4, 1);

  // 봉투 몸통
  box(ctx, o, PAL.paper, 4, 11, 24, 17);
  rect(ctx, PAL.paperDark, 5, 25, 22, 2);
  rect(ctx, PAL.paperDark, 25, 12, 2, 13);

  // 봉투 덮개 V자
  for (let i = 0; i <= 10; i++) {
    const y = 12 + Math.floor(i * 0.4);
    dot(ctx, o, 5 + i, y);
    dot(ctx, o, 26 - i, y);
  }

  // 화난 눈썹 (가운데로 내려간다)
  const brows = [
    [7, 16], [8, 16], [9, 17], [10, 17], [11, 18], [12, 18],
  ];
  for (const [x, y] of brows) {
    dot(ctx, o, x, y);
    dot(ctx, o, 31 - x, y);
  }

  // 빨간 눈
  box(ctx, o, PAL.alert, 8, 19, 6, 4);
  box(ctx, o, PAL.alert, 18, 19, 6, 4);
  rect(ctx, PAL.alertDark, 9, 21, 4, 1);
  rect(ctx, PAL.alertDark, 19, 21, 4, 1);
  rect(ctx, o, 11, 20, 2, 1);
  rect(ctx, o, 19, 20, 2, 1);

  // 찌푸린 입
  rect(ctx, o, 13, 24, 6, 1);
  dot(ctx, o, 12, 25);
  dot(ctx, o, 19, 25);

  // 알림 배지 "1"
  disc(ctx, 26, 8, 4, () => o);
  disc(ctx, 26, 8, 3, (dx, dy) => (dx + dy > 2 ? PAL.alertDark : PAL.alert));
  rect(ctx, PAL.white, 26, 6, 1, 5);
  dot(ctx, PAL.white, 25, 7);
  rect(ctx, PAL.white, 25, 10, 3, 1);
}

// 그림이 없는 몬스터용: 빨간 덩어리
function drawDefault(ctx) {
  const o = PAL.outline;
  disc(ctx, 16, 21, 8, () => o);
  disc(ctx, 16, 21, 7, (dx, dy) => (dx + dy > 4 ? PAL.alertDark : PAL.alert));
  rect(ctx, o, 12, 19, 2, 2);
  rect(ctx, o, 18, 19, 2, 2);
}

const ENEMY_DRAWINGS = {
  email: drawEmail,
};

export function enemyTexture(scene, art) {
  const key = PREFIX + art;
  return scene.textures.exists(key) ? key : DEFAULT_KEY;
}

export function createEnemyTextures(scene) {
  createCanvasTexture(scene, DEFAULT_KEY, SIZE, SIZE, drawDefault);
  for (const [art, draw] of Object.entries(ENEMY_DRAWINGS)) {
    createCanvasTexture(scene, PREFIX + art, SIZE, SIZE, draw);
  }
}
