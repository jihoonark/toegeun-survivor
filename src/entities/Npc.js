import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { HERO } from '../art/hero.js';
import { NPC_ART, npcTexture } from '../art/npcs.js';
import { addText } from '../systems/Text.js';

// 사무실 NPC: 내 자리 보상 등으로 나타나 주인공 뒤를 따라다닌다 (몬스터와 부딪히지 않는다)
//   guard  interval 마다 active 동안 주인공 둘레에 "막는 중" 원을 펴서 몬스터를 밀어낸다
// duration 이 지나면 한마디 남기고 떠난다 (done 이 true 가 되면 Desk 가 치운다)
export default class Npc {
  constructor(scene, def, mode, x, y) {
    this.scene = scene;
    this.def = def;
    this.modeName = mode;
    this.mode = def.modes[mode];
    this.timer = CONFIG.npc.firstGuardDelay;
    this.activeLeft = 0;
    this.lifeLeft = this.mode.duration ?? Infinity;
    this.lineIndex = -1;
    this.walkTime = 0;
    this.done = false;
    this.leaving = false;
    this.maxHp = this.mode.hp ?? Infinity;
    this.hp = this.maxHp;
    this.hurtLeft = 0;
    this.flashLeft = 0;

    this.shadow = scene.add.image(x, y, HERO.shadow);
    this.sprite = scene.add.image(x, y, npcTexture(def.art)).setOrigin(0.5, NPC_ART.footY / NPC_ART.size);
    this.ring = scene.add.graphics();
    this.wave = scene.add.graphics().setVisible(false);
    this.folder = scene.add.image(x, y, NPC_ART.folder).setVisible(false);
    this.pips = scene.add.graphics().setDepth(CONFIG.depth.flying);
    this.pos = new Phaser.Math.Vector2(x, y);
    // 나타날 때 통 튀어나온다
    const a = CONFIG.npc.anim;
    this.sprite.setScale(a.appearScale);
    scene.tweens.add({ targets: this.sprite, scale: 1, duration: a.appearTime, ease: 'Back.Out' });
  }

  update(delta, player, spawner) {
    if (this.done) return;
    this.followPlayer(delta, player);
    if (this.leaving) return;

    this.lifeLeft -= delta;
    if (this.lifeLeft <= 0) {
      this.leave(this.mode.leaveLine);
      return;
    }
    this.checkHits(delta, spawner);
    if (this.leaving) return;
    // 원을 펴고 있는 동안에도 다음 차례까지의 시간은 계속 준다 (interval 마다 정확히 한 번)
    this.timer -= delta;
    if (this.activeLeft > 0) {
      this.activeLeft -= delta;
      this.guard(delta, player, spawner);
      if (this.activeLeft <= 0) {
        this.ring.clear();
        this.folder.setVisible(false);
      }
    }
    if (this.timer > 0) return;
    this.timer += this.mode.interval;
    this.activeLeft = this.mode.active;
    this.startGuard(player, spawner);
  }

  // 같은 선배를 또 불렀을 때: 새로 만들지 않고 함께 있는 시간을 처음부터 다시
  refresh() {
    this.lifeLeft = this.mode.duration ?? Infinity;
    this.say(this.mode.refreshLine);
  }

  // 막아 주기 시작: 서류철을 번쩍 들고, 충격파, 원 안 몬스터마다 "접수!" 도장과 약한 피해
  startGuard(player, spawner) {
    const scene = this.scene;
    const n = CONFIG.npc;
    this.say(this.nextLine());
    const a = n.anim;
    this.folder.setVisible(true).setScale(a.folderFrom).setAlpha(1);
    scene.tweens.add({ targets: this.folder, scale: a.folderTo, duration: a.folderTime, ease: 'Back.Out' });

    this.wave
      .clear()
      .lineStyle(3, n.guardColor, 1)
      .strokeCircle(0, 0, this.mode.radius)
      .setPosition(player.x, player.y - CONFIG.npc.ring.offsetY)
      .setDepth(CONFIG.depth.flying - 1)
      .setScale(a.waveFrom)
      .setAlpha(1)
      .setVisible(true);
    scene.tweens.add({ targets: this.wave, scale: a.waveTo, alpha: 0, duration: n.guardWave, ease: 'Quad.Out', onComplete: () => this.wave.setVisible(false) });
    scene.cameras.main.shake(n.guardShake.duration, n.guardShake.intensity * CONFIG.juice.shake.strength);

    const r = this.mode.radius;
    let stamps = 0;
    for (const e of spawner.enemies.getChildren()) {
      if (!e.active) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy > r * r) continue;
      const aim = e.getAimPoint();
      if (stamps++ < n.stamp.max) this.stamp(aim.x, aim.y);
      e.takeDamage(this.mode.damage ?? 0);
      if (e.active) e.flash?.(CONFIG.juice.flash.duration, n.stamp.flashColor);
    }
    scene.events.emit('npc-guard', { npc: this, stamps });
  }

  // 빨간 "접수!" 도장 글자가 쾅 찍혔다 사라진다
  stamp(x, y) {
    const s = CONFIG.npc.stamp;
    const text = addText(this.scene, x, y, s.text, { size: CONFIG.ui.smallFontSize, color: s.color })
      .setDepth(CONFIG.depth.flying)
      .setAngle(Phaser.Math.Between(-s.tilt, s.tilt))
      .setScale(s.fromScale);
    this.scene.tweens.add({ targets: text, scale: 1, duration: s.slamTime, ease: 'Quad.In' });
    this.scene.tweens.add({ targets: text, alpha: 0, delay: s.duration, duration: s.fadeTime, onComplete: () => text.destroy() });
  }

  // 원 안 몬스터를 바깥으로 민다. 원은 주인공을 감싸고, 처음엔 퍼지듯 커진다
  guard(_delta, player, spawner) {
    const { radius, push, active } = this.mode;
    const g = CONFIG.npc.ring;
    const t = 1 - this.activeLeft / active;
    const grow = Math.min(1, t / g.growPart);
    const r = radius * (g.startScale + (1 - g.startScale) * grow);
    const c = CONFIG.npc.guardColor;
    this.ring
      .clear()
      .setDepth(player.y - 2)
      .fillStyle(c, g.fillAlpha * (1 - t) + g.fillMin)
      .fillCircle(player.x, player.y - g.offsetY, r)
      .lineStyle(2, c, g.lineAlpha - g.lineFade * t)
      .strokeCircle(player.x, player.y - g.offsetY, r);
    for (const e of spawner.enemies.getChildren()) {
      if (!e.active) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy > r * r) continue;
      e.knockback(dx || 1, dy, push, CONFIG.npc.pushHold);
    }
  }

  // 평소에는 주인공 왼쪽 뒤에 붙어 다니고, 막아 주는 동안은 주인공이 바라보는 앞으로 뛰어나온다
  followPlayer(delta, player) {
    const { distance } = this.def.follow;
    const guarding = this.activeLeft > 0 && !this.leaving;
    const speed = guarding ? CONFIG.npc.guardDash.speed : this.def.follow.speed;
    const target = guarding ? this.frontOf(player) : new Phaser.Math.Vector2(player.x - distance, player.y + 2);
    const toTarget = target.subtract(this.pos);
    const len = toTarget.length();
    const step = (speed * delta) / 1000;
    const moving = len > 2;
    if (moving) {
      this.pos.add(toTarget.scale(Math.min(1, step / len)));
      this.sprite.setFlipX(toTarget.x < 0);
    }
    this.walkTime = moving ? this.walkTime + delta : 0;
    const a = CONFIG.npc.anim;
    const bob = moving ? Math.abs(Math.sin(this.walkTime / a.bobPeriod)) * a.bobHeight : 0;
    this.sprite.setPosition(this.pos.x, this.pos.y - bob).setDepth(this.pos.y);
    this.shadow.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y - 1);
    this.bubble?.setPosition(this.pos.x, this.pos.y - CONFIG.npc.bubbleOffsetY);
    this.folder.setPosition(this.pos.x, this.pos.y - bob - CONFIG.npc.folderOffsetY).setDepth(CONFIG.depth.flying);
    this.drawPips();
  }

  frontOf(player) {
    const d = CONFIG.npc.guardDash.distance;
    if (player.facing === 'up') return new Phaser.Math.Vector2(player.x, player.y - d);
    if (player.facing === 'down') return new Phaser.Math.Vector2(player.x, player.y + d);
    return new Phaser.Math.Vector2(player.x + (player.flipX ? -d : d), player.y + 2);
  }

  // 몬스터에 닿으면 체력이 깎인다. 0이 되면 먼저 떠난다
  checkHits(delta, spawner) {
    if (this.flashLeft > 0) {
      this.flashLeft -= delta;
      if (this.flashLeft <= 0) this.sprite.clearTint();
    }
    if (!Number.isFinite(this.maxHp)) return;
    if (this.hurtLeft > 0) {
      this.hurtLeft -= delta;
      return;
    }
    const r = CONFIG.npc.hitRadius;
    for (const e of spawner.enemies.getChildren()) {
      if (!e.active) continue;
      if (Math.abs(e.x - this.pos.x) > r || Math.abs(e.y - this.pos.y) > r) continue;
      this.hp = Math.max(0, this.hp - (e.def.contactDamage ?? 1));
      this.hurtLeft = CONFIG.npc.hurtCooldown;
      this.flashLeft = CONFIG.juice.flash.duration;
      this.sprite.setTintFill(0xffffff);
      this.scene.events.emit('npc-hit', { npc: this });
      if (this.hp <= 0) {
        this.leave(this.mode.defeatLine);
        this.scene.events.emit('npc-defeated', { npc: this });
      } else {
        this.say(this.mode.hurtLine);
      }
      return;
    }
  }

  // 머리 위 체력 칸
  drawPips() {
    this.pips.clear();
    if (!Number.isFinite(this.maxHp) || this.leaving) return;
    const p = CONFIG.npc.hpPip;
    const total = this.maxHp * p.width + (this.maxHp - 1) * p.gap;
    const x0 = this.pos.x - total / 2;
    const y = this.pos.y - p.offsetY;
    this.pips.fillStyle(CONFIG.hud.mentalColors.outline).fillRect(x0 - 1, y - 1, total + 2, p.height + 2);
    for (let i = 0; i < this.maxHp; i++) {
      this.pips.fillStyle(i < this.hp ? p.full : p.empty).fillRect(x0 + i * (p.width + p.gap), y, p.width, p.height);
    }
  }

  get secondsLeft() {
    return Math.max(0, Math.ceil(this.lifeLeft / 1000));
  }

  leave(line) {
    this.leaving = true;
    this.ring.clear();
    this.pips.clear();
    this.folder.setVisible(false);
    // 맞아서 하얗게 번쩍이던 중에 떠나도 원래 색으로
    this.sprite.clearTint();
    this.say(line);
    this.scene.tweens.add({
      targets: [this.sprite, this.shadow],
      alpha: 0,
      delay: CONFIG.npc.bubbleTime,
      duration: CONFIG.npc.anim.leaveFade,
      onComplete: () => this.destroy(),
    });
  }

  destroy() {
    this.done = true;
    this.sprite.destroy();
    this.shadow.destroy();
    this.ring.destroy();
    this.wave.destroy();
    this.folder.destroy();
    this.pips.destroy();
    this.bubble?.destroy();
  }

  nextLine() {
    const lines = this.mode.lines;
    this.lineIndex = (this.lineIndex + 1) % lines.length;
    return lines[this.lineIndex];
  }

  // 머리 위 말풍선: 하얀 바탕에 진한 글자 (몬스터 이름표와 구분되게)
  say(line) {
    if (!line) return;
    this.bubble?.destroy();
    const b = CONFIG.npc;
    const bubble = addText(this.scene, this.pos.x, this.pos.y - b.bubbleOffsetY, line, {
      size: CONFIG.ui.smallFontSize,
      color: CONFIG.colors.outline,
      stroke: 0,
    })
      .setBackgroundColor(b.bubbleBack)
      .setPadding(3, 1, 3, 1)
      .setDepth(CONFIG.depth.flying);
    this.bubble = bubble;
    this.scene.tweens.add({
      targets: bubble,
      alpha: 0,
      delay: b.bubbleTime,
      duration: b.bubbleFade,
      onComplete: () => {
        bubble.destroy();
        if (this.bubble === bubble) this.bubble = null;
      },
    });
  }
}
