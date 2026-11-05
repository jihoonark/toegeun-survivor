// 투사체 도트. 무기 데이터의 projectile 키로 찾는다. 없는 키는 기본 투사체를 쓴다
import { PAL } from './palette.js';
import { createCanvasTexture, rect, box } from './pixel.js';

const PREFIX = 'projectile-';
const DEFAULT_KEY = `${PREFIX}default`;

// 8x11 테이크아웃 아메리카노 컵: 흰 뚜껑, 컵, 갈색 홀더
function drawAmericano(ctx) {
  const o = PAL.outline;
  box(ctx, o, PAL.paper, 1, 2, 6, 9);
  rect(ctx, PAL.paperDark, 5, 3, 1, 7);
  rect(ctx, PAL.sleeve, 2, 5, 4, 3);
  rect(ctx, PAL.sleeveDark, 5, 5, 1, 3);
  box(ctx, o, PAL.paper, 0, 0, 8, 3);
  rect(ctx, PAL.paperDark, 1, 1, 6, 1);
}

// 9x5 스테이플러 심: 오른쪽을 향한 ㄷ자 철심 (날아가는 방향을 바라본다)
function drawStaple(ctx) {
  const o = PAL.outline;
  rect(ctx, o, 0, 0, 9, 5);
  rect(ctx, PAL.keyboard, 1, 1, 7, 1);
  rect(ctx, PAL.keyboardDark, 1, 3, 7, 1);
  rect(ctx, PAL.keyboard, 7, 1, 1, 3);
  rect(ctx, o, 1, 2, 6, 1);
}

function drawDefault(ctx) {
  box(ctx, PAL.outline, PAL.paper, 0, 0, 6, 6);
  rect(ctx, PAL.paperDark, 3, 3, 2, 2);
}

// 12x8 법인카드: 파란 바탕과 짙은 아래쪽, 금색 칩. 로고·상표 없이 카드 형태만 쓴다
function drawCorporateCard(ctx) {
  box(ctx, PAL.outline, PAL.badge, 0, 0, 12, 8);
  rect(ctx, PAL.badgeDark, 1, 5, 10, 2);
  rect(ctx, PAL.sleeve, 2, 2, 3, 3);
  rect(ctx, PAL.sleeveDark, 2, 4, 3, 1);
  rect(ctx, PAL.paper, 7, 2, 3, 1);
  rect(ctx, PAL.paperDark, 7, 3, 2, 1);
}

const PROJECTILES = {
  americano: { width: 8, height: 11, draw: drawAmericano },
  'corporate-card': { width: 12, height: 8, draw: drawCorporateCard },
  staple: { width: 9, height: 5, draw: drawStaple },
};

export function projectileTexture(scene, id) {
  const key = PREFIX + id;
  return scene.textures.exists(key) ? key : DEFAULT_KEY;
}

export function createProjectileTextures(scene) {
  createCanvasTexture(scene, DEFAULT_KEY, 6, 6, drawDefault);
  for (const [id, { width, height, draw }] of Object.entries(PROJECTILES)) {
    createCanvasTexture(scene, PREFIX + id, width, height, draw);
  }
}
