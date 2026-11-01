import { CONFIG } from '../config.js';

// 화면 글자는 모두 이 함수로 만든다. 한글이 픽셀 해상도에서 뭉개지지 않게 resolution을 올린다
export function addText(scene, x, y, content, { size = CONFIG.ui.bodyFontSize, color = CONFIG.colors.text, origin = 0.5 } = {}) {
  return scene.add
    .text(x, y, content, {
      fontFamily: CONFIG.ui.fontFamily,
      fontSize: `${size}px`,
      color,
      stroke: CONFIG.colors.outline,
      strokeThickness: Math.max(2, Math.round(size / 6)),
      resolution: CONFIG.ui.textResolution,
    })
    .setOrigin(origin);
}
