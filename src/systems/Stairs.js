import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { OFFICE_TEXTURES } from '../art/office.js';
import { addText } from './Text.js';
import { drawEdgeArrow } from './EdgeArrow.js';

// 층 클리어 계단 (GAME_SPEC.md 12장 "판 구조")
// 퇴근 시각(18:00)이 되면 "계단 열림!"과 함께 층 데이터 map.stairs 중 주인공에게서 가장 먼 곳에 계단이 생긴다
// 계단에 도착하면 클리어. 그 뒤에도 몬스터는 계속 나온다
// 계단이 화면 밖이면 화면 가장자리에 계단 쪽 화살표
//
// 장면 이벤트
//   'stairs-open'  { x, y }   계단이 생겼을 때
export default class Stairs {
  constructor(scene) {
    this.scene = scene;
    this.open = false;
    this.arrow = scene.add.graphics().setScrollFactor(0).setDepth(CONFIG.depth.hud);
  }

  // 매 프레임. 계단에 도착했으면 true
  update(minutes, player) {
    const { startHour, endHour } = CONFIG.clock;
    if (!this.open && minutes >= (endHour - startHour) * 60) this.reveal(player);
    if (!this.open) return false;
    const s = CONFIG.stairs;
    drawEdgeArrow(this.arrow, this.scene.cameras.main, this.x, this.y - s.zone.height / 2, s.arrow);
    return Math.abs(player.x - this.x) <= s.zone.width / 2 && Math.abs(player.y - (this.y - s.zone.height / 2)) <= s.zone.height / 2;
  }

  reveal(player) {
    const s = CONFIG.stairs;
    const far = (p) => Phaser.Math.Distance.Between(p[0], p[1], player.x, player.y);
    [this.x, this.y] = [...this.scene.floor.map.stairs].sort((a, b) => far(b) - far(a))[0];
    this.open = true;

    // 계단은 바닥에 그려진 것처럼 모든 것보다 아래. 위에 "계단" 글자가 둥실둥실
    const image = this.scene.add.image(this.x, this.y, OFFICE_TEXTURES.stairs).setOrigin(0.5, 1).setDepth(CONFIG.depth.floor + 2);
    image.setScale(s.appearScale);
    this.scene.tweens.add({ targets: image, scale: 1, duration: s.appearTime, ease: 'Back.Out' });
    const label = addText(this.scene, this.x, this.y - s.labelOffsetY, '계단 ↓', { size: CONFIG.ui.smallFontSize, color: CONFIG.colors.accent })
      .setDepth(CONFIG.depth.flying);
    this.scene.tweens.add({ targets: label, y: label.y - s.labelBob, duration: s.labelBobTime, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.scene.events.emit('stairs-open', { x: this.x, y: this.y });
  }
}
