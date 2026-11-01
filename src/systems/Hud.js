import { CONFIG } from '../config.js';
import { addText } from './Text.js';

// 화면 위쪽 정보: 왼쪽 멘탈 바, 가운데 시계, 오른쪽 처리한 업무 수
export default class Hud {
  constructor(scene) {
    this.scene = scene;
    const { width } = CONFIG.screen;
    const { margin, mentalBar } = CONFIG.hud;
    const { ui } = CONFIG;
    const fix = (obj) => obj.setScrollFactor(0).setDepth(CONFIG.depth.hud);

    this.mentalLabel = fix(addText(scene, margin, margin, '멘탈', { size: ui.smallFontSize, origin: 0, stroke: ui.bodyStroke }));
    this.barX = margin + this.mentalLabel.width + mentalBar.labelGap;
    this.barY = margin + (this.mentalLabel.height - mentalBar.height) / 2;
    this.bar = fix(scene.add.graphics());

    this.clock = fix(addText(scene, width / 2, margin, '', { origin: 0 }));
    this.clock.setOrigin(0.5, 0);

    this.tasks = fix(addText(scene, width - margin, margin, '', { size: ui.smallFontSize, stroke: ui.bodyStroke }));
    this.tasks.setOrigin(1, 0);
  }

  setMental(value, max) {
    const { mentalBar: b, mentalColors: c, mentalMid, mentalLow } = CONFIG.hud;
    const ratio = Math.max(0, value / max);
    const fill = ratio <= mentalLow ? c.low : ratio <= mentalMid ? c.mid : c.high;

    this.bar.clear();
    this.bar.fillStyle(c.outline).fillRect(this.barX - 1, this.barY - 1, b.width + 2, b.height + 2);
    this.bar.fillStyle(c.back).fillRect(this.barX, this.barY, b.width, b.height);
    this.bar.fillStyle(fill).fillRect(this.barX, this.barY, Math.round(b.width * ratio), b.height);
  }

  // minutes: 시작 시각부터 지난 게임 분
  setClock(minutes) {
    const { startHour, warnMinute } = CONFIG.clock;
    const total = startHour * 60 + Math.floor(minutes);
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    this.clock.setText(`${hh}:${mm}`);
    this.clock.setColor(minutes >= warnMinute ? CONFIG.colors.accent : CONFIG.colors.text);
  }

  setTasks(count) {
    this.tasks.setText(`처리한 업무 ${count}`);
  }
}
