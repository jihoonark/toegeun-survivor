import Phaser from 'phaser';

// 자동 시험 (개발 서버에서만). 브라우저 콘솔에서:
//   await __sim.runMany({ floor: 15, bot: 'mover', runs: 6 })
// 봇 종류
//   idle   가만히 서 있는다 (난이도 하한: 이 봇은 야근해야 한다)
//   mover  몬스터·말풍선·엘리트 예고 원을 피해 다니고, 계단이 열리면 계단으로 간다 (회의실 안에는 들어가지 않는다)
// 게임 루프를 멈추고 한 프레임씩 직접 돌려서, 창이 숨겨져 있어도 같은 속도로 돈다
// 이 파일의 숫자는 시험 봇의 성격일 뿐 게임 수치가 아니다

const FRAME = 1000 / 60;
const DIRS = Array.from({ length: 16 }, (_, i) => new Phaser.Math.Vector2(Math.cos((i / 16) * Math.PI * 2), Math.sin((i / 16) * Math.PI * 2)));
const STILL = new Phaser.Math.Vector2(0, 0);
const BOT_BASE = {
  look: [20, 48, 90], // 몇 px 앞을 내다보는지
  dangerRange: 220, // 이 거리 안의 몬스터만 무서워한다
  shotRange: 90,
  markWeight: 60, // 예고 원 안이면 크게 감점
  edgeMargin: 20,
  centerPull: 10, // 구석에 몰리지 않게 가운데 쪽으로 (사람처럼 맵 가운데를 지킨다)
  stairsWeight: 0.06, // 계단까지 남은 길(px)당 감점
  roomWeight: 50, // 회의실 안 감점
  keepDir: 0.15, // 방금 가던 방향 유지 보너스
  grid: 16, // 계단 길찾기 칸 크기(px)
};
const BOT = BOT_BASE;

const yieldNow = () => new Promise((resolve) => {
  const ch = new MessageChannel();
  ch.port1.onmessage = () => resolve();
  ch.port2.postMessage(0);
});

function rectsOf(scene) {
  const blocks = [];
  for (const z of scene.furniture?.getChildren() ?? []) blocks.push({ x: z.x - z.width / 2, y: z.y - z.height / 2, w: z.width, h: z.height });
  for (const w of scene.walls?.getChildren() ?? []) blocks.push({ x: w.x - w.width / 2, y: w.y - w.height / 2, w: w.width, h: w.height });
  return blocks;
}

const inRect = (x, y, r, pad = 0) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;

// p → q 직선이 막힌 칸을 지나는지 (몇 점만 찍어 본다)
function blocked(blocks, px, py, qx, qy, pad) {
  for (let t = 0.25; t <= 1.001; t += 0.25) {
    const x = px + (qx - px) * t;
    const y = py + (qy - py) * t;
    if (blocks.some((r) => inRect(x, y, r, pad))) return true;
  }
  return false;
}

// 계단까지 칸 단위 거리 (막힌 칸을 돌아간다)
function distanceField(scene, blocks, tx, ty) {
  const g = BOT.grid;
  const { width, height } = scene.floor.map;
  const cols = Math.ceil(width / g);
  const rows = Math.ceil(height / g);
  const dist = new Float32Array(cols * rows).fill(Infinity);
  const free = (c, r) => !blocks.some((b) => inRect(c * g + g / 2, r * g + g / 2, b, 5));
  const start = Math.floor(ty / g) * cols + Math.floor(tx / g);
  dist[start] = 0;
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const c = cur % cols;
    const r = (cur - c) / cols;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const n = nr * cols + nc;
      if (dist[n] !== Infinity || !free(nc, nr)) continue;
      dist[n] = dist[cur] + g;
      queue.push(n);
    }
  }
  return (x, y) => {
    const c = Phaser.Math.Clamp(Math.floor(x / g), 0, cols - 1);
    const r = Phaser.Math.Clamp(Math.floor(y / g), 0, rows - 1);
    const d = dist[r * cols + c];
    return d === Infinity ? 1e5 : d;
  };
}

function makeMover(scene, tune = {}) {
  const BOT = { ...BOT_BASE, ...tune };
  const blocks = rectsOf(scene);
  const rooms = scene.floorRules?.rooms ?? [];
  const { width, height } = scene.floor.map;
  let last = STILL;
  let field = null;
  return () => {
    const p = scene.player;
    const stairs = scene.stairs?.open ? scene.stairs : null;
    if (stairs && !field) field = distanceField(scene, blocks, stairs.x, stairs.y);
    const enemies = scene.enemies.getChildren().filter((e) => e.active && Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y) < BOT.dangerRange + 60);
    const shots = scene.enemyShots.pool.filter((s) => s.active);
    const marks = scene.elites?.marks ?? [];
    const score = (x, y) => {
      let s = 0;
      for (const e of enemies) {
        const d = Math.max(6, Phaser.Math.Distance.Between(e.x, e.y, x, y));
        if (d < BOT.dangerRange) s += (e.def.boss || e.def.elite ? 3 : 1) * (e.def.contactDamage ?? 1) * 900 / (d * d);
      }
      for (const sh of shots) {
        const d = Math.max(6, Phaser.Math.Distance.Between(sh.x, sh.y, x, y - 12));
        if (d < BOT.shotRange) s += 600 / (d * d);
      }
      for (const m of marks) if (Phaser.Math.Distance.Between(m.x, m.y, x, y) < m.r + 6) s += BOT.markWeight;
      for (const r of rooms) if (inRect(x, y, r)) s += BOT.roomWeight;
      const m = BOT.edgeMargin;
      if (x < m || y < m || x > width - m || y > height - m) s += 5;
      s += BOT.centerPull * (Math.abs(x - width / 2) / width + Math.abs(y - height / 2) / height);
      if (field) s += BOT.stairsWeight * field(x, y);
      return s;
    };
    let best = STILL;
    let bestScore = score(p.x, p.y) + (stairs ? 1 : 0);
    for (const d of DIRS) {
      let s = 0;
      let bad = false;
      for (const L of BOT.look) {
        const qx = p.x + d.x * L;
        const qy = p.y + d.y * L;
        if (blocked(blocks, p.x, p.y, qx, qy, 6)) {
          bad = true;
          break;
        }
        s += score(qx, qy);
      }
      if (bad) continue;
      s /= BOT.look.length;
      if (d === last) s -= BOT.keepDir;
      if (s < bestScore) {
        bestScore = s;
        best = d;
      }
    }
    last = best;
    return best;
  };
}

export function installSim(game) {
  async function run({ floor, bot = 'mover', tune, maxFrames = 60 * 60 * 6 } = {}) {
    for (const s of game.scene.getScenes(true)) if (s.scene.key !== 'Game') s.scene.stop();
    game.loop.sleep();
    game.scene.start('Game', { floor });
    let t = performance.now();
    let scene = null;
    let brain = null;
    let summary = null;
    let hits = {};
    for (let frame = 0; frame < maxFrames; frame++) {
      t += FRAME;
      game.step(t, FRAME);
      scene = game.scene.getScene('Game');
      if (scene.sys.isActive() && !brain && scene.player) {
        brain = bot === 'idle' ? () => STILL : makeMover(scene, tune);
        scene.controls.read = () => brain();
        scene.events.once('shift-end', (s) => (summary = s));
        // 무엇에 맞았는지 센다 (가장 가까운 말풍선·몬스터 기준의 어림)
        hits = {};
        const hurt = scene.player.hurt.bind(scene.player);
        scene.player.hurt = (damage) => {
          const ok = hurt(damage);
          if (ok) {
            const p = scene.player;
            const shot = scene.enemyShots.pool.some((t) => t.active && Phaser.Math.Distance.Between(t.x, t.y, p.x, p.y - 12) < 24);
            const near = scene.enemies.getChildren().filter((e) => e.active).sort((a, b) => Phaser.Math.Distance.Between(a.x, a.y, p.x, p.y) - Phaser.Math.Distance.Between(b.x, b.y, p.x, p.y))[0];
            const key = shot ? 'shot' : near?.def.id ?? '?';
            hits[key] = (hits[key] ?? 0) + damage;
          }
          return ok;
        };
      }
      const levelUp = game.scene.getScene('LevelUp');
      if (levelUp.sys.isActive() && levelUp.choices) {
        levelUp.ready = true;
        levelUp.choose(Phaser.Utils.Array.GetRandom(levelUp.choices));
      }
      // 내 자리 화면은 실제 시간으로 흘러가므로 잠깐 기다린다 (봇은 일부러 들르지 않는다)
      while (scene.desk?.transitioning || game.scene.isPaused('Game') && !levelUp.sys.isActive()) {
        await new Promise((r) => setTimeout(r, 50));
        t += FRAME;
        game.step(t, FRAME);
        if (game.scene.getScene('LevelUp').sys.isActive()) break;
      }
      if (summary) break;
      if (frame % 300 === 0) await yieldNow();
    }
    game.scene.stop('Result');
    game.scene.stop('Game');
    game.loop.wake();
    return { ...(summary ?? { result: 'timeout' }), hits };
  }

  // 진행 상황은 __sim.status 에 쌓인다 (오래 걸리므로 start 로 돌려 두고 나중에 읽는다)
  const status = [];
  async function runMany({ floor, bot = 'mover', runs = 6, tune } = {}) {
    const entry = { floor, bot, runs, tune, clears: 0, results: [], hits: {}, done: false };
    status.push(entry);
    for (let i = 0; i < runs; i++) {
      const r = await run({ floor, bot, tune });
      entry.results.push(`${r.result}@${r.minutes?.toFixed(1)}`);
      if (r.result === 'clear') entry.clears++;
      for (const [k, v] of Object.entries(r.hits)) entry.hits[k] = (entry.hits[k] ?? 0) + v;
    }
    entry.done = true;
    return entry;
  }

  // 여러 조합을 차례로: __sim.start([{ floor: 15, bot: 'idle', runs: 3 }, { floor: 15, runs: 6 }])
  function start(list) {
    status.length = 0;
    (async () => {
      for (const opts of list) await runMany(opts);
    })();
    return status;
  }

  window.__sim = { run, runMany, start, status };
}
