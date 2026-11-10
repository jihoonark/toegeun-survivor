// 사무실 NPC 도트 (32x32, 발바닥 y = 29). NPC 데이터의 art 키로 찾는다
import { PAL } from './palette.js';
import { createCanvasTexture, rect, box, dot } from './pixel.js';

const PREFIX = 'npc-';
const SIZE = 32;

export const NPC_ART = {
  size: SIZE,
  footY: 29,
};

// 선배: 갈색 단발, 동그란 안경, 초록 가디건, 겨드랑이에 노트북
function drawSenior(ctx) {
  const o = PAL.outline;
  // 다리와 신발
  box(ctx, o, PAL.pants, 12, 23, 4, 6);
  box(ctx, o, PAL.pants, 17, 23, 4, 6);
  rect(ctx, PAL.shoe, 12, 28, 4, 1);
  rect(ctx, PAL.shoe, 17, 28, 4, 1);
  // 몸 (가디건과 흰 셔츠)
  box(ctx, o, PAL.cardigan, 9, 14, 15, 10);
  rect(ctx, PAL.shirt, 15, 15, 3, 8);
  rect(ctx, PAL.cardiganDark, 10, 22, 13, 1);
  dot(ctx, PAL.cardiganDark, 14, 18);
  dot(ctx, PAL.cardiganDark, 14, 21);
  // 왼팔
  box(ctx, o, PAL.cardigan, 6, 15, 4, 8);
  rect(ctx, PAL.skin, 7, 22, 2, 1);
  // 오른팔에 낀 노트북
  box(ctx, o, PAL.monitor, 22, 16, 7, 9);
  rect(ctx, PAL.monitorDark, 23, 23, 5, 1);
  dot(ctx, PAL.screenLight, 25, 19);
  // 머리
  box(ctx, o, PAL.skin, 10, 3, 13, 12);
  rect(ctx, PAL.skinDark, 11, 13, 11, 1);
  // 단발머리 (옆으로 내려온다)
  rect(ctx, o, 10, 2, 13, 1);
  rect(ctx, PAL.hair, 10, 3, 13, 3);
  rect(ctx, PAL.hair, 9, 4, 2, 9);
  rect(ctx, PAL.hair, 22, 4, 2, 9);
  rect(ctx, PAL.hairDark, 9, 11, 2, 2);
  rect(ctx, PAL.hairDark, 22, 11, 2, 2);
  dot(ctx, o, 8, 6);
  dot(ctx, o, 24, 6);
  // 동그란 안경
  box(ctx, o, PAL.screenLight, 11, 7, 5, 4);
  box(ctx, o, PAL.screenLight, 17, 7, 5, 4);
  rect(ctx, o, 16, 8, 1, 1);
  dot(ctx, o, 13, 9);
  dot(ctx, o, 19, 9);
  // 곤란한 웃음
  rect(ctx, o, 14, 12, 4, 1);
  dot(ctx, o, 13, 11);
}

const NPC_DRAWINGS = {
  senior: drawSenior,
};

export const npcTexture = (art) => PREFIX + art;

export function createNpcTextures(scene) {
  for (const [art, draw] of Object.entries(NPC_DRAWINGS)) {
    createCanvasTexture(scene, PREFIX + art, SIZE, SIZE, draw);
  }
}
