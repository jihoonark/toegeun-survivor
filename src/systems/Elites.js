import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { OFFICE_TEXTURES } from '../art/office.js';
import { addText } from './Text.js';
import { getEnemy } from '../data/enemies.js';

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
export const SKILLS = {
  // 떠넘기기 (옆 팀 과장): 주인공 발밑에 예고 원 → 자기 둘레 일반 몬스터를 원 안으로 던진다
  // 떨어지는 순간 주인공이 원 안에 있으면 멘탈이 깎인다. 던져진 몬스터는 내려앉은 뒤 다시 쫓아온다
  //   skill: { range, radius, grabRadius, count, filler, flightTime, arcHeight, scatter, damage }
  toss: {
    aim(_elites, e, player) {
      const s = e.def.skill;
      if (Phaser.Math.Distance.Between(e.x, e.y, player.x, player.y) > s.range) return null;
      return { x: player.x, y: player.y, r: s.radius };
    },
    fire(elites, e, cast) {
      const s = e.def.skill;
      const scene = elites.scene;
      const dist = (o) => Phaser.Math.Distance.Between(o.x, o.y, e.x, e.y);
      const picked = scene.enemies
        .getChildren()
        .filter((o) => o.active && o !== e && !o.def.boss && !o.def.elite && !o.flight && dist(o) < s.grabRadius)
        .sort((a, b) => dist(a) - dist(b))
        .slice(0, s.count);
      while (picked.length < s.count) {
        const o = scene.spawner.spawnAt(getEnemy(s.filler), e.x, e.y);
        if (!o) break;
        picked.push(o);
      }
      for (const o of picked) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * s.scatter;
        elites.throw(o, cast.x + Math.cos(angle) * r, cast.y + Math.sin(angle) * r, s.flightTime, s.arcHeight);
      }
      elites.landings.push({ x: cast.x, y: cast.y, r: cast.r, left: s.flightTime, damage: s.damage });
      scene.events.emit('elite-fire', { enemy: e });
    },
  },
};

export default class Elites {
  constructor(scene) {
    this.scene = scene;
    this.marks = [];
    this.gfx = scene.add.graphics().setDepth(CONFIG.depth.floor + 1);
    this.icons = [];
    this.bubbles = [];
    // 날아가는 몬스터와, 떨어질 때 주인공을 맞히는 자리
    this.flights = [];
    this.landings = [];
  }

  // 몬스터를 (x, y) 로 포물선을 그리며 던진다. 날아가는 동안은 쫓지도, 주인공에게 닿지도 않는다
  throw(enemy, x, y, ms, height) {
    enemy.flight = { fromX: enemy.x, fromY: enemy.y, toX: x, toY: y, t: 0, ms, height };
    enemy.body.setVelocity(0, 0);
    this.flights.push({ enemy, spawnId: enemy.spawnId });
  }

  updateFlights(delta, player) {
    this.flights = this.flights.filter(({ enemy, spawnId }) => {
      if (!enemy.active || enemy.spawnId !== spawnId || !enemy.flight) return false;
      const f = enemy.flight;
      f.t += delta;
      const k = Math.min(1, f.t / f.ms);
      enemy.body.reset(Phaser.Math.Linear(f.fromX, f.toX, k), Phaser.Math.Linear(f.fromY, f.toY, k));
      enemy.lift = Math.sin(Math.PI * k) * f.height;
      if (k < 1) return true;
      enemy.flight = null;
      enemy.lift = 0;
      return false;
    });
    this.landings = this.landings.filter((l) => {
      l.left -= delta;
      if (l.left > 0) return true;
      if (Phaser.Math.Distance.Between(l.x, l.y, player.x, player.y) <= l.r) player.hurt(l.damage);
      this.scene.events.emit('elite-landing', l);
      return false;
    });
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
    this.updateFlights(delta, player);
    this.updateBubbles(delta);
    this.draw(enemies);
  }

  // 예고 원과 머리 옆 "!"
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
      icon.setVisible(true).setScale(t.iconScale).setPosition(e.x + t.iconOffsetX * e.baseScale, e.y - t.iconOffsetY * e.baseScale);
    }
    // 던진 몬스터가 떨어지는 자리: 꽉 찬 원으로 남겨 둔다
    for (const l of this.landings) {
      this.marks.push(l);
      this.gfx.fillStyle(t.color, t.fillTo).fillCircle(l.x, l.y, l.r);
      this.gfx.lineStyle(2, t.color, t.lineAlpha).strokeCircle(l.x, l.y, l.r);
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
