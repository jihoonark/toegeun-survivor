import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import { requestFullscreen } from '../systems/Fullscreen.js';
import { music } from '../systems/Music.js';
import Sfx from '../systems/Sfx.js';
import { progress } from '../systems/Progress.js';
import { FLOORS } from '../data/floors.js';
import { addButton } from '../systems/Button.js';
import { wallet } from '../systems/Wallet.js';
import { WALLETS, formatAmount } from '../data/benefits.js';
import { SHOPS } from '../data/shop.js';

const toColor = (hex) => Phaser.Display.Color.HexStringToColor(hex).color;

// 시작 화면 = 엘리베이터 버튼판 (GAME_SPEC.md 12장 "판 구조")
// 1~15층 버튼 중 열린 층만 불이 들어오고 누를 수 있다. 앞 층을 클리어하면 다음 층 버튼에 불이 들어온다 (systems/Progress.js)
// 층 버튼을 누르면 바로 출발. 키보드는 ↑↓(←→)로 열린 층을 고르고 Enter·Space 로 출발
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    // 브라우저는 첫 클릭·터치 전까지 소리를 막아 두므로, 누르는 순간부터 들린다
    music.use(this).play('title');
    this.sfx = new Sfx(this);
    const { width, height } = CONFIG.screen;
    const { ui, colors } = CONFIG;
    const E = ui.elevator;

    addText(this, width / 2, E.titleY, '퇴근 서바이버', { size: ui.titleFontSize, color: colors.accent });
    addText(this, width / 2, E.hintY, '엘리베이터 버튼을 눌러 출발', { size: ui.smallFontSize, color: colors.textDim });

    // 버튼판과 층 표시창
    const p = E.panel;
    const g = this.add.graphics();
    const o = p.outline;
    g.fillStyle(toColor(colors.outline)).fillRoundedRect(p.x - o, p.y - o, p.width + o * 2, p.height + o * 2, p.radius + o);
    g.fillStyle(E.colors.panel).fillRoundedRect(p.x, p.y, p.width, p.height, p.radius);
    const sh = p.shade;
    g.fillStyle(E.colors.panelDark).fillRect(p.x + sh.inset, p.y + p.height - sh.bottom, p.width - sh.inset * 2, sh.height);
    const d = E.display;
    const cx = p.x + p.width / 2;
    g.fillStyle(E.colors.display).fillRect(cx - d.width / 2, d.y, d.width, d.height);
    this.displayText = addText(this, cx, d.y + d.height / 2, '', { size: ui.bodyFontSize, color: E.colors.displayText, stroke: 0 });

    this.buttons = [];
    const b = E.button;
    for (let row = 0; row < E.rows; row++) {
      for (let col = 0; col < E.columns; col++) {
        const id = E.rows * E.columns - E.columns * (row + 1) + col + 1;
        this.buttons.push(this.addFloorButton(id, b.startX + col * b.gapX, b.startY + row * b.gapY));
      }
    }

    // 오른쪽: 고른 층 설명
    const info = E.info;
    this.infoName = addText(this, info.x, info.nameY, '', { size: ui.bodyFontSize });
    this.infoStatus = addText(this, info.x, info.statusY, '', { size: ui.smallFontSize, wrap: info.wrap });
    this.infoIntro = addText(this, info.x, info.introY, '', { size: ui.smallFontSize, color: colors.textDim, wrap: info.wrap });
    const prompt = addText(this, info.x, info.promptY, '버튼을 누르거나 Enter', { size: ui.smallFontSize });
    this.tweens.add({ targets: prompt, alpha: ui.blinkMinAlpha, duration: ui.blinkDuration, yoyo: true, repeat: -1 });

    // 왼쪽: 지갑과 두 가게 (5화, scenes/ShopScene.js)
    const T = CONFIG.shop.title;
    this.walletText = addText(this, T.x, T.walletY, '', { size: ui.smallFontSize, color: colors.accent });
    this.refreshWallet();
    Object.keys(SHOPS).forEach((shopId, i) => {
      addButton(this, T.x, T.firstY + i * T.gap, SHOPS[shopId].name, () => this.openShop(shopId), T.button);
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.refreshWallet());

    // 에셋 출처 표기 자리 (GAME_SPEC.md 5장). 구매 에셋을 쓰기 전까지는 임시 문구
    addText(this, width / 2, height - ui.title.creditBottom, '임시 그래픽: 코드로 그린 도트', { size: ui.smallFontSize, color: colors.textDim });

    this.leaving = false;
    // 지금 누르고 있는 버튼과 손가락 (같은 손가락으로 같은 버튼에서 뗐을 때만 출발)
    this.pressing = null;
    this.select(progress.suggested());

    const keys = this.input.keyboard;
    const move = (step) => (e) => !e.repeat && this.moveSelection(step);
    keys?.on('keydown-UP', move(1));
    keys?.on('keydown-RIGHT', move(1));
    keys?.on('keydown-DOWN', move(-1));
    keys?.on('keydown-LEFT', move(-1));
    const go = (e) => !e.repeat && this.depart(this.selected);
    keys?.on('keydown-ENTER', go);
    keys?.on('keydown-SPACE', go);
  }

  refreshWallet() {
    const have = wallet.balance();
    this.walletText.setText(Object.keys(WALLETS).map((k) => `${WALLETS[k].icon} ${formatAmount(k, have[k])}`).join('\n'));
  }

  openShop(shopId) {
    if (this.leaving) return;
    this.pressing = null;
    this.sfx.play('ping');
    this.scene.pause();
    this.scene.launch('Shop', { shopId });
  }

  addFloorButton(id, x, y) {
    const E = CONFIG.ui.elevator;
    const floor = FLOORS.find((f) => f.id === id);
    const open = !!floor && progress.isOpen(id);
    const fill = open ? E.colors.lit : floor ? E.colors.locked : E.colors.unbuilt;
    const r = E.button.radius;
    const ring = this.add.graphics();
    const circle = this.add.circle(x, y, r, fill).setStrokeStyle(E.button.outline, toColor(CONFIG.colors.outline));
    const label = addText(this, x, y, String(id), {
      size: CONFIG.ui.smallFontSize,
      color: open ? CONFIG.colors.outline : E.colors.lockedText,
      stroke: 0,
    });
    if (open && progress.isCleared(id)) {
      addText(this, x + r, y - r, '✓', { size: CONFIG.ui.smallFontSize, color: E.colors.clearMark, stroke: CONFIG.ui.bodyStroke });
    }
    // 휴대폰에서 누르기 쉽게 그림보다 넓게 받는다
    circle.setInteractive(new Phaser.Geom.Circle(r, r, r + E.button.touchPad), Phaser.Geom.Circle.Contains);
    circle.on('pointerdown', (pointer) => (this.pressing = { id, pointerId: pointer.id }));
    circle.on('pointerout', (pointer) => {
      if (this.pressing?.pointerId === pointer.id) this.pressing = null;
    });
    circle.on('pointerup', (pointer) => {
      const same = this.pressing?.id === id && this.pressing.pointerId === pointer.id;
      this.pressing = null;
      if (!same) return;
      if (pointer.wasTouch && CONFIG.fullscreen.autoOnTouchStart) requestFullscreen();
      this.select(id);
      this.depart(id);
    });
    return { id, x, y, open, built: !!floor, ring, circle, label };
  }

  select(id) {
    const E = CONFIG.ui.elevator;
    this.selected = id;
    for (const button of this.buttons) {
      button.ring.clear();
      if (button.id !== id) continue;
      const s = E.button.selectedRing;
      button.ring.lineStyle(s.width, E.colors.selected).strokeCircle(button.x, button.y, E.button.radius + s.gap);
    }
    const floor = FLOORS.find((f) => f.id === id);
    this.displayText.setText(`▼ ${id}`);
    this.infoName.setText(floor ? `${floor.name} · ${floor.zone}` : `${id}층`);
    let status;
    if (!floor) status = '아직 공사 중인 층';
    else if (!progress.isOpen(id)) status = `🔒 ${progress.previousName(id)}을 클리어하면 열려요`;
    else if (progress.isCleared(id)) status = '✓ 클리어한 층';
    else status = '처음 가는 층';
    this.infoStatus.setText(status).setColor(floor && progress.isOpen(id) ? CONFIG.colors.accent : CONFIG.colors.textDim);
    this.infoIntro.setText(floor?.intro ?? '');
  }

  // 열린 층끼리만 위아래로
  moveSelection(step) {
    const open = FLOORS.filter((f) => progress.isOpen(f.id)).map((f) => f.id).sort((a, b) => a - b);
    const i = open.indexOf(this.selected);
    const next = open[Phaser.Math.Clamp((i < 0 ? 0 : i) + step, 0, open.length - 1)];
    if (next !== undefined) this.select(next);
  }

  // 열린 층이면 문이 닫히는 소리와 함께 출발, 잠긴 층이면 버튼이 흔들린다
  depart(id) {
    if (this.leaving) return;
    const button = this.buttons.find((x) => x.id === id);
    if (!button?.open) {
      this.sfx.play('hurt');
      const s = CONFIG.ui.elevator.shake;
      if (button) this.tweens.add({ targets: [button.circle, button.label], x: `+=${s.distance}`, duration: s.duration, yoyo: true, repeat: s.repeat });
      return;
    }
    this.leaving = true;
    this.sfx.play('ping');
    const press = CONFIG.ui.elevator.press;
    this.tweens.add({ targets: button.circle, scale: press.scale, duration: press.duration, yoyo: true });
    this.time.delayedCall(CONFIG.ui.elevator.startDelay, () => this.scene.start('Game', { floor: id }));
  }
}
