import { CONFIG } from '../config.js';
import { addText } from './Text.js';
import { projectileTexture } from '../art/projectiles.js';
import { EFFECT_TEXTURES } from '../art/effects.js';

// 시작 시각부터 지난 게임 분 → "17:42"
export function formatClock(minutes) {
  const total = CONFIG.clock.startHour * 60 + Math.floor(minutes);
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

// 화면 정보: 왼쪽 위 멘탈 바와 그 아래 무기 칸, 가운데 시계, 오른쪽 처리한 업무 수, 아래 승진 막대
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

    this.createWeaponSlots(fix);
    this.createXpBar(fix);

    this.clockMinute = null;
    this.clockWarn = null;
    this.toasts = 0;
    scene.events.on('weapon-added', ({ weapon }) => this.showCredit(weapon));
  }

  // 멘탈 바 아래 무기 칸. 빈 칸은 자물쇠
  createWeaponSlots(fix) {
    const { margin, mentalBar, weaponSlots: w } = CONFIG.hud;
    const y = this.barY + mentalBar.height + w.offsetY;
    this.slotFrame = fix(this.scene.add.graphics());
    this.slots = [];
    for (let i = 0; i < CONFIG.weapons.slots; i++) {
      const x = margin + i * (w.size + w.gap);
      this.slotFrame.fillStyle(CONFIG.hud.mentalColors.outline, 0.85).fillRect(x, y, w.size, w.size);
      this.slotFrame.lineStyle(1, CONFIG.hud.mentalColors.back).strokeRect(x + 0.5, y + 0.5, w.size - 1, w.size - 1);
      const cx = x + w.size / 2;
      const cy = y + w.size / 2;
      this.slots.push({
        icon: fix(this.scene.add.image(cx, cy, EFFECT_TEXTURES.lock)),
        level: fix(addText(this.scene, x + w.size + 1, y + w.size + 1, '', { size: CONFIG.ui.smallFontSize, origin: 1, stroke: CONFIG.ui.bodyStroke })),
      });
    }
  }

  // slots: Combat.weapons
  setWeapons(slots) {
    const scale = CONFIG.hud.weaponSlots.iconScale;
    this.slots.forEach((view, i) => {
      const slot = slots[i];
      if (!slot) {
        view.icon.setTexture(EFFECT_TEXTURES.lock).setScale(1).setAlpha(0.6);
        view.level.setText('');
        return;
      }
      view.icon.setTexture(projectileTexture(this.scene, slot.def.projectile)).setScale(scale).setAlpha(1);
      view.level.setText(String(slot.level));
    });
  }

  // 화면 아래 가운데 승진 막대: [지금 직급] ▓▓▓░░░ [다음 직급]
  createXpBar(fix) {
    const { width, height } = CONFIG.screen;
    const b = CONFIG.hud.xpBar;
    this.xpX = (width - b.width) / 2;
    this.xpY = height - b.bottom - b.height;
    this.xpBar = fix(this.scene.add.graphics());
    const small = { size: CONFIG.ui.smallFontSize, stroke: CONFIG.ui.bodyStroke };
    this.rankText = fix(addText(this.scene, this.xpX - b.labelGap, this.xpY + b.height / 2, '', small)).setOrigin(1, 0.5);
    this.nextRankText = fix(addText(this.scene, this.xpX + b.width + b.labelGap, this.xpY + b.height / 2, '', { ...small, color: CONFIG.colors.textDim })).setOrigin(0, 0.5);
  }

  setXp({ xp, need, rank, nextRank }) {
    const b = CONFIG.hud.xpBar;
    const ratio = Math.min(1, xp / need);
    this.xpBar.clear();
    this.xpBar.fillStyle(b.outline).fillRect(this.xpX - 1, this.xpY - 1, b.width + 2, b.height + 2);
    this.xpBar.fillStyle(b.back).fillRect(this.xpX, this.xpY, b.width, b.height);
    this.xpBar.fillStyle(b.fill).fillRect(this.xpX, this.xpY, Math.round(b.width * ratio), b.height);
    if (this.rankText.text !== rank) this.rankText.setText(rank);
    if (this.nextRankText.text !== nextRank) this.nextRankText.setText(nextRank);
  }

  // 화면 가운데 위쪽에 크게 잠깐 뜨는 경고
  showWarning(message) {
    const w = CONFIG.hud.warning;
    const { width, height } = CONFIG.screen;
    const text = addText(this.scene, width / 2, height * w.y, message, { size: CONFIG.ui.titleFontSize, color: CONFIG.colors.danger })
      .setScrollFactor(0)
      .setDepth(CONFIG.depth.hud);
    this.scene.tweens.add({ targets: text, scale: { from: 1.3, to: 1 }, duration: 180, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: text, alpha: 0, delay: w.duration, duration: w.fade, onComplete: () => text.destroy() });
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
