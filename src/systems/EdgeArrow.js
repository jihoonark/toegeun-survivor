import { CONFIG } from '../config.js';

// 목표(맵 좌표 x, y)가 화면 밖이면 화면 가장자리에 그쪽을 가리키는 삼각형 화살표를 그린다 (내 자리, 계단)
// a: { margin, marginTop, marginBottom, size, color } 위·아래는 HUD(멘탈·무기 칸, 승진 막대)를 피해 더 안쪽
export function drawEdgeArrow(gfx, camera, x, y, a) {
  gfx.clear();
  const view = camera.worldView;
  if (view.contains(x, y)) return;
  const { width, height } = CONFIG.screen;
  const angle = Math.atan2(y - view.centerY, x - view.centerX);
  // 화면 가운데에서 그 방향으로 가장자리까지
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tx = (width / 2 - a.margin) / Math.max(Math.abs(cos), 1e-6);
  const ty = (sin < 0 ? height / 2 - a.marginTop : height / 2 - a.marginBottom) / Math.max(Math.abs(sin), 1e-6);
  const t = Math.min(tx, ty);
  const cx = width / 2 + cos * t;
  const cy = height / 2 + sin * t;
  const s = a.size;
  const tip = (r, da) => [cx + Math.cos(angle + da) * r, cy + Math.sin(angle + da) * r];
  gfx.fillStyle(CONFIG.hud.mentalColors.outline).fillTriangle(...tip(s + 2, 0), ...tip(s + 2, 2.5), ...tip(s + 2, -2.5));
  gfx.fillStyle(a.color).fillTriangle(...tip(s, 0), ...tip(s, 2.5), ...tip(s, -2.5));
}
