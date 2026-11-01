import { CONFIG } from '../config.js';
import { addText } from './Text.js';

// 시작 시각부터 지난 게임 분 → "17:42"
export function formatClock(minutes) {
  const total = CONFIG.clock.startHour * 60 + Math.floor(minutes);
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

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

    this.clockMinute = null;
    this.clockWarn = null;
    this.toasts = 0;
    scene.events.on('weapon-added', ({ weapon }) => this.showCredit(weapon));
  }

  // 시청자 무기를 얻으면 "○○님의 [무기]"를 시계 아래에 잠깐 띄운다 (GAME_SPEC.md 4장)
  showCredit(item) {
    if (!item.credit) return;
    const t = CONFIG.hud.creditToast;
    const y = CONFIG.hud.margin + t.offsetY + this.toasts * t.gap;
    const toast = addText(this.scene, CONFIG.screen.width / 2, y, `${item.credit.nickname}님의 ${item.name}`, {
      size: CONFIG.ui.smallFontSize,
      color: CONFIG.colors.accent,
      stroke: CONFIG.ui.bodyStroke,
    })
      .setScrollFactor(0)
      .setDepth(CONFIG.depth.hud);
    this.toasts++;
    this.scene.tweens.add({
      targets: toast,
      alpha: 0,
      delay: t.duration,
      duration: t.fade,
      onComplete: () => {
        toast.destroy();
        this.toasts--;
      },
    });
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

  // minutes: 시작 시각부터 지난 게임 분. 글자는 분이 바뀔 때만 다시 그린다
  setClock(minutes) {
    const minute = Math.floor(minutes);
    if (minute !== this.clockMinute) {
      this.clockMinute = minute;
      this.clock.setText(formatClock(minute));
    }
    const warn = minute >= CONFIG.clock.warnMinute;
    if (warn !== this.clockWarn) {
      this.clockWarn = warn;
      this.clock.setColor(warn ? CONFIG.colors.accent : CONFIG.colors.text);
    }
  }

  setTasks(count) {
    this.tasks.setText(`처리한 업무 ${count}`);
  }
}
