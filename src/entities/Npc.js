import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { HERO } from '../art/hero.js';
import { NPC_ART, npcTexture } from '../art/npcs.js';
import { getEnemy } from '../data/enemies.js';
import { addText } from '../systems/Text.js';

// 사무실 NPC: 자리 이벤트 결과로 나타나 주인공 뒤를 따라다닌다 (몬스터와 부딪히지 않는다)
//   ally   가까운 몬스터를 대신 처리해 준다
//   pester 주인공 쪽으로 일을 몰고 온다 (메신저 읽씹의 대가)
export default class Npc {
  constructor(scene, def, mode, x, y) {
    this.scene = scene;
    this.def = def;
    this.modeName = mode;
    this.mode = def.modes[mode];
    this.timer = this.mode.interval;
    this.lineIndex = 0;
    this.walkTime = 0;

    this.shadow = scene.add.image(x, y, HERO.shadow);
    this.sprite = scene.add.image(x, y, npcTexture(def.art)).setOrigin(0.5, NPC_ART.footY / NPC_ART.size);
    this.pos = new Phaser.Math.Vector2(x, y);
    if (this.mode.mark) {
      this.mark = addText(scene, x, y, this.mode.mark, { size: CONFIG.ui.smallFontSize, color: CONFIG.colors.danger });
    }
    this.say(this.mode.lines[0]);
  }

  update(delta, player, spawner) {
    this.followPlayer(delta, player);
    this.timer -= delta;
    if (this.timer > 0) return;
    this.timer += this.mode.interval;
    if (this.modeName === 'ally') this.help(spawner);
    else if (this.modeName === 'pester') this.pester(spawner, player);
  }

  // 주인공이 움직인 반대쪽 뒤에 붙어 다닌다
  followPlayer(delta, player) {
    const { distance, speed } = this.def.follow;
    const target = new Phaser.Math.Vector2(player.x - distance, player.y + 2);
    const toTarget = target.clone().subtract(this.pos);
    const len = toTarget.length();
    const step = (speed * delta) / 1000;
    const moving = len > 2;
    if (moving) this.pos.add(toTarget.scale(Math.min(1, step / len)));
    if (moving) this.sprite.setFlipX(toTarget.x < 0);
    // 걸을 때 살짝 통통
    this.walkTime = moving ? this.walkTime + delta : 0;
    const bob = moving ? Math.abs(Math.sin(this.walkTime / 90)) * 2 : 0;
    this.sprite.setPosition(this.pos.x, this.pos.y - bob).setDepth(this.pos.y);
    this.shadow.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y - 1);
    this.mark?.setPosition(this.pos.x, this.pos.y - CONFIG.npc.markOffsetY).setDepth(CONFIG.depth.flying);
    this.bubble?.setPosition(this.pos.x, this.pos.y - CONFIG.npc.bubbleOffsetY);
  }

  // 사거리 안 가장 가까운 몬스터를 한 대 친다 (보스는 덜 아프게 하지 않고 똑같이)
  help(spawner) {
    const { range, damage } = this.mode;
    let best = null;
    let bestDist = range;
    for (const e of spawner.enemies.getChildren()) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, e.x, e.y);
      if (d < bestDist) {
        best = e;
        bestDist = d;
      }
    }
    if (!best) return;
    const aim = best.getAimPoint();
    const vx = best.x - this.pos.x;
    const vy = best.y - this.pos.y;
    best.takeDamage(damage);
    this.scene.events.emit('enemy-hit', { enemy: best, damage, x: aim.x, y: aim.y, vx, vy, weapon: CONFIG.npc.allyHit });
    this.say(this.nextLine());
  }

  // 메일을 몰고 와서 주인공 근처에 풀어 놓는다
  pester(spawner, player) {
    const def = getEnemy(this.mode.enemy);
    for (let i = 0; i < this.mode.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = CONFIG.npc.pesterRadius;
      spawner.spawnAt(def, this.pos.x + Math.cos(angle) * r, this.pos.y + Math.sin(angle) * r);
    }
    this.say(this.nextLine());
  }

  nextLine() {
    const lines = this.mode.lines;
    this.lineIndex = (this.lineIndex + 1) % lines.length;
    return lines[this.lineIndex];
  }

  // 머리 위 말풍선 글자. 잠깐 떠 있다 사라진다
  say(line) {
    if (!line) return;
    this.bubble?.destroy();
    const b = CONFIG.npc;
    this.bubble = addText(this.scene, this.pos.x, this.pos.y - b.bubbleOffsetY, line, { size: CONFIG.ui.smallFontSize })
      .setDepth(CONFIG.depth.flying);
    const bubble = this.bubble;
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
