import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { OFFICE_TEXTURES } from '../art/office.js';
import { DESK_EVENTS } from '../data/deskEvents.js';
import { QUIZZES } from '../data/quizzes.js';
import { getNpc } from '../data/npcs.js';
import { getEnemy } from '../data/enemies.js';
import Npc from '../entities/Npc.js';
import PcScreen from './PcScreen.js';
import Sfx from './Sfx.js';
import { addText } from './Text.js';
import { drawEdgeArrow } from './EdgeArrow.js';

// 내 자리 (GAME_SPEC.md 12장): 사무실 가운데 내 책상. 언제든 들르는 거점
// - 열려 있으면 책상 위에 "퀴즈!"와 알림 배지. 닫혀 있으면 다시 열리기까지 남은 분
// - 책상 앞에 잠깐 서 있으면 모니터로 확대되며 회사 PC 화면(PcScreen)으로 넘어간다 (그동안 게임은 멈춘다)
// - 메신저 퀴즈를 맞히면 보상 카드(멘탈·서류·선배 지원) 중 하나, 틀리면 벌칙 몬스터(거래처)가 쫓아온다
// - 한 번 쓰면 config desk.cooldown 분 동안 닫힌다
//
// 장면 이벤트
//   'desk-ready'   {}                         책상이 열렸을 때
//   'desk-done'    { event, correct, reward } 퀴즈가 끝났을 때
//   'npc-joined'   { npc }                    NPC가 나타났을 때

let pcScreen = null;

export default class Desk {
  // 움직이지 않을 때 주인공에게 주는 방향
  static STILL = new Phaser.Math.Vector2(0, 0);

  constructor(scene) {
    this.scene = scene;
    const d = CONFIG.desk;
    // 책상 위치는 층마다 다르다 (floors.js map.desk)
    [this.x, this.y] = scene.floor.map.desk;
    this.sfx = new Sfx(scene);
    pcScreen ??= new PcScreen(scene.game.canvas, d.screen);

    scene.add.image(this.x, this.y, OFFICE_TEXTURES.myDesk).setOrigin(0.5, 1).setDepth(this.y);
    this.label = addText(scene, this.x, this.y - d.labelOffsetY, '내 자리', { size: CONFIG.ui.smallFontSize, color: CONFIG.colors.textDim })
      .setDepth(CONFIG.depth.flying);
    this.alert = scene.add.image(this.x + d.alertOffset.x, this.y + d.alertOffset.y, OFFICE_TEXTURES.alert).setDepth(CONFIG.depth.flying).setVisible(false);
    scene.tweens.add({ targets: this.alert, y: this.alert.y - 3, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.progress = scene.add.graphics().setDepth(CONFIG.depth.flying);
    this.arrow = scene.add.graphics().setScrollFactor(0).setDepth(CONFIG.depth.hud);

    this.quizzes = Phaser.Utils.Array.Shuffle([...QUIZZES]);
    this.readyAt = d.firstOpen;
    this.ready = false;
    this.arrowLeft = 0;
    this.holdLeft = d.holdTime;
    this.transitioning = false;
    this.npcs = [];
  }

  // 책상 바로 아래(앞)에 서 있나
  playerInFront(player) {
    const z = CONFIG.desk.zone;
    return Math.abs(player.x - this.x) <= z.width / 2 && player.y >= this.y && player.y <= this.y + z.height;
  }

  // 매 프레임. 주인공이 움직일 수 없으면 true (회사 PC 화면 전환 중)
  update(delta, minutes, player, spawner) {
    if (this.transitioning) return true;

    if (!this.ready && minutes >= this.readyAt) this.setReady(true);
    if (!this.ready) this.label.setText(`내 자리 · ${Math.ceil(this.readyAt - minutes)}분 뒤`);

    this.npcs.forEach((npc) => npc.update(delta, player, spawner));
    this.npcs = this.npcs.filter((npc) => !npc.done);

    this.arrowLeft -= delta;
    this.drawArrow();

    if (this.ready && this.playerInFront(player)) {
      this.holdLeft -= delta;
      this.drawProgress(player, 1 - this.holdLeft / CONFIG.desk.holdTime);
      if (this.holdLeft <= 0) this.open();
    } else {
      this.holdLeft = CONFIG.desk.holdTime;
      this.progress.clear();
    }
    return false;
  }

  setReady(on) {
    this.ready = on;
    this.alert.setVisible(on);
    if (on) {
      this.label.setText('내 자리 · 퀴즈!').setColor(CONFIG.colors.accent);
      this.arrowLeft = CONFIG.desk.arrowTime;
      this.sfx.play('ping');
      this.scene.events.emit('desk-ready', {});
    } else {
      this.label.setColor(CONFIG.colors.textDim);
      this.arrow.clear();
    }
  }

  // 주인공 머리 위 동그란 진행 표시
  drawProgress(player, ratio) {
    const p = CONFIG.desk.progress;
    const x = player.x;
    const y = player.y - p.offsetY;
    this.progress.clear().lineStyle(3, CONFIG.hud.mentalColors.outline).strokeCircle(x, y, p.radius);
    this.progress
      .lineStyle(2, p.color)
      .beginPath()
      .arc(x, y, p.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Phaser.Math.Clamp(ratio, 0, 1))
      .strokePath();
  }

  // 책상이 막 열렸고(arrowTime 동안) 화면 밖이면 화면 가장자리에 책상 쪽 화살표
  drawArrow() {
    if (!this.ready || this.arrowLeft <= 0) {
      this.arrow.clear();
      return;
    }
    drawEdgeArrow(this.arrow, this.scene.cameras.main, this.x, this.y - 16, CONFIG.desk.arrow);
  }

  nextQuiz() {
    if (!this.quizzes.length) this.quizzes = Phaser.Utils.Array.Shuffle([...QUIZZES]);
    return this.quizzes.pop();
  }

  // 모니터로 확대 → 게임을 멈추고 회사 PC 화면 → 끝나면 다시 사무실로
  open() {
    const d = CONFIG.desk;
    const scene = this.scene;
    const cam = scene.cameras.main;
    const event = Phaser.Utils.Array.GetRandom(DESK_EVENTS);
    this.transitioning = true;
    this.setReady(false);
    this.progress.clear();
    scene.physics.world.pause();
    this.hideHud(true);
    cam.stopFollow();
    cam.pan(this.x, this.y + d.monitorOffsetY, d.zoomDuration, 'Sine.easeInOut');
    cam.zoomTo(d.zoom, d.zoomDuration, 'Sine.easeInOut', false, async (_cam, progress) => {
      if (progress < 1) return;
      scene.scene.pause();
      const result = await pcScreen.quiz(event, this.nextQuiz(), { onMessage: () => this.sfx.play('ping') });
      scene.scene.resume();
      this.returnToOffice(() => this.finish(event, result));
    });
  }

  returnToOffice(then) {
    const d = CONFIG.desk;
    const scene = this.scene;
    const cam = scene.cameras.main;
    const player = scene.player;
    cam.pan(player.x, player.y, d.returnDuration, 'Sine.easeInOut');
    cam.zoomTo(1, d.returnDuration, 'Sine.easeInOut', false, (_cam, progress) => {
      if (progress < 1) return;
      const lerp = CONFIG.camera.followLerp;
      cam.startFollow(player, true, lerp, lerp);
      this.hideHud(false);
      scene.physics.world.resume();
      this.transitioning = false;
      then();
    });
  }

  // 화면 확대 중에는 HUD가 같이 커져 보이므로 잠깐 숨긴다
  hideHud(hide) {
    for (const obj of this.scene.children.list) {
      if (obj.depth < CONFIG.depth.hud || obj === this.arrow) continue;
      if (hide) {
        obj.deskWasVisible = obj.visible;
        obj.setVisible(false);
      } else if (obj.deskWasVisible !== undefined) {
        obj.setVisible(obj.deskWasVisible);
        delete obj.deskWasVisible;
      }
    }
  }

  // 퀴즈 결과 적용. 그 뒤 cooldown 분 동안 닫힌다
  finish(event, { correct, reward }) {
    const scene = this.scene;
    this.readyAt = scene.shiftMinutes() + CONFIG.desk.cooldown;
    if (correct) this.applyReward(reward.effect ?? {});
    else this.penalty(event.penalty);
    scene.events.emit('desk-done', { event, correct, reward });
  }

  applyReward(effect) {
    const scene = this.scene;
    if (effect.heal) scene.player.heal(effect.heal);
    if (effect.xp) scene.events.emit('xp-gained', { amount: effect.xp });
    if (effect.npc) this.addNpc(effect.npc, effect.mode);
  }

  // 벌칙 몬스터는 화면 밖에서 나타나 쫓아온다
  penalty({ warning, enemy, count }) {
    const spawner = this.scene.spawner;
    for (let i = 0; i < count; i++) {
      const pos = spawner.offscreenPoint();
      if (pos) spawner.spawnAt(getEnemy(enemy), pos.x, pos.y);
    }
    this.scene.events.emit('wave-warning', { text: warning });
  }

  // NPC는 주인공 왼쪽에서 튀어나온다
  addNpc(id, mode) {
    const same = this.npcs.find((n) => n.def.id === id && n.modeName === mode && !n.leaving);
    if (same) {
      same.refresh();
      this.scene.events.emit('npc-refreshed', { npc: same });
      return;
    }
    const p = this.scene.player;
    const npc = new Npc(this.scene, getNpc(id), mode, p.x - CONFIG.npc.spawnOffsetX, p.y);
    this.npcs.push(npc);
    this.scene.events.emit('npc-joined', { npc });
  }
}
