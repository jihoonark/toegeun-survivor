import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { getEnemy } from '../data/enemies.js';

// 층 특별 규칙 (GAME_SPEC.md 12장 "층 구성"). 층 데이터 rules 의 type 으로 부른다
// 새 규칙은 RULES 에 클래스를 추가하면 된다: new Rule(scene, 데이터 항목), update(delta, minutes, player)
//
// 장면 이벤트
//   'meeting-door'  { room, count }   회의실 문이 열려 몬스터가 쏟아질 때
//   'meeting-stop'  { room }          주인공이 회의실에 들어가 붙잡혔을 때
export const RULES = {
  // 회의실 문이 수시로 열리며 몬스터가 쏟아진다
  // 문이 먼저 번쩍이며 "회의 끝!"이 뜨고, config rooms.doorOpenTime 뒤에 몬스터가 나온다 (피할 틈)
  //   { type: 'meetingDoors', first, every(ms), count: [최소, 최대], enemy,
  //     range(px): 주인공에게서 이 거리 안 회의실만, minDistance(px): 이보다 가까운 문은 열지 않는다 (주인공이 있는 회의실도),
  //     push: { strength(px/초), duration(ms), spread: 부채꼴 벌어짐 } 문 밖으로 튀어 나가는 세기,
  //     inset(px): 문에서 이만큼 안쪽에서 나온다, label: 문 위 글자 }
  meetingDoors: class {
    constructor(scene, rule) {
      this.scene = scene;
      this.rule = rule;
      this.left = rule.first;
    }

    update(delta, _minutes, player) {
      this.left -= delta;
      if (this.left > 0) return;
      this.left += this.rule.every;
      const { rooms } = this.scene;
      const inside = rooms.roomAt(player.x, player.y);
      const near = rooms.rooms.filter((r) => {
        const d = Phaser.Math.Distance.Between(r.door.x, r.door.y, player.x, player.y);
        return r !== inside && d <= this.rule.range && d >= this.rule.minDistance;
      });
      const room = Phaser.Utils.Array.GetRandom(near);
      if (!room) return;
      rooms.openDoor(room, this.rule.label);
      this.scene.time.delayedCall(CONFIG.rooms.doorOpenTime, () => this.release(room));
    }

    release(room) {
      if (this.scene.ended) return;
      const def = getEnemy(this.rule.enemy);
      const count = Phaser.Math.Between(...this.rule.count);
      const { strength, duration, spread: fan } = this.rule.push;
      const inset = this.rule.inset;
      for (let i = 0; i < count; i++) {
        // 문 바로 안쪽에서 나와 문 밖으로 부채꼴로 튀어 나간다
        const spread = (i - (count - 1) / 2) * fan;
        const dx = room.out[0] + (room.out[1] ? spread : 0);
        const dy = room.out[1] + (room.out[0] ? spread : 0);
        const enemy = this.scene.spawner.spawnAt(def, room.door.x - room.out[0] * inset, room.door.y - room.out[1] * inset);
        enemy?.knockback(dx, dy, strength, duration);
      }
      this.scene.events.emit('meeting-door', { room, count });
    }
  },

  // 회의실 안에 들어가면 hold(ms) 동안 못 움직인다 ("회의 중"). 나왔다 다시 들어가면 또 붙잡힌다
  //   { type: 'meetingStop', hold, label }
  meetingStop: class {
    constructor(scene, rule) {
      this.scene = scene;
      this.rule = rule;
      this.inside = null;
    }

    update(_delta, _minutes, player) {
      const room = this.scene.rooms.roomAt(player.x, player.y);
      if (room && room !== this.inside) {
        player.freeze(this.rule.hold, this.rule.label);
        this.scene.events.emit('meeting-stop', { room });
      }
      this.inside = room;
    }
  },
};

// 17:59 최종 보스 (5화 13층): 시계가 at(분)에서 멈추고 보스가 나온다. 보스를 퇴근시켜야 18:00 이 되어 계단이 열린다
//   { type: 'finalBoss', at, enemy, warning, phases: [{ below, line, warning, skill, spawn: { id, count, radius } }], tempo }
//   phases: 보스 체력 비율이 below 아래로 내려가면 그 단계 (기술은 systems/Elites.js SKILLS, 데이터 모양은 data/elites.js skill)
//           line 말풍선, warning 화면 글자, spawn 단계에 들어갈 때 보스 둘레에 한 번 불러내는 몬스터
//   tempo: 보스가 있는 동안 음악 빠르기 배율
RULES.finalBoss = class {
  constructor(scene, rule) {
    this.scene = scene;
    this.rule = rule;
    this.boss = null;
    this.done = false;
    this.phase = -1;
    scene.events.on('enemy-killed', ({ enemy }) => {
      if (!this.boss || enemy !== this.boss || enemy.spawnId !== this.bossSpawnId) return;
      this.done = true;
      this.boss = null;
      scene.clockHold = null;
      scene.musicBoost = 1;
      scene.skipClockTo(scene.shiftEnd());
    });
  }

  update(_delta, minutes) {
    if (this.done) return;
    const scene = this.scene;
    if (!this.boss) {
      if (minutes < this.rule.at) return;
      scene.clockHold = this.rule.at;
      this.boss = scene.spawner.spawnImportant(getEnemy(this.rule.enemy));
      if (!this.boss) return; // 몬스터가 꽉 찼으면 다음 프레임에 다시
      this.bossSpawnId = this.boss.spawnId;
      scene.events.emit('boss-spawned', { enemy: this.boss });
      scene.hud.showWarning(this.rule.warning, CONFIG.colors.danger);
      scene.musicBoost = this.rule.tempo ?? 1;
      return;
    }
    const ratio = this.boss.hp / this.boss.maxHp;
    const next = this.rule.phases.findIndex((p, i) => i > this.phase && ratio <= p.below);
    if (next < 0) return;
    this.phase = next;
    const p = this.rule.phases[next];
    this.boss.skill = p.skill;
    this.boss.skillLeft = p.skill.first ?? p.skill.every;
    this.boss.cast = null;
    if (p.line) scene.elites.say(this.boss, p.line);
    if (p.warning) scene.hud.showWarning(p.warning, CONFIG.colors.accent);
    if (p.spawn) {
      const def = getEnemy(p.spawn.id);
      for (let i = 0; i < p.spawn.count; i++) {
        const a = (i / p.spawn.count) * Math.PI * 2;
        scene.spawner.spawnAt(def, this.boss.x + Math.cos(a) * p.spawn.radius, this.boss.y + Math.sin(a) * p.spawn.radius);
      }
    }
  }
};

export default class FloorRules {
  constructor(scene, floor) {
    this.rules = floor.rules.map((rule) => {
      const Rule = RULES[rule.type];
      if (!Rule) throw new Error(`알 수 없는 층 규칙: ${rule.type}`);
      return new Rule(scene, rule);
    });
  }

  update(delta, minutes, player) {
    for (const rule of this.rules) rule.update(delta, minutes, player);
  }
}
