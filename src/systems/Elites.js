import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { OFFICE_TEXTURES } from '../art/office.js';
import { addText } from './Text.js';

// 엘리트 기술 (GAME_SPEC.md 12장 "엘리트")
// skill 이 있는 몬스터는 first 뒤, 그다음엔 every 마다 기술을 쓴다
//   1) 노리기(aim): 기술마다 바닥에 예고 원을 정하고, 엘리트는 멈춰서 머리 위에 "!"와 대사 말풍선
//   2) telegraph(ms) 동안 예고 원이 점점 진해진다. 이때 원 밖으로 피하면 된다
//   3) 실행(fire)
// 예고 원 목록은 this.marks 로 읽을 수 있다 (자동 시험 봇이 피할 때 쓴다)
//
// 새 기술은 SKILLS 에 { aim, fire } 를 추가하고, elites.js 항목의 skill.type 으로 부른다
//   aim(elites, enemy, player)  → { x, y, r, ... } 예고 원 (null 이면 이번엔 쓰지 않고 config elite.retry 뒤 다시)
//   fire(elites, enemy, cast, player)
export const SKILLS = {};

export default class Elites {
  constructor(scene) {
    this.scene = scene;
    this.marks = [];
    this.gfx = scene.add.graphics().setDepth(CONFIG.depth.floor + 1);
    this.icons = [];
    this.bubbles = [];
  }

  // 엘리트가 나올 때 (Spawner 가 부른다)
  prepare(enemy) {
    const s = enemy.def.skill;
    enemy.skillLeft = s ? (s.first ?? s.every) : 0;
    enemy.cast = null;
  }

  update(delta, enemies, player) {
    for (const e of enemies.getChildren()) {
      const s = e.active && e.def.skill;
      if (!s) continue;
      const skill = SKILLS[s.type];
      if (!skill) throw new Error(`알 수 없는 엘리트 기술: ${s.type}`);
      if (e.cast) {
        e.cast.left -= delta;
        if (e.cast.left > 0) continue;
        const cast = e.cast;
        e.cast = null;
        e.skillLeft = s.every;
        skill.fire(this, e, cast, player);
        continue;
      }
      if (e.stunLeft > 0) continue;
      e.skillLeft -= delta;
      if (e.skillLeft > 0) continue;
      const cast = skill.aim(this, e, player);
      if (!cast) {
        e.skillLeft = CONFIG.elite.retry;
        continue;
      }
      cast.left = s.telegraph;
      cast.total = s.telegraph;
      e.cast = cast;
      if (s.lines?.length) this.say(e, Phaser.Utils.Array.GetRandom(s.lines));
      this.scene.events.emit('elite-aim', { enemy: e, cast });
    }
    this.updateBubbles(delta);
    this.draw(enemies);
  }

  // 예고 원과 머리 위 "!"
  draw(enemies) {
    const t = CONFIG.elite.telegraph;
    this.gfx.clear();
    this.marks.length = 0;
    let used = 0;
    for (const e of enemies.getChildren()) {
      if (!e.active || !e.cast) continue;
      const c = e.cast;
      const p = 1 - c.left / c.total;
      this.marks.push(c);
      this.gfx.fillStyle(t.color, Phaser.Math.Linear(t.fillFrom, t.fillTo, p)).fillCircle(c.x, c.y, c.r);
      // 바깥 선은 고정, 안쪽 원이 바깥까지 차오르면 실행
      this.gfx.lineStyle(1, t.color, t.lineAlpha).strokeCircle(c.x, c.y, c.r);
      this.gfx.lineStyle(2, t.color, t.lineAlpha).strokeCircle(c.x, c.y, Math.max(1, c.r * p));
      const icon = (this.icons[used++] ??= this.scene.add.image(0, 0, OFFICE_TEXTURES.alert).setDepth(CONFIG.depth.flying));
      icon.setVisible(true).setScale(t.iconScale).setPosition(e.x, e.y - t.iconOffsetY * e.baseScale);
    }
    for (let i = used; i < this.icons.length; i++) this.icons[i].setVisible(false);
  }

  // 머리 위 대사 말풍선 (엘리트를 따라다니다 사라진다)
  say(enemy, line) {
    const b = CONFIG.elite.bubble;
    this.bubbles.find((x) => x.enemy === enemy)?.text.destroy();
    this.bubbles = this.bubbles.filter((x) => x.enemy !== enemy);
    const text = addText(this.scene, enemy.x, enemy.y, line, { size: CONFIG.ui.smallFontSize, color: b.color, stroke: 0 })
      .setBackgroundColor(b.back)
      .setPadding(3, 1, 3, 1)
      .setDepth(CONFIG.depth.flying);
    this.bubbles.push({ enemy, spawnId: enemy.spawnId, text, left: b.time });
  }

  updateBubbles(delta) {
    const b = CONFIG.elite.bubble;
    this.bubbles = this.bubbles.filter((x) => {
      x.left -= delta;
      const gone = x.left <= 0 || !x.enemy.active || x.enemy.spawnId !== x.spawnId;
      if (gone) {
        x.text.destroy();
        return false;
      }
      x.text.setAlpha(Math.min(1, x.left / b.fade));
      x.text.setPosition(x.enemy.x, x.enemy.y - b.offsetY * x.enemy.baseScale);
      return true;
    });
  }
}
