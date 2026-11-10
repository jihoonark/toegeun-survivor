// 아이템 아이콘 도트 (12x12). 아이템 데이터의 icon 키로 찾고, 없는 키는 물음표 상자를 쓴다
import { PAL } from './palette.js';
import { createCanvasTexture, rect, box, dot } from './pixel.js';

const PREFIX = 'item-';
const DEFAULT_KEY = `${PREFIX}default`;
const SIZE = 12;

// 자양강장제: 작은 갈색 유리병, 노란 라벨에 번개
function drawEnergyDrink(ctx) {
  const o = PAL.outline;
  box(ctx, o, PAL.capGold, 4, 0, 4, 2);
  box(ctx, o, PAL.bottle, 4, 2, 4, 2);
  box(ctx, o, PAL.bottle, 2, 3, 8, 9);
  rect(ctx, PAL.bottleDark, 8, 4, 1, 7);
  rect(ctx, PAL.labelYellow, 3, 6, 6, 4);
  // 번개
  dot(ctx, PAL.alert, 6, 6);
  rect(ctx, PAL.alert, 5, 7, 2, 1);
  dot(ctx, PAL.alert, 5, 8);
  dot(ctx, PAL.alert, 4, 9);
  rect(ctx, PAL.white, 3, 4, 1, 2);
}

// 종합비타민: 하얀 약통, 주황 뚜껑, 앞에 알약 하나
function drawMultivitamin(ctx) {
  const o = PAL.outline;
  box(ctx, o, PAL.capOrange, 1, 0, 8, 3);
  box(ctx, o, PAL.white, 1, 2, 8, 9);
  rect(ctx, PAL.paperDark, 7, 3, 1, 7);
  rect(ctx, PAL.capOrange, 2, 5, 6, 3);
  rect(ctx, PAL.white, 4, 6, 2, 1);
  // 알약
  box(ctx, o, PAL.capOrange, 7, 8, 5, 4);
  rect(ctx, PAL.labelYellow, 9, 9, 2, 2);
}

function drawDefault(ctx) {
  box(ctx, PAL.outline, PAL.paper, 1, 1, 10, 10);
  rect(ctx, PAL.outline, 4, 3, 4, 1);
  rect(ctx, PAL.outline, 7, 4, 1, 2);
  rect(ctx, PAL.outline, 5, 6, 2, 1);
  rect(ctx, PAL.outline, 5, 7, 1, 1);
  rect(ctx, PAL.outline, 5, 9, 1, 1);
}

const ITEM_DRAWINGS = {
  'energy-drink': drawEnergyDrink,
  multivitamin: drawMultivitamin,
};

export function itemTexture(scene, icon) {
  const key = PREFIX + icon;
  return scene.textures.exists(key) ? key : scene.textures.exists(icon) ? icon : DEFAULT_KEY;
}

export function createItemTextures(scene) {
  createCanvasTexture(scene, DEFAULT_KEY, SIZE, SIZE, drawDefault);
  for (const [icon, draw] of Object.entries(ITEM_DRAWINGS)) {
    createCanvasTexture(scene, PREFIX + icon, SIZE, SIZE, draw);
  }
}
