import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import { addButton } from '../systems/Button.js';
import { formatClock } from '../systems/Hud.js';
import { HERO } from '../art/hero.js';
import { music } from '../systems/Music.js';
import { progress } from '../systems/Progress.js';
import { getFloor } from '../data/floors.js';
import { WALLETS, formatAmount } from '../data/benefits.js';
import { wallet } from '../systems/Wallet.js';

// 결과 화면: "칼퇴 성공" / "야근 확정", 처리한 업무 수, 버틴 시간
// 칼퇴(계단 도착)면 그 층을 클리어로 저장하고, 다음 층이 있으면 [다음 층] [엘리베이터], 없으면 [다시하기] [엘리베이터]
// 받는 값: { result: 'clear' | 'overtime', floor, tasks, minutes, rank, benefits: { run, kept } }
// 회사 혜택: 이번 판에 가져간 것과 지갑 합계 (야근이면 절반만)
export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create({ result, floor, tasks, minutes, rank, benefits }) {
    const { width, height } = CONFIG.screen;
    const { ui, colors } = CONFIG;
    const r = CONFIG.result;
    const clear = result === 'clear';
    music.use(this).play(clear ? 'clear' : 'overtime', { restart: true });

    addText(this, width / 2, height * r.titleY, clear ? '칼퇴 성공' : '야근 확정', {
      size: ui.titleFontSize,
      color: clear ? colors.accent : colors.danger,
    });
    const floorName = getFloor(floor).name;
    const opened = clear ? progress.markCleared(floor) : null;
    let subtitle = `${floorName}에서 멘탈이 바닥났다… 오늘도 야근`;
    if (clear) subtitle = opened ? `${floorName} 클리어! ${getFloor(opened).name} 버튼에 불이 들어왔다` : `${floorName} 클리어!`;
    addText(this, width / 2, height * r.subtitleY, subtitle, { color: clear ? colors.text : colors.textDim });

    const statsY = height * r.statsY;
    addText(this, width / 2, statsY, `처리한 업무 ${tasks}건 · 최종 직급 ${rank}`);
    const timeLine = clear ? `퇴근 시각 ${formatClock(minutes)}` : `${formatClock(minutes)}까지 버팀`;
    addText(this, width / 2, statsY + r.statsGap, timeLine);
    if (benefits) {
      const keys = Object.keys(WALLETS);
      const got = keys.map((k) => `${WALLETS[k].icon} +${formatAmount(k, benefits.kept[k])}`).join('  ');
      const half = clear || keys.every((k) => !benefits.run[k]) ? '' : ' (야근이라 절반)';
      addText(this, width / 2, statsY + r.statsGap * 2, `가져간 혜택 ${got}${half}`, { color: colors.accent });
      const total = wallet.balance();
      addText(this, width / 2, statsY + r.statsGap * 3, `지갑 ${keys.map((k) => `${WALLETS[k].name} ${formatAmount(k, total[k])}`).join(' · ')}`, { size: ui.smallFontSize, color: colors.textDim });
    }

    // 주인공: 칼퇴면 정면, 야근이면 뒷모습으로 쓸쓸하게
    const hero = this.add.sprite(width / 2, height * r.heroY, HERO.texture);
    hero.setOrigin(0.5, HERO.footY / HERO.size).play(clear ? 'hero-walk-down' : 'hero-idle-up');

    const by = height * r.buttonsY;
    const offset = (r.button.width + r.button.gap) / 2;
    const next = clear ? progress.next(floor) : null;
    const first = next !== null ? () => this.go('Game', { floor: next }) : () => this.go('Game', { floor });
    const toTitle = () => this.go('Title');
    this.buttons = [
      addButton(this, width / 2 - offset, by, next !== null ? '다음 층' : '다시하기', first),
      addButton(this, width / 2 + offset, by, '엘리베이터', toTitle),
    ];

    // 끝나는 순간 누르던 손이 바로 다시하기를 누르지 않도록 잠깐 뒤에 입력을 받는다
    this.ready = false;
    this.buttons.forEach(({ box, text }) => {
      box.setAlpha(0);
      text.setAlpha(0);
    });
    this.time.delayedCall(r.inputDelay, () => {
      this.ready = true;
      this.buttons.forEach(({ box, text }) => this.tweens.add({ targets: [box, text], alpha: 1, duration: ui.hintFade / 2 }));
    });

    // 키를 꾹 누르고 있어 생기는 반복 입력은 무시한다 (결과 화면에서 새로 누른 것만)
    const onKey = (action) => (event) => !event.repeat && action();
    this.input.keyboard?.on('keydown-ENTER', onKey(first));
    this.input.keyboard?.on('keydown-SPACE', onKey(first));
    this.input.keyboard?.on('keydown-ESC', onKey(toTitle));
  }

  go(scene, data) {
    if (!this.ready) return;
    this.ready = false;
    this.scene.start(scene, data);
  }
}
