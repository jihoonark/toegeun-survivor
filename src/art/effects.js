// 효과용 도트: 처치 시 흩날리는 종이 조각 3종, 주울 수 있는 결재 서류, 빈 무기 칸 자물쇠
import { PAL } from './palette.js';
import { createCanvasTexture, rect, box, dot } from './pixel.js';

export const EFFECT_TEXTURES = {
  paper: 'fx-paper',
  paperFrames: ['paper-0', 'paper-1', 'paper-2'],
  document: 'pickup-document',
  bomb: 'pickup-bomb',
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

// 회사 혜택 그림 (src/data/benefits.js art 키 → 그림 이름)
export const BENEFIT_ART = {
  envelope: 'benefit-envelope',
  bonus: 'benefit-bonus',
  holiday: 'benefit-holiday',
  welfareCard: 'benefit-welfare',
  mealTicket: 'benefit-meal',
};

// 11x8 월급봉투: 누런 봉투에 초록 띠
function drawEnvelope(ctx) {
  box(ctx, PAL.outline, PAL.envelope, 0, 0, 11, 8);
  rect(ctx, PAL.envelopeDark, 1, 1, 1, 1);
  rect(ctx, PAL.envelopeDark, 2, 2, 2, 1);
  rect(ctx, PAL.envelopeDark, 4, 3, 3, 1);
  rect(ctx, PAL.envelopeDark, 7, 2, 2, 1);
  rect(ctx, PAL.envelopeDark, 9, 1, 1, 1);
  rect(ctx, PAL.leaf, 1, 5, 9, 1);
}

// 10x11 성과급: 노란 돈자루
function drawBonus(ctx) {
  const o = PAL.outline;
  rect(ctx, o, 3, 0, 4, 1);
  rect(ctx, o, 4, 1, 2, 2);
  rect(ctx, PAL.postitDark, 4, 1, 2, 1);
  rect(ctx, o, 1, 3, 8, 1);
  rect(ctx, o, 0, 4, 1, 6);
  rect(ctx, o, 9, 4, 1, 6);
  rect(ctx, o, 1, 10, 8, 1);
  rect(ctx, PAL.labelYellow, 1, 4, 8, 6);
  rect(ctx, PAL.postitDark, 1, 8, 8, 2);
  rect(ctx, PAL.leafDark, 4, 5, 2, 1);
  rect(ctx, PAL.leafDark, 4, 6, 1, 1);
  rect(ctx, PAL.leafDark, 4, 7, 2, 1);
}

// 10x10 명절 상여: 빨간 선물 상자에 노란 리본
function drawHoliday(ctx) {
  box(ctx, PAL.outline, PAL.alert, 0, 2, 10, 8);
  rect(ctx, PAL.alertDark, 1, 8, 8, 1);
  rect(ctx, PAL.labelYellow, 4, 3, 2, 6);
  rect(ctx, PAL.labelYellow, 1, 5, 8, 1);
  rect(ctx, PAL.labelYellow, 2, 0, 2, 2);
  rect(ctx, PAL.labelYellow, 6, 0, 2, 2);
}

// 11x7 복지포인트: 파란 카드에 흰 줄
function drawWelfare(ctx) {
  box(ctx, PAL.outline, PAL.badge, 0, 0, 11, 7);
  rect(ctx, PAL.badgeDark, 1, 2, 9, 1);
  rect(ctx, PAL.badgeCard, 2, 4, 3, 1);
  rect(ctx, PAL.labelYellow, 7, 4, 2, 1);
}

// 11x7 식대 쿠폰: 주황 쿠폰, 양 옆 홈
function drawMeal(ctx) {
  box(ctx, PAL.outline, PAL.foot, 0, 0, 11, 7);
  rect(ctx, PAL.outline, 0, 3, 1, 1);
  rect(ctx, PAL.outline, 10, 3, 1, 1);
  rect(ctx, PAL.paper, 3, 2, 5, 1);
  rect(ctx, PAL.footDark, 3, 4, 5, 1);
}

const FRAME = 4;

// 14x14 "전체 회신 폭탄": 빨간 편지봉투에 노란 "전체" 띠, 위로 심지와 불꽃
function drawBomb(ctx) {
  const o = PAL.outline;
  rect(ctx, PAL.shadow, 2, 12, 11, 2);
  box(ctx, o, PAL.alert, 1, 5, 13, 8);
  // 봉투 접힌 선
  rect(ctx, PAL.alertDark, 2, 6, 1, 1);
  rect(ctx, PAL.alertDark, 3, 7, 2, 1);
  rect(ctx, PAL.alertDark, 5, 8, 5, 1);
  rect(ctx, PAL.alertDark, 10, 7, 2, 1);
  rect(ctx, PAL.alertDark, 12, 6, 1, 1);
  rect(ctx, PAL.labelYellow, 2, 10, 11, 1);
  // 심지와 불꽃
  rect(ctx, o, 11, 2, 1, 3);
  rect(ctx, o, 12, 1, 1, 1);
  dot(ctx, PAL.labelYellow, 13, 0);
  dot(ctx, PAL.capOrange, 12, 0);
  dot(ctx, PAL.capOrange, 13, 1);
}

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
  createCanvasTexture(scene, EFFECT_TEXTURES.bomb, 14, 14, drawBomb);
  const hit = createCanvasTexture(scene, EFFECT_TEXTURES.hit, HIT_CELL * 6, HIT_CELL, drawHitBits);
  Object.values(EFFECT_TEXTURES.hitFrames).flat().forEach((name, i) => hit.add(name, 0, i * HIT_CELL, 0, HIT_CELL, HIT_CELL));
  createCanvasTexture(scene, EFFECT_TEXTURES.lock, 7, 8, drawLock);
  createCanvasTexture(scene, BENEFIT_ART.envelope, 11, 8, drawEnvelope);
  createCanvasTexture(scene, BENEFIT_ART.bonus, 10, 11, drawBonus);
  createCanvasTexture(scene, BENEFIT_ART.holiday, 10, 10, drawHoliday);
  createCanvasTexture(scene, BENEFIT_ART.welfareCard, 11, 7, drawWelfare);
  createCanvasTexture(scene, BENEFIT_ART.mealTicket, 11, 7, drawMeal);
}
