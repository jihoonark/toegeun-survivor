import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import { addButton } from '../systems/Button.js';
import { formatClock } from '../systems/Hud.js';
import { HERO } from '../art/hero.js';

// 결과 화면: "칼퇴 성공" / "야근 확정", 처리한 업무 수, 버틴 시간, 다시하기
// 받는 값: { result: 'clear' | 'overtime', tasks, minutes }
export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create({ result, tasks, minutes }) {
    const { width, height } = CONFIG.screen;
    const { ui, colors } = CONFIG;
    const r = CONFIG.result;
    const clear = result === 'clear';

    addText(this, width / 2, height * r.titleY, clear ? '칼퇴 성공' : '야근 확정', {
      size: ui.titleFontSize,
      color: clear ? colors.accent : colors.danger,
    });
    addText(this, width / 2, height * r.subtitleY, clear ? '오늘도 18:00 정시 퇴근!' : '멘탈이 바닥났다… 오늘도 야근', {
      color: colors.textDim,
    });

    const statsY = height * r.statsY;
    addText(this, width / 2, statsY, `처리한 업무 ${tasks}건`);
    const timeLine = clear ? `퇴근 시각 ${formatClock(minutes)}` : `${formatClock(minutes)}까지 버팀`;
    addText(this, width / 2, statsY + r.statsGap, timeLine);

    // 주인공: 칼퇴면 정면, 야근이면 뒷모습으로 쓸쓸하게
    const hero = this.add.sprite(width / 2, height * r.heroY, HERO.texture);
    hero.setOrigin(0.5, HERO.footY / HERO.size).play(clear ? 'hero-walk-down' : 'hero-idle-up');

    const by = height * r.buttonsY;
    const offset = (r.button.width + r.button.gap) / 2;
    const restart = () => this.go('Game');
    const toTitle = () => this.go('Title');
    this.buttons = [addButton(this, width / 2 - offset, by, '다시하기', restart), addButton(this, width / 2 + offset, by, '타이틀로', toTitle)];

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

    this.input.keyboard?.on('keydown-ENTER', restart);
    this.input.keyboard?.on('keydown-SPACE', restart);
    this.input.keyboard?.on('keydown-ESC', toTitle);
  }

  go(scene) {
    if (!this.ready) return;
    this.ready = false;
    this.scene.start(scene);
  }
}
