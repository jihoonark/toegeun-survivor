import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { ENEMIES } from '../data/enemies.js';
import Enemy from '../entities/Enemy.js';
import { ENEMY_ART } from '../art/enemies.js';

// 적 등장: 일정 간격으로 카메라 화면 바로 바깥에서 몬스터를 하나 꺼낸다
export default class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.timeLeft = CONFIG.spawn.firstDelay;
    this.enemies = scene.physics.add.group({ classType: Enemy, maxSize: CONFIG.spawn.maxAlive });
    this.totalWeight = ENEMIES.reduce((sum, e) => sum + e.spawnWeight, 0);

    if (CONFIG.enemy.separate) scene.physics.add.collider(this.enemies, this.enemies);
  }

  update(delta) {
    this.timeLeft -= delta;
    if (this.timeLeft > 0) return;
    this.timeLeft += CONFIG.spawn.interval;
    this.spawnOne();
  }

  pickEnemy() {
    let roll = Math.random() * this.totalWeight;
    for (const def of ENEMIES) {
      roll -= def.spawnWeight;
      if (roll < 0) return def;
    }
    return ENEMIES[ENEMIES.length - 1];
  }

  spawnOne() {
    const pos = this.offscreenPoint();
    if (!pos) return;
    const enemy = this.enemies.get();
    if (!enemy) return; // 최대 수에 도달
    enemy.spawn(this.pickEnemy(), pos.x, pos.y);
  }

  // 화면 밖이면서 사무실 안인 곳. 화면이 사무실 끝에 붙어 있으면 그쪽 변은 빼고 고른다
  offscreenPoint() {
    const view = this.scene.cameras.main.worldView;
    const m = CONFIG.spawn.offscreenMargin;
    const { worldWidth: W, worldHeight: H } = CONFIG.office;
    const rnd = Phaser.Math.Between;
    // 변을 따라 고르는 범위도 화면 근처로 좁혀 너무 먼 곳에서 나오지 않게 한다
    const x0 = Math.max(0, view.left - m);
    const x1 = Math.min(W, view.right + m);
    const y0 = Math.max(0, view.top - m);
    const y1 = Math.min(H, view.bottom + m);
    // 좌표는 발밑이므로 아래쪽은 몸 높이만큼 더 내려야 머리가 보이지 않는다
    const below = view.bottom + m + ENEMY_ART.size;

    const sides = [];
    if (view.top - m >= 0) sides.push(() => ({ x: rnd(x0, x1), y: view.top - m }));
    if (below <= H) sides.push(() => ({ x: rnd(x0, x1), y: below }));
    if (view.left - m >= 0) sides.push(() => ({ x: view.left - m, y: rnd(y0, y1) }));
    if (view.right + m <= W) sides.push(() => ({ x: view.right + m, y: rnd(y0, y1) }));
    if (sides.length === 0) return null;
    return Phaser.Utils.Array.GetRandom(sides)();
  }
}
