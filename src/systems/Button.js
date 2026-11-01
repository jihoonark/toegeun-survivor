import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from './Text.js';

const toColor = (hex) => Phaser.Display.Color.HexStringToColor(hex).color;

// 누를 수 있는 글자 버튼 (마우스·터치 공용)
export function addButton(scene, x, y, label, onClick, { width, height } = CONFIG.result.button) {
  const { colors, ui } = CONFIG;
  const fill = toColor(colors.accent);
  const hover = toColor(colors.buttonHover);
  const box = scene.add.rectangle(x, y, width, height, fill).setStrokeStyle(ui.bodyStroke, toColor(colors.outline));
  const text = addText(scene, x, y, label, { color: CONFIG.colors.outline, stroke: 0 });

  // 버튼 위에서 누르고 버튼 위에서 뗀 경우에만 실행한다
  // (다른 곳에서 누르던 손가락을 버튼 위에서 떼는 것만으로는 눌리지 않게)
  let pressed = false;
  box.setInteractive({ useHandCursor: true });
  box.on('pointerover', () => box.setFillStyle(hover));
  box.on('pointerout', () => {
    pressed = false;
    box.setFillStyle(fill);
  });
  box.on('pointerdown', () => (pressed = true));
  box.on('pointerup', () => {
    if (!pressed) return;
    pressed = false;
    onClick();
  });
  return { box, text };
}
