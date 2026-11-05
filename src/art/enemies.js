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

// 화난 눈썹·빨간 눈·찌푸린 입 (이메일과 같은 얼굴). cx: 얼굴 가운데 x, y: 눈썹 위치
function drawAngryFace(ctx, cx, y) {
  const o = PAL.outline;
  for (const [dx, dy] of [[-9, 0], [-8, 0], [-7, 1], [-6, 1], [-5, 2], [-4, 2]]) {
    dot(ctx, o, cx + dx, y + dy);
    dot(ctx, o, cx - 1 - dx, y + dy);
  }
  box(ctx, o, PAL.alert, cx - 8, y + 3, 6, 4);
  box(ctx, o, PAL.alert, cx + 2, y + 3, 6, 4);
  rect(ctx, PAL.alertDark, cx - 7, y + 5, 4, 1);
  rect(ctx, PAL.alertDark, cx + 3, y + 5, 4, 1);
  rect(ctx, o, cx - 5, y + 4, 2, 1);
  rect(ctx, o, cx + 3, y + 4, 2, 1);
  rect(ctx, o, cx - 3, y + 8, 6, 1);
  dot(ctx, o, cx - 4, y + 9);
  dot(ctx, o, cx + 3, y + 9);
}

function drawFeet(ctx, leftX, rightX) {
  const o = PAL.outline;
  box(ctx, o, PAL.foot, leftX, 26, 6, 4);
  box(ctx, o, PAL.foot, rightX, 26, 6, 4);
  rect(ctx, PAL.footDark, leftX + 1, 28, 4, 1);
  rect(ctx, PAL.footDark, rightX + 1, 28, 4, 1);
}

// 최종_진짜최종.pptx: 오른쪽 위가 접힌 발표 자료 파일. 주황 머리띠에 흰 "P"
// (같은 그림을 크기만 바꿔 최종 → 최종2 → 진짜최종 으로 쓴다)
function drawPptx(ctx) {
  const o = PAL.outline;
  drawFeet(ctx, 8, 18);
  box(ctx, o, PAL.paper, 5, 3, 22, 25);
  rect(ctx, PAL.paperDark, 6, 25, 20, 2);
  // 접힌 귀퉁이
  ctx.clearRect(21, 3, 6, 6);
  for (let i = 0; i < 6; i++) dot(ctx, o, 21 + i, 3 + i);
  rect(ctx, o, 21, 3, 1, 6);
  rect(ctx, o, 21, 8, 6, 1);
  for (let i = 1; i < 5; i++) rect(ctx, PAL.paperDark, 22, 3 + i, i, 1);
  // 주황 머리띠와 "P"
  rect(ctx, PAL.slide, 6, 9, 20, 5);
  rect(ctx, PAL.slideDark, 6, 13, 20, 1);
  rect(ctx, PAL.white, 8, 10, 1, 3);
  rect(ctx, PAL.white, 9, 10, 2, 1);
  rect(ctx, PAL.white, 9, 11, 2, 1);
  dot(ctx, PAL.white, 11, 10);
  drawAngryFace(ctx, 16, 15);
}

// "오늘까지 되죠?": 빨간 말풍선이 달려온다. 머리 위에 느낌표 두 개
function drawDeadline(ctx) {
  const o = PAL.outline;
  drawFeet(ctx, 8, 18);
  box(ctx, o, PAL.alert, 4, 9, 24, 17);
  rect(ctx, PAL.alertDark, 5, 23, 22, 2);
  rect(ctx, PAL.alertDark, 25, 10, 2, 13);
  // 말풍선 꼬리
  rect(ctx, o, 22, 26, 4, 1);
  rect(ctx, PAL.alert, 23, 25, 2, 1);
  // 느낌표 두 개
  for (const x of [13, 18]) {
    rect(ctx, o, x - 1, 0, 3, 7);
    rect(ctx, PAL.white, x, 1, 1, 4);
    rect(ctx, o, x - 1, 7, 3, 1);
    dot(ctx, PAL.white, x, 7);
  }
  // 얼굴은 흰 눈으로 (빨간 몸 위라서)
  for (const [dx, dy] of [[-9, 0], [-8, 0], [-7, 1], [-6, 1], [-5, 2], [-4, 2]]) {
    dot(ctx, o, 16 + dx, 12 + dy);
    dot(ctx, o, 15 - dx, 12 + dy);
  }
  box(ctx, o, PAL.white, 8, 15, 6, 4);
  box(ctx, o, PAL.white, 18, 15, 6, 4);
  rect(ctx, o, 11, 16, 2, 2);
  rect(ctx, o, 19, 16, 2, 2);
  // 억지 미소
  rect(ctx, o, 12, 21, 8, 1);
  dot(ctx, o, 11, 20);
  dot(ctx, o, 20, 20);
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
  pptx: drawPptx,
  deadline: drawDeadline,
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
