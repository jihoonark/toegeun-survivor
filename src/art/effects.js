// 효과용 도트: 처치 시 흩날리는 종이 조각 3종, 주울 수 있는 결재 서류, 빈 무기 칸 자물쇠
import { PAL } from './palette.js';
import { createCanvasTexture, rect, box, dot } from './pixel.js';

export const EFFECT_TEXTURES = {
  paper: 'fx-paper',
  paperFrames: ['paper-0', 'paper-1', 'paper-2'],
  document: 'pickup-document',
  lock: 'ui-lock',
  // 무기별 맞힐 때 파편 (무기 데이터 hitFx.particle 키 → 프레임들)
  hit: 'fx-hit',
  hitFrames: {
    coffee: ['coffee-0', 'coffee-1'],
    spark: ['spark-0', 'spark-1'],
    receipt: ['receipt-0', 'receipt-1'],
  },
};

const HIT_CELL = 6;

// 6x6 칸 6개: 커피 방울 2, 불꽃 2, 영수증 조각 2
function drawHitBits(ctx) {
  const c = (i) => i * HIT_CELL;
  rect(ctx, PAL.coffee, c(0) + 1, 1, 3, 3);
  rect(ctx, PAL.sleeve, c(0) + 1, 1, 1, 1);
  rect(ctx, PAL.coffee, c(1) + 2, 2, 2, 2);
  rect(ctx, PAL.white, c(2) + 2, 0, 1, 5);
  rect(ctx, PAL.white, c(2) + 0, 2, 5, 1);
  rect(ctx, PAL.keyboard, c(3) + 2, 2, 2, 1);
  rect(ctx, PAL.white, c(3) + 2, 1, 1, 1);
  rect(ctx, PAL.paper, c(4) + 1, 0, 3, 6);
  rect(ctx, PAL.paperDark, c(4) + 2, 1, 1, 1);
  rect(ctx, PAL.paperDark, c(4) + 2, 3, 1, 1);
  rect(ctx, PAL.paper, c(5) + 1, 1, 4, 3);
  rect(ctx, PAL.paperDark, c(5) + 2, 2, 2, 1);
}

// 7x9 결재 서류: 글줄 두 개와 빨간 결재 도장
function drawDocument(ctx) {
  box(ctx, PAL.outline, PAL.paper, 0, 0, 7, 9);
  rect(ctx, PAL.paperDark, 2, 2, 3, 1);
  rect(ctx, PAL.paperDark, 2, 4, 3, 1);
  rect(ctx, PAL.alert, 4, 6, 2, 2);
  dot(ctx, PAL.alertDark, 5, 7);
}

// 7x8 자물쇠
function drawLock(ctx) {
  rect(ctx, PAL.keyboardDark, 2, 0, 3, 1);
  rect(ctx, PAL.keyboardDark, 1, 1, 1, 3);
  rect(ctx, PAL.keyboardDark, 5, 1, 1, 3);
  box(ctx, PAL.outline, PAL.keyboard, 0, 3, 7, 5);
  dot(ctx, PAL.outline, 3, 5);
}

const FRAME = 4;

export function createEffectTextures(scene) {
  const tex = createCanvasTexture(scene, EFFECT_TEXTURES.paper, FRAME * 3, FRAME, (ctx) => {
    // 작은 종이
    rect(ctx, PAL.paper, 0, 0, 3, 2);
    rect(ctx, PAL.paperDark, 0, 2, 3, 1);
    // 줄 그어진 종이
    rect(ctx, PAL.paper, 4, 0, 4, 3);
    rect(ctx, PAL.paperDark, 5, 1, 2, 1);
    // 빨간 알림 조각
    rect(ctx, PAL.alert, 8, 0, 2, 2);
    rect(ctx, PAL.alertDark, 9, 1, 1, 1);
  });
  EFFECT_TEXTURES.paperFrames.forEach((name, i) => tex.add(name, 0, i * FRAME, 0, FRAME, FRAME));
  createCanvasTexture(scene, EFFECT_TEXTURES.document, 7, 9, drawDocument);
  const hit = createCanvasTexture(scene, EFFECT_TEXTURES.hit, HIT_CELL * 6, HIT_CELL, drawHitBits);
  Object.values(EFFECT_TEXTURES.hitFrames).flat().forEach((name, i) => hit.add(name, 0, i * HIT_CELL, 0, HIT_CELL, HIT_CELL));
  createCanvasTexture(scene, EFFECT_TEXTURES.lock, 7, 8, drawLock);
}
