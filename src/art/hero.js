// 주인공 도트 (GAME_SPEC.md 5장): 갈색 머리, 흰 셔츠, 빨간 넥타이, 남색 바지, 파란 사원증, 다크서클
// 32x32 프레임을 한 장에 모은다. 줄 = 방향(down, up, side), 칸 = idle 2프레임 + walk 4프레임
// 나중에 그린 이미지로 바꿀 때는 같은 프레임 이름(down-walk-0 등)으로 스프라이트시트를 등록하면 된다
import { PAL } from './palette.js';
import { createCanvasTexture, rect, dot, box } from './pixel.js';

export const HERO = {
  texture: 'hero',
  shadow: 'hero-shadow',
  size: 32,
  // 프레임 안에서 발바닥이 닿는 y (스프라이트 기준점)
  footY: 29,
  dirs: ['down', 'up', 'side'],
  idleFrames: 2,
  walkFrames: 4,
};

const o = PAL.outline;

// 자세: b = 상체가 내려가는 정도, lift = 다리 들기, arm = 팔 흔들기, step = 옆모습 다리 벌리기
const IDLE_POSES = [
  { b: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, step: 0 },
  { b: 1, liftL: 0, liftR: 0, armL: 0, armR: 0, step: 0 },
];
const WALK_POSES = [
  { b: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, step: 0 },
  { b: 1, liftL: 1, liftR: 0, armL: 1, armR: -1, step: 1 },
  { b: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, step: 0 },
  { b: 1, liftL: 0, liftR: 1, armL: -1, armR: 1, step: -1 },
];

function leg(ctx, x, lift, w = 5, fill = PAL.pants) {
  const bottom = 29 - lift;
  box(ctx, o, fill, x, 23, w, bottom - 23);
  rect(ctx, PAL.shoe, x, bottom - 2, w, 2);
}

function frontArm(ctx, x, y) {
  box(ctx, o, PAL.shirt, x, y, 4, 7);
  rect(ctx, PAL.skin, x + 1, y + 5, 2, 1);
}

function drawFront(ctx, p) {
  const b = p.b;
  leg(ctx, 11, p.liftL);
  leg(ctx, 16, p.liftR);
  frontArm(ctx, 7, 15 + b + p.armL);
  frontArm(ctx, 21, 15 + b + p.armR);

  // 몸통
  box(ctx, o, PAL.shirt, 10, 15 + b, 12, 10);
  rect(ctx, PAL.shirtDark, 19, 16 + b, 2, 6);
  rect(ctx, PAL.pants, 11, 22 + b, 10, 2);
  rect(ctx, PAL.pantsDark, 18, 22 + b, 3, 2);
  // 넥타이
  rect(ctx, PAL.tie, 15, 16 + b, 2, 5);
  rect(ctx, PAL.tieDark, 16, 17 + b, 1, 4);
  // 사원증 목줄과 카드
  rect(ctx, PAL.badge, 12, 16 + b, 1, 3);
  rect(ctx, PAL.badge, 14, 16 + b, 1, 3);
  box(ctx, o, PAL.badge, 11, 18 + b, 5, 5);
  rect(ctx, PAL.badgeCard, 12, 19 + b, 3, 1);
  rect(ctx, PAL.badgeDark, 12, 21 + b, 3, 1);

  // 얼굴
  box(ctx, o, PAL.skin, 9, 3 + b, 14, 13);
  rect(ctx, PAL.skinDark, 20, 9 + b, 2, 5);
  // 머리카락
  box(ctx, o, PAL.hair, 8, 1 + b, 16, 8);
  rect(ctx, PAL.hair, 9, 8 + b, 14, 1);
  rect(ctx, PAL.hairDark, 19, 2 + b, 4, 6);
  rect(ctx, PAL.hair, 10, 9 + b, 3, 1);
  rect(ctx, PAL.hair, 16, 9 + b, 4, 1);
  rect(ctx, PAL.hair, 10, 9 + b, 1, 3);
  rect(ctx, PAL.hairDark, 21, 9 + b, 1, 3);
  // 눈, 다크서클, 지친 입
  rect(ctx, o, 12, 10 + b, 2, 2);
  rect(ctx, o, 18, 10 + b, 2, 2);
  rect(ctx, PAL.darkCircle, 12, 12 + b, 2, 1);
  rect(ctx, PAL.darkCircle, 18, 12 + b, 2, 1);
  rect(ctx, PAL.mouth, 15, 13 + b, 2, 1);
}

function drawBack(ctx, p) {
  const b = p.b;
  leg(ctx, 11, p.liftL);
  leg(ctx, 16, p.liftR);
  frontArm(ctx, 7, 15 + b + p.armL);
  frontArm(ctx, 21, 15 + b + p.armR);

  box(ctx, o, PAL.shirt, 10, 15 + b, 12, 10);
  rect(ctx, PAL.shirtDark, 11, 16 + b, 2, 6);
  rect(ctx, PAL.shirtDark, 15, 17 + b, 2, 4);
  rect(ctx, PAL.pants, 11, 22 + b, 10, 2);
  rect(ctx, PAL.pantsDark, 11, 22 + b, 3, 2);
  // 뒷목에 걸린 사원증 줄
  rect(ctx, PAL.badge, 12, 16 + b, 8, 1);

  box(ctx, o, PAL.skin, 9, 3 + b, 14, 13);
  box(ctx, o, PAL.hair, 8, 1 + b, 16, 13);
  rect(ctx, PAL.hairDark, 9, 10 + b, 14, 3);
  rect(ctx, PAL.hairDark, 19, 2 + b, 4, 8);
  rect(ctx, PAL.skin, 13, 14 + b, 6, 1);
}

// 오른쪽을 보는 옆모습. 왼쪽은 좌우 반전으로 쓴다
function drawSide(ctx, p) {
  const b = p.b;
  const back = 13 - p.step * 2;
  const front = 15 + p.step * 2;
  leg(ctx, back, 0, 4, PAL.pantsDark);
  leg(ctx, front, 0, 4);

  box(ctx, o, PAL.shirt, 11, 15 + b, 10, 10);
  rect(ctx, PAL.shirtDark, 12, 16 + b, 2, 6);
  rect(ctx, PAL.pants, 12, 22 + b, 8, 2);
  rect(ctx, PAL.pantsDark, 12, 22 + b, 2, 2);
  rect(ctx, PAL.tie, 19, 16 + b, 1, 5);
  rect(ctx, PAL.badge, 17, 16 + b, 1, 2);
  box(ctx, o, PAL.badge, 15, 18 + b, 4, 5);
  rect(ctx, PAL.badgeCard, 16, 19 + b, 2, 1);

  // 팔은 다리와 반대로 앞뒤로 흔든다
  const armX = 14 - p.step;
  box(ctx, o, PAL.shirt, armX, 16 + b, 4, 7);
  rect(ctx, PAL.shirtDark, armX + 1, 16 + b, 2, 1);
  rect(ctx, PAL.skin, armX + 1, 21 + b, 2, 1);

  box(ctx, o, PAL.skin, 9, 3 + b, 14, 13);
  box(ctx, o, PAL.hair, 8, 1 + b, 15, 8);
  rect(ctx, PAL.hair, 9, 8 + b, 13, 1);
  rect(ctx, PAL.hair, 9, 9 + b, 6, 4);
  rect(ctx, PAL.hairDark, 9, 2 + b, 5, 10);
  rect(ctx, PAL.hair, 19, 9 + b, 2, 1);
  // 귀, 눈, 다크서클, 입
  rect(ctx, PAL.skinDark, 15, 10 + b, 2, 2);
  rect(ctx, o, 19, 10 + b, 1, 2);
  dot(ctx, PAL.darkCircle, 19, 12 + b);
  dot(ctx, PAL.mouth, 21, 13 + b);
}

const DRAW = { down: drawFront, up: drawBack, side: drawSide };

export function frameName(dir, kind, i) {
  return `${dir}-${kind}-${i}`;
}

export function createHeroTextures(scene) {
  const { size, dirs, idleFrames, walkFrames } = HERO;
  const cols = idleFrames + walkFrames;
  const poses = [...IDLE_POSES, ...WALK_POSES];

  const tex = createCanvasTexture(scene, HERO.texture, size * cols, size * dirs.length, (ctx) => {
    dirs.forEach((dir, row) => {
      poses.forEach((pose, col) => {
        ctx.save();
        ctx.translate(col * size, row * size);
        DRAW[dir](ctx, pose);
        ctx.restore();
      });
    });
  });

  dirs.forEach((dir, row) => {
    for (let i = 0; i < idleFrames; i++) tex.add(frameName(dir, 'idle', i), 0, i * size, row * size, size, size);
    for (let i = 0; i < walkFrames; i++) {
      tex.add(frameName(dir, 'walk', i), 0, (idleFrames + i) * size, row * size, size, size);
    }
  });

  // 발밑 그림자 (몸이 들썩여도 그림자는 바닥에 고정되도록 따로 둔다)
  createCanvasTexture(scene, HERO.shadow, 18, 5, (ctx) => {
    rect(ctx, PAL.shadow, 3, 0, 12, 5);
    rect(ctx, PAL.shadow, 0, 1, 3, 3);
    rect(ctx, PAL.shadow, 15, 1, 3, 3);
  });
}

export function createHeroAnimations(scene, { walkFrameRate, idleFrameRate }) {
  const frames = (dir, kind, count) =>
    Array.from({ length: count }, (_, i) => ({ key: HERO.texture, frame: frameName(dir, kind, i) }));
  for (const dir of HERO.dirs) {
    scene.anims.create({ key: `hero-walk-${dir}`, frames: frames(dir, 'walk', HERO.walkFrames), frameRate: walkFrameRate, repeat: -1 });
    scene.anims.create({ key: `hero-idle-${dir}`, frames: frames(dir, 'idle', HERO.idleFrames), frameRate: idleFrameRate, repeat: -1 });
  }
}
