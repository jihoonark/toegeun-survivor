import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { ENEMIES, getEnemy } from '../data/enemies.js';
import Enemy from '../entities/Enemy.js';
import { ENEMY_ART } from '../art/enemies.js';

// 적 등장: 카메라 화면 바로 바깥에서 몬스터를 꺼낸다
// - 시간대별 난이도(config spawn.stages): 시간이 갈수록 자주, 여러 마리씩, 튼튼하고 빠르게
// - 몬스터의 appearAt 이 지나야 그 몬스터가 나온다
// - 몰려오는 패턴(config spawn.waves): 정해진 시각에 "전체 회신 폭탄"(빙 둘러) 또는 한쪽에서 줄지어
// - splitInto 가 있는 몬스터는 처치하면 다음 프레임에 그 자리에서 쪼개져 나온다
//
// 장면 이벤트
//   'mail-bomb'  { count }   전체 회신 폭탄(ring)이 터질 때 (경고 글자에서 쓴다)
export default class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.timeLeft = CONFIG.spawn.firstDelay;
    this.enemies = scene.physics.add.group({ classType: Enemy, maxSize: CONFIG.spawn.maxAlive });
    this.wavesDone = new Set();
    this.splits = [];

    if (CONFIG.enemy.separate) scene.physics.add.collider(this.enemies, this.enemies);
    // 처치 이벤트를 듣는 다른 곳(타격감 등)이 같은 몬스터 오브젝트를 읽은 뒤에 꺼내도록 모아 두었다가 다음 update 에서 꺼낸다
    scene.events.on('enemy-killed', ({ def, x, y }) => {
      if (def.splitInto) this.splits.push({ def: getEnemy(def.splitInto.id), count: def.splitInto.count, x, y });
    });
  }

  // 지금 시각의 난이도: 앞뒤 단계 사이를 부드럽게 잇는다 (batch 는 지난 단계 값)
  difficulty(minutes) {
    const stages = CONFIG.spawn.stages;
    let i = stages.length - 1;
    while (i > 0 && stages[i].at > minutes) i--;
    const a = stages[i];
    const b = stages[i + 1];
    const t = b ? Phaser.Math.Clamp((minutes - a.at) / (b.at - a.at), 0, 1) : 0;
    const mix = (key) => (b ? Phaser.Math.Linear(a[key], b[key], t) : a[key]);
    return { interval: mix('interval'), batch: a.batch, boost: { hp: mix('hp'), speed: mix('speed') } };
  }

  update(delta, minutes) {
    const level = this.difficulty(minutes);
    this.boost = level.boost;
    this.releaseSplits();

    for (const wave of CONFIG.spawn.waves) {
      if (minutes < wave.at || this.wavesDone.has(wave)) continue;
      this.wavesDone.add(wave);
      if (wave.type === 'ring') this.mailBomb(wave.count, minutes);
      else this.line(wave, minutes);
    }

    this.timeLeft -= delta;
    if (this.timeLeft > 0) return;
    this.timeLeft += level.interval * CONFIG.spawn.intervalMultiplier;
    const [min, max] = level.batch;
    const count = Phaser.Math.Between(min, max);
    for (let i = 0; i < count; i++) this.spawnOne(minutes);
  }

  releaseSplits() {
    const { strength, duration } = CONFIG.spawn.splitPop;
    for (const { def, count, x, y } of this.splits.splice(0)) {
      for (let i = 0; i < count; i++) {
        // 원래 자리에서 서로 반대 방향으로 튀어 나간다
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const enemy = this.spawnAt(def, x + Math.cos(angle) * 4, y + Math.sin(angle) * 4);
        enemy?.knockback(Math.cos(angle), Math.sin(angle), strength, duration);
      }
    }
  }

  pickEnemy(minutes) {
    const pool = ENEMIES.filter((e) => e.spawnWeight > 0 && minutes >= (e.appearAt ?? 0));
    let roll = Math.random() * pool.reduce((sum, e) => sum + e.spawnWeight, 0);
    for (const def of pool) {
      roll -= def.spawnWeight;
      if (roll < 0) return def;
    }
    return pool[pool.length - 1];
  }

  spawnAt(def, x, y) {
    const enemy = this.enemies.get();
    if (!enemy) return null; // 최대 수에 도달
    enemy.spawn(def, x, y, this.boost);
    return enemy;
  }

  spawnOne(minutes) {
    const pos = this.offscreenPoint();
    if (pos) this.spawnAt(this.pickEnemy(minutes), pos.x, pos.y);
  }

  // 전체 회신 폭탄: 화면 바로 바깥 원 위에 고르게 늘어놓는다 (사무실 밖으로 나가면 안쪽으로 당긴다)
  mailBomb(count, minutes) {
    const view = this.scene.cameras.main.worldView;
    const { worldWidth: W, worldHeight: H } = CONFIG.office;
    const { x: px, y: py } = this.scene.player;
    const radius = Math.hypot(view.width, view.height) / 2 + CONFIG.spawn.offscreenMargin;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const x = Phaser.Math.Clamp(px + Math.cos(angle) * radius, 0, W);
      const y = Phaser.Math.Clamp(py + Math.sin(angle) * radius, 0, H);
      this.spawnAt(this.pickEnemy(minutes), x, y);
    }
    this.scene.events.emit('mail-bomb', { count });
  }

  // 한쪽 변 바깥에서 줄지어 나온다. 변은 사무실 안쪽으로 열린 곳 중에서 고른다
  line({ count, gap, enemy }, minutes) {
    const view = this.scene.cameras.main.worldView;
    const m = CONFIG.spawn.offscreenMargin;
    const { worldWidth: W, worldHeight: H } = CONFIG.office;
    const length = (count - 1) * gap;
    const sides = [];
    if (view.left - m >= 0) sides.push({ x: view.left - m, y: view.centerY, dx: 0, dy: 1 });
    if (view.right + m <= W) sides.push({ x: view.right + m, y: view.centerY, dx: 0, dy: 1 });
    if (view.top - m >= 0) sides.push({ x: view.centerX, y: view.top - m, dx: 1, dy: 0 });
    if (view.bottom + m + ENEMY_ART.size <= H) sides.push({ x: view.centerX, y: view.bottom + m + ENEMY_ART.size, dx: 1, dy: 0 });
    const side = Phaser.Utils.Array.GetRandom(sides);
    if (!side) return;
    const def = enemy ? getEnemy(enemy) : this.pickEnemy(minutes);
    for (let i = 0; i < count; i++) {
      const t = i * gap - length / 2;
      this.spawnAt(def, Phaser.Math.Clamp(side.x + side.dx * t, 0, W), Phaser.Math.Clamp(side.y + side.dy * t, 0, H));
    }
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
