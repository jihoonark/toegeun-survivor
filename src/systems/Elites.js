import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { OFFICE_TEXTURES } from '../art/office.js';
import { addText } from './Text.js';
import { getEnemy } from '../data/enemies.js';
import { getElite } from '../data/elites.js';

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
// 지금 쓰는 기술: 단계마다 기술을 바꾸는 보스는 enemy.skill (층 규칙 finalBoss), 아니면 몬스터 데이터의 skill
export const skillOf = (enemy) => enemy.skill ?? enemy.def.skill;

export const SKILLS = {
  // 떠넘기기 (옆 팀 과장): 주인공 발밑에 예고 원 → 자기 둘레 일반 몬스터를 원 안으로 던진다
  // 떨어지는 순간 주인공이 원 안에 있으면 멘탈이 깎인다. 던져진 몬스터는 내려앉은 뒤 다시 쫓아온다
  //   skill: { range, radius, grabRadius, count, filler, flightTime, arcHeight, scatter, damage, reflectTime, reflectDamage }
  // 날아오는 몬스터를 무기로 맞히면 "반송!": 과장에게 되돌아가 reflectDamage 를 주고 그 몬스터는 처리된다
  toss: {
    aim(_elites, e, player) {
      const s = skillOf(e);
      if (Phaser.Math.Distance.Between(e.x, e.y, player.x, player.y) > s.range) return null;
      return { x: player.x, y: player.y, r: s.radius };
    },
    fire(elites, e, cast) {
      const s = skillOf(e);
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
      if (picked.length === 0) return;
      const members = picked.map((o) => {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * s.scatter;
        elites.throw(o, cast.x + Math.cos(angle) * r, cast.y + Math.sin(angle) * r, s.flightTime, s.arcHeight, e);
        return { enemy: o, spawnId: o.spawnId };
      });
      elites.landings.push({ x: cast.x, y: cast.y, r: cast.r, left: s.flightTime, damage: s.damage, members });
      scene.events.emit('elite-fire', { enemy: e });
    },
  },

  // 돌아가며 지목 (회의 진행자): 차례마다 주인공 근처 몬스터 → … → playerEvery 번째엔 주인공 발밑에 노란 예고 원
  // 원이 다 차는 순간 원 안에 있으면 hold(ms) 동안 제자리 ("의견 말씀 중…"). 지목된 몬스터도 그동안 멈춘다
  //   skill: { range, radius, playerEvery, hold, heldLabel, heldLine, color }
  spotlight: {
    aim(elites, e, player) {
      const s = skillOf(e);
      if (Phaser.Math.Distance.Between(e.x, e.y, player.x, player.y) > s.range) return null;
      e.turn = (e.turn ?? 0) + 1;
      const near = (o) => Phaser.Math.Distance.Between(o.x, o.y, player.x, player.y);
      const other =
        e.turn % s.playerEvery !== 0 &&
        elites.scene.enemies
          .getChildren()
          .filter((o) => o.active && !o.def.boss && !o.def.elite && near(o) < s.range)
          .sort((a, b) => near(a) - near(b))[0];
      const target = other || player;
      return { x: target.x, y: target.y, r: s.radius, color: s.color };
    },
    fire(elites, e, cast, player) {
      const s = skillOf(e);
      const inside = (o) => Phaser.Math.Distance.Between(o.x, o.y, cast.x, cast.y) <= cast.r;
      for (const o of elites.scene.enemies.getChildren()) {
        if (o.active && o !== e && !o.def.boss && !o.def.elite && inside(o)) o.stun(s.hold);
      }
      if (inside(player)) {
        player.freeze(s.hold, s.heldLabel);
        elites.say(e, s.heldLine);
      }
      elites.scene.events.emit('elite-fire', { enemy: e });
    },
  },
};

export default class Elites {
  constructor(scene, floor) {
    this.scene = scene;
    // 층에 나오는 엘리트의 기술이 모두 있는지 판을 시작할 때 확인한다 (등장하는 순간 멈추지 않게)
    for (const { id } of floor.elites) {
      const type = getElite(id).skill?.type;
      if (type && !SKILLS[type]) throw new Error(`알 수 없는 엘리트 기술: ${type} (${id})`);
    }
    this.marks = [];
    this.gfx = scene.add.graphics().setDepth(CONFIG.depth.floor + 1);
    this.icons = [];
    this.bubbles = [];
    // 날아가는 몬스터와, 떨어질 때 주인공을 맞히는 자리
    this.flights = [];
    this.landings = [];
  }

  // 몬스터를 (x, y) 로 포물선을 그리며 던진다. 날아가는 동안은 쫓지도, 주인공·다른 몬스터에 닿지도, 무기에 맞지도 않는다
  // by: 던진 엘리트 (반송될 때 돌아갈 곳)
  throw(enemy, x, y, ms, height, by) {
    enemy.flight = { fromX: enemy.x, fromY: enemy.y, toX: x, toY: y, t: 0, ms, height, by, bySpawnId: by?.spawnId };
    enemy.body.setVelocity(0, 0);
    enemy.body.checkCollision.none = true;
    this.flights.push({ enemy, spawnId: enemy.spawnId });
  }

  // 날아오는 몬스터에 무기가 맞으면 던진 엘리트 쪽으로 되돌린다
  reflect(enemy, projectiles) {
    const f = enemy.flight;
    if (f.reflected || !f.by?.active || f.by.spawnId !== f.bySpawnId) return;
    const aim = enemy.getAimPoint();
    for (const p of projectiles.getChildren()) {
      if (!p.active) continue;
      const reach = enemy.def.hitRadius + p.radius;
      if (Phaser.Math.Distance.Squared(aim.x, aim.y, p.x, p.y) > reach * reach) continue;
      if (!p.hit(enemy)) continue;
      const s = skillOf(f.by);
      Object.assign(f, { fromX: enemy.x, fromY: enemy.y, toX: f.by.x, toY: f.by.y, t: 0, ms: s.reflectTime, reflected: true });
      this.scene.events.emit('elite-reflect', { x: aim.x, y: aim.y });
      return;
    }
  }

  updateFlights(delta, player, projectiles) {
    this.flights = this.flights.filter(({ enemy, spawnId }) => {
      if (!enemy.active || enemy.spawnId !== spawnId || !enemy.flight) return false; // 공중에서 처치됨 (다시 나올 때 Enemy.spawn 이 되돌린다)
      const f = enemy.flight;
      if (projectiles) this.reflect(enemy, projectiles);
      f.t += delta;
      const k = Math.min(1, f.t / f.ms);
      enemy.body.reset(Phaser.Math.Linear(f.fromX, f.toX, k), Phaser.Math.Linear(f.fromY, f.toY, k));
      enemy.lift = Math.sin(Math.PI * k) * f.height;
      if (k < 1) return true;
      enemy.flight = null;
      enemy.lift = 0;
      enemy.body.checkCollision.none = false;
      // 반송된 몬스터는 던진 엘리트에게 맞고 처리된다
      if (f.reflected) {
        if (f.by.active && f.by.spawnId === f.bySpawnId) f.by.takeDamage(skillOf(f.by).reflectDamage);
        this.scene.events.emit('elite-returned', { x: enemy.x, y: enemy.y });
        enemy.kill();
      }
      return false;
    });
    // 던진 몬스터가 공중에서 처치되거나 풀에서 다른 몬스터로 다시 나왔으면 그 몬스터는 착지하지 않은 것
    this.landings = this.landings.filter((l) => {
      l.left -= delta;
      if (l.left > 0) return true;
      // 반송돼 되돌아가는 중인 몬스터는 착지한 것이 아니다
      const landed = l.members.some(({ enemy, spawnId }) => enemy.active && enemy.spawnId === spawnId && !enemy.flight);
      if (!landed) return false;
      if (Phaser.Math.Distance.Between(l.x, l.y, player.x, player.y) <= l.r) player.hurt(l.damage);
      this.scene.events.emit('elite-landing', l);
      return false;
    });
  }

  // 엘리트가 나올 때 (Spawner 가 부른다)
  prepare(enemy) {
    const s = skillOf(enemy);
    enemy.skillLeft = s ? (s.first ?? s.every) : 0;
    enemy.cast = null;
  }

  // projectiles: 무기 투사체 (날아오는 몬스터를 맞혀 반송할 때)
  update(delta, enemies, player, projectiles) {
    for (const e of enemies.getChildren()) {
      const s = e.active && skillOf(e);
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
    this.updateFlights(delta, player, projectiles);
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
      const color = c.color ?? t.color;
      this.gfx.fillStyle(color, Phaser.Math.Linear(t.fillFrom, t.fillTo, p)).fillCircle(c.x, c.y, c.r);
      // 바깥 선은 고정, 안쪽 원이 바깥까지 차오르면 실행
      this.gfx.lineStyle(t.outerLine, color, t.lineAlpha).strokeCircle(c.x, c.y, c.r);
      this.gfx.lineStyle(t.innerLine, color, t.lineAlpha).strokeCircle(c.x, c.y, Math.max(t.minRadius, c.r * p));
      const icon = (this.icons[used++] ??= this.scene.add.image(0, 0, OFFICE_TEXTURES.alert).setDepth(CONFIG.depth.flying));
      icon.setVisible(true).setScale(t.iconScale).setPosition(e.x + t.iconOffsetX * e.baseScale, e.y - t.iconOffsetY * e.baseScale);
    }
    // 던진 몬스터가 떨어지는 자리: 꽉 찬 원으로 남겨 둔다
    for (const l of this.landings) {
      this.marks.push(l);
      this.gfx.fillStyle(t.color, t.fillTo).fillCircle(l.x, l.y, l.r);
      this.gfx.lineStyle(t.innerLine, t.color, t.lineAlpha).strokeCircle(l.x, l.y, l.r);
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
      .setPadding(b.padX, b.padY, b.padX, b.padY)
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
