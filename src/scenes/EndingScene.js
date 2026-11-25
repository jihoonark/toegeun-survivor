import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import { addButton } from '../systems/Button.js';
import { HERO } from '../art/hero.js';
import { music } from '../systems/Music.js';
import Sfx from '../systems/Sfx.js';
import { wallet } from '../systems/Wallet.js';
import { formatAmount } from '../data/benefits.js';
import { CREDITS } from '../data/credits.js';

const toColor = (hex) => Phaser.Display.Color.HexStringToColor(hex).color;

// 칼퇴 엔딩 (5화, docs/5화_기획.md 4장): 시즌 1 마지막 층(층 데이터 ending: true)을 깨면 결과 화면 전에 나온다
// 장면 4개. 화면을 누르거나 Enter·Space 면 다음 장면, 가만히 있어도 config ending.sceneTime 뒤 넘어간다 (마지막 장면은 버튼)
//   1. 엘리베이터 1층 버튼에 불 → 문이 닫힌다
//   2. 로비 출입문, 해 지는 거리. "18:00 칼퇴 성공"
//   3. 이번 시즌 모은 것: 모은 연봉, 퇴근시킨 상사, 판 수
//   4. "퇴근 서바이버 시즌 1 완결" + 크레딧 (data/credits.js)
// 받는 값: 결과 화면에 넘길 summary 그대로 (마지막에 [결과 보기]로 넘긴다)
export default class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create(summary) {
    this.summary = summary;
    this.sfx = new Sfx(this);
    music.use(this).play('clear', { restart: true });
    this.index = -1;
    this.layer = null;
    this.scenes = [this.elevator, this.street, this.season, this.credits];
    const next = () => this.next();
    this.input.on('pointerdown', next);
    this.input.keyboard?.on('keydown-ENTER', (e) => !e.repeat && next());
    this.input.keyboard?.on('keydown-SPACE', (e) => !e.repeat && next());
    this.next();
  }

  next() {
    if (this.index >= this.scenes.length - 1) return; // 마지막 장면은 버튼으로
    this.timer?.remove();
    this.layer?.destroy();
    this.tweens.killAll();
    this.index++;
    this.layer = this.add.container(0, 0);
    this.cameras.main.fadeIn(CONFIG.ending.fade);
    this.scenes[this.index].call(this, this.layer);
    if (this.index < this.scenes.length - 1) this.timer = this.time.delayedCall(CONFIG.ending.sceneTime, () => this.next());
  }

  text(layer, x, y, content, opts) {
    const t = addText(this, x, y, content, opts);
    layer.add(t);
    return t;
  }

  // 1. 엘리베이터 안: 버튼 1에 불이 들어오고 양쪽 문이 닫힌다
  elevator(layer) {
    const { width, height } = CONFIG.screen;
    const E = CONFIG.ending;
    layer.add(this.add.rectangle(0, 0, width, height, 0x2a2238).setOrigin(0));
    const button = this.add.circle(width / 2, height * 0.42, E.button, 0x5a5468).setStrokeStyle(2, toColor(CONFIG.colors.outline));
    const label = addText(this, width / 2, height * 0.42, '1', { color: CONFIG.colors.outline, stroke: 0 });
    layer.add([button, label]);
    this.text(layer, width / 2, height * 0.18, '1층', { color: CONFIG.colors.accent });
    this.time.delayedCall(E.buttonDelay, () => {
      button.setFillStyle(0xffd23f);
      this.sfx.play('ping');
    });
    const doorW = width / 2;
    const left = this.add.rectangle(-doorW - 4, 0, doorW, height, 0xc9ccd6).setOrigin(0).setStrokeStyle(2, 0x8f94a3);
    const right = this.add.rectangle(width + 4, 0, doorW, height, 0xc9ccd6).setOrigin(0).setStrokeStyle(2, 0x8f94a3);
    layer.add([left, right]);
    this.tweens.add({ targets: left, x: 0, delay: E.doorDelay, duration: E.doorTime, ease: 'Quad.inOut' });
    this.tweens.add({ targets: right, x: doorW, delay: E.doorDelay, duration: E.doorTime, ease: 'Quad.inOut' });
  }

  // 2. 로비 출입문 밖, 해 지는 거리로 걸어 나간다
  street(layer) {
    const { width, height } = CONFIG.screen;
    const E = CONFIG.ending;
    // 노을 하늘 띠
    E.sky.forEach((color, i) => layer.add(this.add.rectangle(0, (i * height * 0.6) / E.sky.length, width, (height * 0.6) / E.sky.length + 1, color).setOrigin(0)));
    // 건물 그림자
    E.buildings.forEach(([x, w, h]) => layer.add(this.add.rectangle(x, height * 0.6, w, h, 0x3a2a48).setOrigin(0, 1)));
    layer.add(this.add.rectangle(0, height * 0.6, width, height * 0.4, 0x4a4058).setOrigin(0));
    // 회사 출입문 (왼쪽)
    layer.add(this.add.rectangle(40, height * 0.6, 70, 80, 0x7ec8e3, 0.6).setOrigin(0, 1).setStrokeStyle(3, 0x2a2e38));
    const hero = this.add.sprite(70, height * 0.74, HERO.texture).setOrigin(0.5, HERO.footY / HERO.size).play('hero-walk-side');
    layer.add(hero);
    this.tweens.add({ targets: hero, x: width * 0.62, duration: CONFIG.ending.sceneTime * 0.8 });
    this.text(layer, width / 2, height * 0.2, '18:00 칼퇴 성공', { size: CONFIG.ui.titleFontSize, color: CONFIG.colors.accent });
  }

  // 3. 이번 시즌 모은 것
  season(layer) {
    const { width, height } = CONFIG.screen;
    const s = wallet.stats();
    const earned = wallet.earned();
    layer.add(this.add.rectangle(0, 0, width, height, 0x1a1420).setOrigin(0));
    this.text(layer, width / 2, height * 0.2, '이번 시즌 기록', { color: CONFIG.colors.accent });
    const lines = [
      `모은 연봉 ${formatAmount('salary', earned.salary)} · 복지포인트 ${formatAmount('welfare', earned.welfare)}`,
      `퇴근시킨 상사 ${s.bosses}명`,
      `출근한 날 ${s.runs}일`,
    ];
    lines.forEach((line, i) => this.text(layer, width / 2, height * (0.4 + i * 0.14), line));
  }

  // 4. 시즌 1 완결 + 크레딧
  credits(layer) {
    const { width, height } = CONFIG.screen;
    const { ui, colors } = CONFIG;
    layer.add(this.add.rectangle(0, 0, width, height, 0x1a1420).setOrigin(0));
    this.text(layer, width / 2, height * 0.13, '퇴근 서바이버', { size: ui.titleFontSize, color: colors.accent });
    this.text(layer, width / 2, height * 0.27, '시즌 1 완결', { color: colors.text });
    CREDITS.forEach(({ role, name }, i) => {
      const y = height * 0.39 + i * CONFIG.ending.creditGap;
      this.text(layer, width / 2 - 8, y, role, { size: ui.smallFontSize, color: colors.textDim, origin: 0 }).setOrigin(1, 0.5);
      this.text(layer, width / 2 + 8, y, name, { size: ui.smallFontSize, origin: 0 }).setOrigin(0, 0.5);
    });
    this.text(layer, width / 2, height * 0.75, '시즌 2 준비 중… 가게에서 더 키워 기록을 깨 보세요', { size: ui.smallFontSize, color: colors.textDim });
    const b = addButton(this, width / 2, height * 0.87, '결과 보기', () => this.scene.start('Result', this.summary));
    layer.add([b.box, b.text]);
  }
}
