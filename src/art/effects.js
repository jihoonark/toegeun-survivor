// 효과용 도트: 처치 시 흩날리는 종이 조각 3종
import { PAL } from './palette.js';
import { createCanvasTexture, rect } from './pixel.js';

export const EFFECT_TEXTURES = {
  paper: 'fx-paper',
  paperFrames: ['paper-0', 'paper-1', 'paper-2'],
};

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
}
