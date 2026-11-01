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

  box.setInteractive({ useHandCursor: true });
  box.on('pointerover', () => box.setFillStyle(hover));
  box.on('pointerout', () => box.setFillStyle(fill));
  box.on('pointerup', onClick);
  return { box, text };
}
