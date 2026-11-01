import { CONFIG } from '../config.js';

const { ui, colors } = CONFIG;

// 글자 크기별 기본 외곽선 두께
function strokeFor(size) {
  if (size >= ui.titleFontSize) return ui.titleStroke;
  if (size >= ui.bodyFontSize) return ui.bodyStroke;
  return ui.smallStroke;
}

// 화면 글자는 모두 이 함수로 만든다
export function addText(scene, x, y, content, { size = ui.bodyFontSize, color = colors.text, origin = 0.5 } = {}) {
  return scene.add
    .text(x, y, content, {
      fontFamily: ui.fontFamily,
      fontSize: `${size}px`,
      color,
      stroke: colors.outline,
      strokeThickness: strokeFor(size),
    })
    .setOrigin(origin);
}
