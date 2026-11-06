import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import Sfx from '../systems/Sfx.js';
import { music } from '../systems/Music.js';
import { projectileTexture } from '../art/projectiles.js';

const toColor = (hex) => Phaser.Display.Color.HexStringToColor(hex).color;

// 승진 화면: 게임 위에 겹쳐 뜨고, 카드 3장 중 하나를 고르면 닫힌다 (Promotion 이 띄운다)
// 받는 값: { promoted(직급이 바뀌었나), fromRank, toRank, choices, onPick }
//   choice = { type: 'new' | 'upgrade', weapon, level, desc } 또는 { type: 'upgrade-item', item, desc }
// 카드는 마우스·터치로 누르거나 1·2·3 키로 고른다
export default class LevelUpScene extends Phaser.Scene {
  constructor() {
    super('LevelUp');
  }

  create({ promoted, fromRank, toRank, choices, onPick }) {
    const { width, height } = CONFIG.screen;
    const L = CONFIG.levelUp;
    const { colors, ui } = CONFIG;
    this.onPick = onPick;
    this.choices = choices;
    this.picked = false;
    this.ready = false;

    this.add.rectangle(0, 0, width, height, toColor(colors.outline), L.dimAlpha).setOrigin(0);
    addText(this, width / 2, height * L.titleY, promoted ? '승진!' : '호봉 UP!', { size: ui.titleFontSize, color: colors.accent });
    addText(this, width / 2, height * L.titleY + ui.titleFontSize * 0.9, `${fromRank} → ${toRank}`, { color: colors.text });

    const { width: cw, height: ch, gap } = L.card;
    const total = choices.length * cw + (choices.length - 1) * gap;
    const cards = choices.map((choice, i) => this.addCard(width / 2 - total / 2 + cw / 2 + i * (cw + gap), height * L.cardsY, choice, i));

    // 카드가 살짝 튀어 오르며 나타난다
    cards.forEach((parts, i) => {
      parts.forEach((p) => {
        const y = p.y;
        p.setAlpha(0).setY(y + 10);
        this.tweens.add({ targets: p, alpha: 1, y, delay: i * 60, duration: 180, ease: 'Back.Out' });
      });
    });
    this.time.delayedCall(L.inputDelay, () => (this.ready = true));

    const keys = ['ONE', 'TWO', 'THREE', 'FOUR'];
    choices.forEach((choice, i) => this.input.keyboard?.on(`keydown-${keys[i]}`, (e) => !e.repeat && this.choose(choice)));

    new Sfx(this).play('levelUp');
    // 카드를 고르는 동안 배경음악을 줄였다가 닫히면 되돌린다
    music.use(this).duck(true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => music.duck(false));
  }

  addCard(x, y, choice, index) {
    const { width: cw, height: ch } = CONFIG.levelUp.card;
    const { colors, ui } = CONFIG;
    const isNew = choice.type === 'new';
    const weapon = choice.weapon;
    const name = weapon?.name ?? choice.item.name;
    const iconKey = weapon ? projectileTexture(this, weapon.projectile) : choice.item.icon;
    const credit = (weapon ?? choice.item).credit;
    const top = y - ch / 2;
    const rows = CONFIG.levelUp.cardRows;

    const box = this.add.rectangle(x, y, cw, ch, toColor('#2a2238')).setStrokeStyle(2, toColor(isNew ? colors.accent : colors.textDim));
    const badge = addText(this, x, top + rows.badge, isNew ? '새 무기' : weapon ? `Lv ${choice.level}` : '복지', {
      size: ui.smallFontSize,
      color: isNew ? colors.accent : colors.textDim,
      stroke: 0,
    });
    const icon = this.add.image(x, top + rows.icon, iconKey).setScale(CONFIG.levelUp.iconScale);
    const title = addText(this, x, top + rows.name, name, { size: ui.smallFontSize, wrap: cw - 12 });
    const desc = addText(this, x, top + rows.desc, choice.desc, { size: ui.smallFontSize, color: colors.textDim, stroke: 0, wrap: cw - 14 });
    const parts = [box, badge, icon, title, desc];
    if (credit) parts.push(addText(this, x, top + ch - rows.credit, `${credit.nickname}님의 아이디어`, { size: ui.smallFontSize, color: colors.accent, stroke: 0 }));
    parts.push(addText(this, x - cw / 2 + 8, top + 8, String(index + 1), { size: ui.smallFontSize, color: colors.textDim, origin: 0, stroke: 0 }));

    // 카드 위에서 누르고 카드 위에서 뗀 경우에만 고른다 (Button.js 와 같은 규칙)
    let pressed = false;
    box.setInteractive({ useHandCursor: true });
    box.on('pointerover', () => box.setFillStyle(toColor('#3a3050')));
    box.on('pointerout', () => {
      pressed = false;
      box.setFillStyle(toColor('#2a2238'));
    });
    box.on('pointerdown', () => (pressed = this.ready));
    box.on('pointerup', () => {
      if (pressed) this.choose(choice);
      pressed = false;
    });
    return parts;
  }

  choose(choice) {
    if (!this.ready || this.picked) return;
    this.picked = true;
    this.scene.stop();
    this.onPick(choice);
  }
}
