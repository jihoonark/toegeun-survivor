import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { OFFICE_TEXTURES } from '../art/office.js';
import { DESK_EVENTS } from '../data/deskEvents.js';
import { getNpc } from '../data/npcs.js';
import Npc from '../entities/Npc.js';
import PcScreen from './PcScreen.js';
import Sfx from './Sfx.js';
import { addText } from './Text.js';

// 내 자리 (GAME_SPEC.md 12장): 사무실 가운데 내 책상
// - 자리 이벤트 시각이 되면 모니터에 알림이 뜨고, 화면 밖이면 가장자리 화살표가 책상 쪽을 가리킨다
// - 책상 앞에 잠깐 서 있으면 모니터로 확대되며 회사 PC 화면(PcScreen)으로 넘어간다 (그동안 게임은 멈춘다)
// - 고른 답에 따라 그 자리에서 잠깐 꼼짝 못 하거나(busy), NPC가 나타나 따라다닌다
// - 정해진 시간 안에 자리에 가지 않으면 expireChoice 를 고른 것으로 본다 (안 읽으면 읽씹)
//
// 장면 이벤트
//   'desk-event-ready'  { event }           알림이 떴을 때
//   'desk-event-done'   { event, choice }   답을 골랐을 때 (시간이 지나 저절로 골라진 경우 포함)

let pcScreen = null;

export default class Desk {
  // 움직이지 않을 때 주인공에게 주는 방향
  static STILL = new Phaser.Math.Vector2(0, 0);

  constructor(scene) {
    this.scene = scene;
    const d = CONFIG.desk;
    this.x = d.x;
    this.y = d.y;
    this.sfx = new Sfx(scene);
    pcScreen ??= new PcScreen(scene.game.canvas, d.screen);

    scene.add.image(d.x, d.y, OFFICE_TEXTURES.myDesk).setOrigin(0.5, 1).setDepth(d.y);
    this.label = addText(scene, d.x, d.y - d.labelOffsetY, '내 자리', { size: CONFIG.ui.smallFontSize, color: CONFIG.colors.accent })
      .setDepth(CONFIG.depth.flying);
    this.alert = scene.add.image(d.x + d.alertOffset.x, d.y + d.alertOffset.y, OFFICE_TEXTURES.alert).setDepth(CONFIG.depth.flying).setVisible(false);
    scene.tweens.add({ targets: this.alert, y: this.alert.y - 3, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.progress = scene.add.graphics().setDepth(CONFIG.depth.flying);
    this.arrow = scene.add.graphics().setScrollFactor(0).setDepth(CONFIG.depth.hud);

    this.queue = [...DESK_EVENTS].sort((a, b) => a.at - b.at);
    this.pending = null;
    this.holdLeft = d.holdTime;
    this.busyLeft = 0;
    this.transitioning = false;
    this.npcs = [];
  }

  // 책상 바로 아래(앞)에 서 있나
  playerInFront(player) {
    const z = CONFIG.desk.zone;
    return Math.abs(player.x - this.x) <= z.width / 2 && player.y >= this.y && player.y <= this.y + z.height;
  }

  // 매 프레임. 주인공이 움직일 수 없으면 true (회사 PC 화면 전환 중이거나 그 자리에서 일하는 중)
  update(delta, minutes, player, spawner) {
    if (this.transitioning) return true;

    if (!this.pending && this.queue.length && minutes >= this.queue[0].at) {
      this.pending = this.queue.shift();
      this.alert.setVisible(true);
      this.sfx.play('ping');
      this.scene.events.emit('desk-event-ready', { event: this.pending });
    }
    if (this.pending && minutes >= this.pending.at + this.pending.expireAfter) {
      const event = this.pending;
      this.finish(event, event.choices.find((c) => c.key === event.expireChoice));
    }

    this.npcs.forEach((npc) => npc.update(delta, player, spawner));
    this.drawArrow();

    if (this.busyLeft > 0) {
      this.busyLeft -= delta;
      this.drawProgress(player, 1 - this.busyLeft / this.busyTotal);
      if (this.busyLeft <= 0) this.endBusy();
      return true;
    }

    if (this.pending && this.playerInFront(player)) {
      this.holdLeft -= delta;
      this.drawProgress(player, 1 - this.holdLeft / CONFIG.desk.holdTime);
      if (this.holdLeft <= 0) this.open(this.pending);
    } else {
      this.holdLeft = CONFIG.desk.holdTime;
      this.progress.clear();
    }
    return false;
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

  // 알림이 떠 있고 책상이 화면 밖이면 화면 가장자리에 책상 쪽 화살표
  drawArrow() {
    this.arrow.clear();
    if (!this.pending) return;
    const view = this.scene.cameras.main.worldView;
    if (view.contains(this.x, this.y - 16)) return;
    const a = CONFIG.desk.arrow;
    const { width, height } = CONFIG.screen;
    const angle = Math.atan2(this.y - 16 - view.centerY, this.x - view.centerX);
    // 화면 가운데에서 그 방향으로 가장자리까지. 위·아래는 HUD(멘탈·무기 칸, 승진 막대)를 피해 더 안쪽
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tx = (width / 2 - a.margin) / Math.max(Math.abs(cos), 1e-6);
    const ty = (sin < 0 ? height / 2 - a.marginTop : height / 2 - a.marginBottom) / Math.max(Math.abs(sin), 1e-6);
    const t = Math.min(tx, ty);
    const x = width / 2 + Math.cos(angle) * t;
    const y = height / 2 + Math.sin(angle) * t;
    const s = a.size;
    const tip = (r, da) => [x + Math.cos(angle + da) * r, y + Math.sin(angle + da) * r];
    const [x1, y1] = tip(s, 0);
    const [x2, y2] = tip(s, 2.5);
    const [x3, y3] = tip(s, -2.5);
    this.arrow.fillStyle(CONFIG.hud.mentalColors.outline).fillTriangle(...tip(s + 2, 0), ...tip(s + 2, 2.5), ...tip(s + 2, -2.5));
    this.arrow.fillStyle(a.color).fillTriangle(x1, y1, x2, y2, x3, y3);
  }

  // 모니터로 확대 → 게임을 멈추고 회사 PC 화면 → 답을 고르면 다시 사무실로
  open(event) {
    const d = CONFIG.desk;
    const scene = this.scene;
    const cam = scene.cameras.main;
    this.transitioning = true;
    this.progress.clear();
    this.arrow.clear();
    scene.physics.world.pause();
    this.hideHud(true);
    cam.stopFollow();
    cam.pan(this.x, this.y + d.monitorOffsetY, d.zoomDuration, 'Sine.easeInOut');
    cam.zoomTo(d.zoom, d.zoomDuration, 'Sine.easeInOut', false, async (_cam, progress) => {
      if (progress < 1) return;
      scene.scene.pause();
      const choice = await pcScreen.open(event, { onMessage: () => this.sfx.play('ping') });
      scene.scene.resume();
      this.finish(event, choice);
      this.returnToOffice();
    });
  }

  returnToOffice() {
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

  // 고른 답의 결과를 적용한다
  finish(event, choice) {
    this.pending = null;
    this.alert.setVisible(false);
    this.arrow.clear();
    const r = choice.result ?? {};
    if (r.busy) {
      this.busyLeft = r.busy;
      this.busyTotal = r.busy;
      this.busyNpc = r.npc ? { id: r.npc, mode: r.mode } : null;
      this.busyText = addText(this.scene, this.scene.player.x, this.scene.player.y - CONFIG.desk.progress.offsetY - 14, r.busyText ?? '', {
        size: CONFIG.ui.smallFontSize,
      }).setDepth(CONFIG.depth.flying);
    } else if (r.npc) {
      this.addNpc(r.npc, r.mode);
    }
    this.scene.events.emit('desk-event-done', { event, choice });
  }

  endBusy() {
    this.busyLeft = 0;
    this.progress.clear();
    this.busyText?.destroy();
    this.busyText = null;
    if (this.busyNpc) this.addNpc(this.busyNpc.id, this.busyNpc.mode);
    this.busyNpc = null;
  }

  // NPC는 주인공 옆, 책상 쪽에서 나타난다
  addNpc(id, mode) {
    const p = this.scene.player;
    this.npcs.push(new Npc(this.scene, getNpc(id), mode, p.x - CONFIG.npc.spawnOffsetX, p.y));
  }
}
