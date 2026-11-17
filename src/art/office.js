// 임시 사무실 도트 (LimeZu 에셋 구매 전까지 사용). 나중에 같은 키의 이미지로 교체하면 된다
import { PAL } from './palette.js';
import { createCanvasTexture, rect, dot, box, disc, seededRandom } from './pixel.js';

export const OFFICE_TEXTURES = {
  desk: 'office-desk',
  plant: 'office-plant',
  myDesk: 'office-my-desk',
  alert: 'ui-alert',
  stairs: 'office-stairs',
};

const TILE = 16;

// 바닥 무늬 (층 데이터 theme.floor 의 pattern). 색은 { base, dark, light }
const FLOOR_PATTERNS = {
  // 카펫 타일 2x2 묶음. 타일마다 얼룩 위치를 달리해 반복이 덜 눈에 띄게 한다
  carpet(ctx, { base, dark, light }) {
    const rand = seededRandom(1700);
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        const ox = tx * TILE;
        const oy = ty * TILE;
        rect(ctx, base, ox, oy, TILE, TILE);
        // 타일 이음매
        rect(ctx, dark, ox, oy + TILE - 1, TILE, 1);
        rect(ctx, dark, ox + TILE - 1, oy, 1, TILE);
        for (let i = 0; i < 6; i++) {
          const x = ox + 1 + Math.floor(rand() * (TILE - 3));
          const y = oy + 1 + Math.floor(rand() * (TILE - 3));
          dot(ctx, rand() < 0.5 ? light : dark, x, y);
        }
      }
    }
  },
  // 반들반들한 큰 바닥 타일 (32x32 한 장): 굵은 줄눈과 대각선 반사광
  tile(ctx, { base, dark, light }) {
    const size = TILE * 2;
    rect(ctx, base, 0, 0, size, size);
    rect(ctx, dark, 0, size - 1, size, 1);
    rect(ctx, dark, size - 1, 0, 1, size);
    for (let i = 0; i < 6; i++) dot(ctx, light, 4 + i, 9 - i);
    for (let i = 0; i < 3; i++) dot(ctx, light, 6 + i, 13 - i);
  },
};

// 층마다 바닥 그림 하나 (처음 쓸 때 만든다)
export function floorTexture(scene, floorId, spec) {
  const key = `floor-${floorId}`;
  if (!scene.textures.exists(key)) {
    const draw = FLOOR_PATTERNS[spec.pattern];
    if (!draw) throw new Error(`알 수 없는 바닥 무늬: ${spec.pattern}`);
    createCanvasTexture(scene, key, TILE * 2, TILE * 2, (ctx) => draw(ctx, spec));
  }
  return key;
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

// 내 책상: 보통 책상에 모니터 옆 포스트잇, 앞판에 하얀 이름표
function drawMyDesk(ctx) {
  drawDesk(ctx);
  const o = PAL.outline;
  // 모니터 가장자리 포스트잇 3장
  rect(ctx, PAL.labelYellow, 33, 1, 3, 3);
  rect(ctx, PAL.capOrange, 33, 5, 3, 3);
  rect(ctx, PAL.labelYellow, 12, 2, 3, 3);
  // 앞판 이름표
  box(ctx, o, PAL.white, 9, 23, 14, 5);
  rect(ctx, PAL.keyboardDark, 11, 25, 10, 1);
}

// 32x32 내려가는 계단: 바닥에 뚫린 계단 입구, 노란 안전선, 위에 초록 비상구 표지 "↓"
function drawStairs(ctx) {
  const o = PAL.outline;
  // 비상구 표지
  box(ctx, o, PAL.exitGreen, 9, 0, 14, 8);
  rect(ctx, PAL.white, 15, 2, 2, 3);
  rect(ctx, PAL.white, 13, 4, 6, 1);
  rect(ctx, PAL.white, 14, 5, 4, 1);
  dot(ctx, PAL.white, 15, 6);
  dot(ctx, PAL.white, 16, 6);
  // 계단 입구 (안쪽으로 갈수록 어두운 계단 4칸)
  box(ctx, o, PAL.stairDark, 2, 10, 28, 21);
  const steps = [PAL.stair, PAL.stairMid, PAL.stairShade, PAL.stairDark];
  steps.forEach((color, i) => {
    rect(ctx, color, 3, 26 - i * 4, 26, 4);
    rect(ctx, PAL.stairShade, 3, 26 - i * 4, 26, 1);
  });
  // 노란·검은 안전선 테두리
  for (let x = 2; x < 30; x += 4) {
    rect(ctx, PAL.labelYellow, x, 10, 2, 1);
    rect(ctx, PAL.labelYellow, x, 30, 2, 1);
  }
}

// 9x9 빨간 알림 배지 "!"
function drawAlert(ctx) {
  disc(ctx, 4, 4, 4, () => PAL.outline);
  disc(ctx, 4, 4, 3, (dx, dy) => (dx + dy > 2 ? PAL.alertDark : PAL.alert));
  rect(ctx, PAL.white, 4, 2, 1, 3);
  dot(ctx, PAL.white, 4, 6);
}

// 16x24 화분: 잎 덩어리 몇 개를 겹쳐 그린 뒤 화분을 얹는다
function drawPlant(ctx) {
  const o = PAL.outline;
  const blobs = [
    [8, 8, 5],
    [4, 11, 3],
    [11, 11, 3],
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
  createCanvasTexture(scene, OFFICE_TEXTURES.desk, 48, 32, drawDesk);
  createCanvasTexture(scene, OFFICE_TEXTURES.plant, 16, 24, drawPlant);
  createCanvasTexture(scene, OFFICE_TEXTURES.myDesk, 48, 32, drawMyDesk);
  createCanvasTexture(scene, OFFICE_TEXTURES.alert, 9, 9, drawAlert);
  createCanvasTexture(scene, OFFICE_TEXTURES.stairs, 32, 32, drawStairs);
}
