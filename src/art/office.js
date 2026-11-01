// 임시 사무실 도트 (LimeZu 에셋 구매 전까지 사용). 나중에 같은 키의 이미지로 교체하면 된다
import { PAL } from './palette.js';
import { createCanvasTexture, rect, dot, box, disc, seededRandom } from './pixel.js';

export const OFFICE_TEXTURES = {
  floor: 'office-floor',
  desk: 'office-desk',
  plant: 'office-plant',
};

const TILE = 16;

// 카펫 타일 2x2 묶음. 타일마다 얼룩 위치를 달리해 반복이 덜 눈에 띄게 한다
function drawFloor(ctx) {
  const rand = seededRandom(1700);
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const ox = tx * TILE;
      const oy = ty * TILE;
      rect(ctx, PAL.carpet, ox, oy, TILE, TILE);
      // 타일 이음매
      rect(ctx, PAL.carpetDark, ox, oy + TILE - 1, TILE, 1);
      rect(ctx, PAL.carpetDark, ox + TILE - 1, oy, 1, TILE);
      for (let i = 0; i < 6; i++) {
        const x = ox + 1 + Math.floor(rand() * (TILE - 3));
        const y = oy + 1 + Math.floor(rand() * (TILE - 3));
        dot(ctx, rand() < 0.5 ? PAL.carpetLight : PAL.carpetDark, x, y);
      }
    }
  }
}

// 48x32 책상: 모니터, 키보드, 서류 더미, 아메리카노 컵
function drawDesk(ctx) {
  const o = PAL.outline;

  // 발밑 그림자
  rect(ctx, PAL.shadow, 2, 29, 44, 3);

  // 앞판
  box(ctx, o, PAL.woodPanel, 1, 20, 46, 10);
  rect(ctx, PAL.woodDark, 2, 21, 44, 1);
  // 서랍 손잡이
  rect(ctx, PAL.woodDark, 34, 24, 8, 1);

  // 상판
  box(ctx, o, PAL.wood, 0, 9, 48, 13);
  rect(ctx, PAL.woodDark, 1, 20, 46, 1);

  // 모니터 받침과 화면
  rect(ctx, o, 21, 9, 6, 4);
  rect(ctx, PAL.monitorDark, 22, 9, 4, 3);
  box(ctx, o, PAL.monitor, 13, 0, 22, 11);
  rect(ctx, PAL.screen, 15, 2, 18, 7);
  rect(ctx, PAL.screenLight, 16, 3, 5, 1);
  rect(ctx, PAL.screenLight, 16, 4, 2, 1);
  rect(ctx, PAL.monitorDark, 14, 9, 20, 1);

  // 키보드
  box(ctx, o, PAL.keyboard, 16, 13, 16, 4);
  rect(ctx, PAL.keyboardDark, 17, 15, 14, 1);

  // 서류 더미
  box(ctx, o, PAL.paper, 3, 11, 9, 7);
  rect(ctx, PAL.paperDark, 4, 16, 7, 1);
  rect(ctx, PAL.paperDark, 5, 13, 5, 1);

  // 아메리카노 컵
  box(ctx, o, PAL.paper, 38, 12, 5, 6);
  rect(ctx, PAL.coffee, 39, 13, 3, 1);
  rect(ctx, PAL.paperDark, 41, 14, 1, 3);
  dot(ctx, o, 43, 14);
  dot(ctx, o, 43, 15);
}

// 16x24 화분: 잎 덩어리 몇 개를 겹쳐 그린 뒤 화분을 얹는다
function drawPlant(ctx) {
  const o = PAL.outline;
  const blobs = [
    [8, 8, 5],
    [4, 11, 3],
    [12, 11, 3],
    [8, 4, 3],
  ];

  rect(ctx, PAL.shadow, 3, 22, 10, 2);

  // 외곽선을 먼저 크게 칠하고 안쪽을 덮는다
  for (const [cx, cy, r] of blobs) disc(ctx, cx, cy, r + 1, () => o);
  for (const [cx, cy, r] of blobs) {
    disc(ctx, cx, cy, r, (dx, dy) => {
      if (dx + dy > r * 0.6) return PAL.leafDark;
      if (dx + dy < -r * 0.9) return PAL.leafLight;
      return PAL.leaf;
    });
  }

  // 화분
  box(ctx, o, PAL.pot, 3, 14, 10, 3);
  box(ctx, o, PAL.pot, 4, 16, 8, 7);
  rect(ctx, PAL.potDark, 9, 17, 2, 5);
  rect(ctx, PAL.potDark, 4, 15, 8, 1);
}

export function createOfficeTextures(scene) {
  createCanvasTexture(scene, OFFICE_TEXTURES.floor, TILE * 2, TILE * 2, drawFloor);
  createCanvasTexture(scene, OFFICE_TEXTURES.desk, 48, 32, drawDesk);
  createCanvasTexture(scene, OFFICE_TEXTURES.plant, 16, 24, drawPlant);
}
