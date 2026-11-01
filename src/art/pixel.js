// 코드로 도트 이미지를 그리는 기본 도구.
// 모든 그리기는 정수 좌표의 픽셀 단위로 해서 안티앨리어싱 색이 섞이지 않게 한다

export function createCanvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, width, height);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  tex.refresh();
  return tex;
}

export function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function dot(ctx, color, x, y) {
  rect(ctx, color, x, y, 1, 1);
}

// 외곽선 1px을 두른 사각형
export function box(ctx, outline, fill, x, y, w, h) {
  rect(ctx, outline, x, y, w, h);
  rect(ctx, fill, x + 1, y + 1, w - 2, h - 2);
}

// 픽셀 원. pick(dx, dy)가 색을 돌려주면 그 색으로, null이면 건너뛴다
export function disc(ctx, cx, cy, r, pick) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r * 0.8) continue;
      const color = pick(dx, dy);
      if (color) dot(ctx, color, cx + dx, cy + dy);
    }
  }
}

// 항상 같은 결과를 내는 난수 (바닥 무늬가 실행할 때마다 바뀌지 않게)
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
