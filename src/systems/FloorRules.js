import Phaser from 'phaser';
import { getEnemy } from '../data/enemies.js';

// 층 특별 규칙 (GAME_SPEC.md 12장 "층 구성"). 층 데이터 rules 의 type 으로 부른다
// 새 규칙은 RULES 에 클래스를 추가하면 된다: new Rule(scene, 데이터 항목), update(delta, minutes, player)
//
// 장면 이벤트
//   'meeting-door'  { room, count }   회의실 문이 열려 몬스터가 쏟아질 때
//   'meeting-stop'  { room }          주인공이 회의실에 들어가 붙잡혔을 때
export const RULES = {
  // 회의실 문이 수시로 열리며 몬스터가 쏟아진다
  //   { type: 'meetingDoors', first, every(ms), count: [최소, 최대], enemy, range(px): 주인공에게서 이 거리 안 회의실만,
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
      const near = rooms.rooms.filter((r) => Phaser.Math.Distance.Between(r.door.x, r.door.y, player.x, player.y) <= this.rule.range);
      const room = Phaser.Utils.Array.GetRandom(near);
      if (!room) return;
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
      rooms.openDoor(room, this.rule.label);
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
