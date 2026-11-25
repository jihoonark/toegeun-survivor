import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import { addButton } from '../systems/Button.js';
import Sfx from '../systems/Sfx.js';
import { shop } from '../systems/Shop.js';
import { wallet } from '../systems/Wallet.js';
import { SHOPS } from '../data/shop.js';
import { WALLETS, formatAmount } from '../data/benefits.js';
import { statsAt } from '../data/weapons.js';

const toColor = (hex) => Phaser.Display.Color.HexStringToColor(hex).color;
// 받침이 있으면 '이', 없으면 '가' (연봉이, 복지포인트가)
const subject = (word) => word + ((word.charCodeAt(word.length - 1) - 0xac00) % 28 ? '이' : '가');

// 엘리베이터 화면 위에 뜨는 가게 (5화, docs/5화_기획.md 2장)
// - 💼 연봉 협상: 연봉으로, 계속 남는 강화 (시작 무기 공격력, 최대 멘탈, 사직서 무기). 시작 무기 고르기와 "한 발" 데미지 표시
// - 🏪 사내 편의점: 복지포인트로, 다음 한 판만 (커피믹스, 연차 쿠폰, 폭탄)
// 받는 값: { shopId: 'salary' | 'welfare' }. 닫으면 엘리베이터(Title) 장면을 다시 움직인다
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('Shop');
  }

  create({ shopId, message }) {
    this.shopId = shopId;
    this.sfx = new Sfx(this);
    const S = CONFIG.shop;
    const { ui, colors } = CONFIG;
    const { width, height } = CONFIG.screen;
    const def = SHOPS[shopId];
    const walletKey = def.wallet;

    // 뒤 화면을 어둡게 가리고 가게 판
    this.add.rectangle(0, 0, width, height, toColor(colors.outline), 0.75).setOrigin(0).setInteractive();
    const p = S.panel;
    this.add.rectangle(p.x, p.y, p.width, p.height, 0x2a2238).setOrigin(0).setStrokeStyle(ui.bodyStroke, toColor(colors.accent));

    addText(this, width / 2, S.titleY, def.name, { color: colors.accent });
    const have = formatAmount(walletKey, wallet.balance()[walletKey]);
    addText(this, width / 2, S.walletY, message ?? `${WALLETS[walletKey].name} ${have} · ${def.note}`, {
      size: ui.smallFontSize,
      color: message ? colors.danger : colors.textDim,
    });

    shop.items(shopId).forEach((item, i) => this.addRow(item, S.rowsY + i * S.rowGap));
    if (shopId === 'salary') this.addStarterRow();

    addButton(this, width / 2, S.closeY, '닫기', () => this.close(), S.button);
    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  addRow(item, y) {
    const S = CONFIG.shop;
    const { ui, colors } = CONFIG;
    const level = shop.level(item);
    let name = item.name;
    if (!item.consumable && item.prices.length > 1) name += item.id === 'power' ? ` Lv${level + 1}` : ` (${level}/${item.prices.length})`;
    addText(this, S.nameX, y - 8, name, { origin: 0 }).setOrigin(0, 0.5);
    addText(this, S.nameX, y + 8, item.desc, { size: ui.smallFontSize, color: colors.textDim }).setOrigin(0, 0.5);

    const price = shop.price(item);
    if (price === null) {
      addText(this, S.buyX, y, item.consumable ? '담았음 ✓' : item.prices.length === 1 ? '샀음 ✓' : '최대', { color: colors.textDim });
      return;
    }
    addButton(this, S.buyX, y, formatAmount(SHOPS[item.shop].wallet, price), () => this.buy(item), S.button);
  }

  // 시작 무기 고르기 + 지금 한 발 데미지 ("아메리카노 던지기 · 한 발 12")
  addStarterRow() {
    const S = CONFIG.shop;
    const { ui, colors } = CONFIG;
    const starter = shop.starter();
    const shot = Math.round(statsAt(starter, 1).damage * CONFIG.combat.damageMultiplier * shop.starterMultiplier() * CONFIG.juice.damageNumber.displayScale);
    addText(this, S.nameX, S.starterY, `시작 무기: ${starter.name} · 한 발 ${shot}`, { size: ui.smallFontSize, color: colors.accent }).setOrigin(0, 0.5);
    const options = shop.starterOptions();
    if (options.length < 2) return;
    // 고를 수 있으면 오른쪽에 바꾸기 버튼
    const next = options[(options.findIndex((w) => w.id === starter.id) + 1) % options.length];
    addButton(this, S.buyX, S.starterY, '무기 바꾸기', () => {
      shop.setStarter(next.id);
      this.sfx.play('pickup');
      this.scene.restart({ shopId: this.shopId });
    }, S.button);
  }

  buy(item) {
    const result = shop.buy(item);
    if (result === 'ok') {
      this.sfx.play('levelUp');
      this.scene.restart({ shopId: this.shopId });
      return;
    }
    this.sfx.play('hurt');
    const wallet = WALLETS[SHOPS[item.shop].wallet].name;
    this.scene.restart({ shopId: this.shopId, message: result === 'poor' ? `${subject(wallet)} 모자라요. 더 모아 오세요` : '더 살 수 없어요' });
  }

  close() {
    this.scene.stop();
    this.scene.resume('Title');
  }
}
