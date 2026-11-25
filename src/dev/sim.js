import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { shop } from '../systems/Shop.js';
import { wallet } from '../systems/Wallet.js';

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
  bombRange: 200, // 이 안의 폭탄은 주우러 간다
  bombWeight: 4,
  deadEnd: 1.5, // 곧 막히는 방향 감점 (내다본 거리 한 칸마다)
  grid: 16, // 계단 길찾기 칸 크기(px)
  stairsSnap: 70, // 계단이 이 거리 안이면 곧장 간다
  bossDist: 120, // 13층 17:59 최종 보스와 이 거리를 지키며 싸운다 (사람처럼 붙어서 잡으러 간다)
  bossPull: 8,
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
  // 내 자리 앞에 서 있으면 퀴즈 화면이 열리므로 봇은 책상 앞을 막힌 곳으로 본다
  if (scene.desk) {
    const z = CONFIG.desk.zone;
    blocks.push({ x: scene.desk.x - z.width / 2, y: scene.desk.y, w: z.width, h: z.height });
  }
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
  const rooms = scene.rooms?.rooms ?? [];
  const { width, height } = scene.floor.map;
  let last = STILL;
  let field = null;
  return () => {
    const p = scene.player;
    const stairs = scene.stairs?.open ? scene.stairs : null;
    if (stairs && !field) field = distanceField(scene, blocks, stairs.x, stairs.y);
    // 계단 바로 앞에서는 망설이지 않고 들어간다 (계단 칸 가운데로)
    if (stairs) {
      const gx = stairs.x - p.x;
      const gy = stairs.y - CONFIG.stairs.zone.height / 2 - p.y;
      const gd = Math.hypot(gx, gy);
      if (gd < BOT.stairsSnap && gd > 0) return (last = new Phaser.Math.Vector2(gx / gd, gy / gd));
    }
    const enemies = scene.enemies.getChildren().filter((e) => e.active && Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y) < BOT.dangerRange + 60);
    const shots = scene.enemyShots.pool.filter((s) => s.active);
    const marks = scene.elites?.marks ?? [];
    const finalBoss = scene.clockHold != null ? scene.enemies.getChildren().find((e) => e.active && e.def.boss) : null;
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
      if (finalBoss) s += BOT.bossPull * Math.abs(Phaser.Math.Distance.Between(finalBoss.x, finalBoss.y, x, y) - BOT.bossDist) / BOT.bossDist;
      for (const b of scene.bombs?.items ?? []) {
        const d = Phaser.Math.Distance.Between(b.x, b.y, x, y);
        if (d < BOT.bombRange) s -= BOT.bombWeight * (1 - d / BOT.bombRange);
      }
      return s;
    };
    let best = STILL;
    let bestScore = score(p.x, p.y) + (stairs ? 1 : 0);
    for (const d of DIRS) {
      // 막힌 곳 앞까지만 내다본다. 바로 앞부터 막혔으면 그쪽으로는 안 간다
      let s = 0;
      let n = 0;
      for (const L of BOT.look) {
        const qx = p.x + d.x * L;
        const qy = p.y + d.y * L;
        if (blocked(blocks, p.x, p.y, qx, qy, 4)) break;
        s += score(qx, qy);
        n++;
      }
      if (n === 0) continue;
      s = s / n + (BOT.look.length - n) * BOT.deadEnd;
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
  // 시험 시계: 호출마다 실제 시각에서 다시 시작하면 게임 시간이 거꾸로 가서 히트스톱이 풀리지 않는다
  // 지난번에 돌린 시각보다 뒤에서만 시작한다
  let lastT = 0;
  const simStart = () => Math.max(performance.now(), lastT);
  const stepAt = (t) => {
    game.step(t, FRAME);
    lastT = t;
  };
  async function run({ floor, bot = 'mover', tune, maxFrames = 60 * 60 * 12 } = {}) {
    for (const s of game.scene.getScenes(true)) if (s.scene.key !== 'Game') s.scene.stop();
    game.loop.sleep();
    game.scene.start('Game', { floor });
    let t = simStart();
    let scene = null;
    let brain = null;
    let summary = null;
    let hits = {};
    let levelUps = 0;
    let levelUpsBefore30 = 0;
    for (let frame = 0; frame < maxFrames; frame++) {
      t += FRAME;
      stepAt(t);
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
      if (levelUp.sys.isActive() && levelUp.choices && !levelUp.picked) {
        levelUp.ready = true;
        levelUp.choose(Phaser.Utils.Array.GetRandom(levelUp.choices));
        levelUps++;
        if (scene.shiftMinutes() < 30) levelUpsBefore30++;
      }
      // 내 자리 화면은 실제 시간으로 흘러가므로 잠깐 기다린다 (봇은 일부러 들르지 않는다)
      while (scene.desk?.transitioning || game.scene.isPaused('Game') && !levelUp.sys.isActive()) {
        await new Promise((r) => setTimeout(r, 50));
        t += FRAME;
        stepAt(t);
        if (game.scene.getScene('LevelUp').sys.isActive()) break;
      }
      if (summary) break;
      if (frame % 300 === 0) await yieldNow();
    }
    // 시간이 다 됐으면 왜 그런지 볼 수 있게 그때 상태를 남긴다
    const stuck = summary ? null : {
      minutes: scene?.shiftMinutes?.().toFixed(2),
      clockHold: scene?.clockHold,
      boss: scene?.enemies?.getChildren().filter((e) => e.active && e.def.boss).map((e) => `${e.def.id} ${e.hp}/${e.maxHp}`),
      stairs: scene?.stairs?.open ? [Math.round(scene.stairs.x), Math.round(scene.stairs.y)] : false,
      player: scene?.player && [Math.round(scene.player.x), Math.round(scene.player.y), scene.player.mental],
      frozen: scene?.juice?.frozen,
      desk: scene?.desk?.transitioning,
    };
    game.scene.stop('Result');
    game.scene.stop('Game');
    game.scene.stop('Ending');
    game.loop.wake();
    return { ...(summary ?? { result: 'timeout' }), hits, levelUps, levelUpsBefore30, stuck };
  }

  // 진행 상황은 __sim.status 에 쌓인다 (오래 걸리므로 start 로 돌려 두고 나중에 읽는다)
  const status = [];
  // shopState: 가게에서 산 것 { bought: { power, mental, resignation }, pending: {...}, starter } (없으면 아무것도 안 산 상태)
  //   판마다 이 상태로 시작한다. 지갑(연봉·복지포인트)은 시험 전 값으로 되돌린다
  //   entry.income: 판마다 주운 혜택 합계 (칼퇴·야근 정산 전)
  async function runMany({ floor, bot = 'mover', runs = 6, tune, shopState = null } = {}) {
    const entry = { floor, bot, runs, tune, shopState, clears: 0, results: [], hits: {}, income: { salary: 0, welfare: 0 }, kept: { salary: 0, welfare: 0 }, done: false };
    status.push(entry);
    const savedShop = localStorage.getItem(CONFIG.shop.storageKey);
    const savedWallet = localStorage.getItem(CONFIG.benefits.storageKey);
    for (let i = 0; i < runs; i++) {
      localStorage.setItem(CONFIG.shop.storageKey, JSON.stringify(shopState ?? {}));
      shop.reload();
      const r = await run({ floor, bot, tune });
      for (const k of ['salary', 'welfare']) {
        entry.income[k] += r.benefits?.run?.[k] ?? 0;
        entry.kept[k] += r.benefits?.kept?.[k] ?? 0;
      }
      entry.results.push(`${r.result}@${r.minutes?.toFixed(1)} 승진${r.levelUps}(17:30전 ${r.levelUpsBefore30})`);
      if (r.stuck) (entry.stuck ??= []).push(r.stuck);
      if (r.result === 'clear') entry.clears++;
      for (const [k, v] of Object.entries(r.hits)) entry.hits[k] = (entry.hits[k] ?? 0) + v;
    }
    const restore = (key, value) => (value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value));
    restore(CONFIG.shop.storageKey, savedShop);
    restore(CONFIG.benefits.storageKey, savedWallet);
    shop.reload();
    wallet.reload();
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

  // 녹화·확인용: 봇이 피해 다니며 그 시각(17:00 부터 분)까지 빨리 감은 뒤 멈추지 않고 사람에게 넘긴다
  //   await __sim.jump({ floor: 15, minutes: 15.5 })   keepBot: true 면 봇이 계속 움직인다
  async function jump({ floor, minutes, bot = 'mover', tune, keepBot = false } = {}) {
    for (const s of game.scene.getScenes(true)) if (s.scene.key !== 'Game') s.scene.stop();
    game.loop.sleep();
    game.scene.start('Game', { floor });
    let t = simStart();
    let scene = null;
    let read = null;
    for (let frame = 0; frame < 60 * 60 * 6; frame++) {
      t += FRAME;
      stepAt(t);
      scene = game.scene.getScene('Game');
      if (scene.sys.isActive() && !read && scene.player) {
        read = scene.controls.read.bind(scene.controls);
        const brain = bot === 'idle' ? () => STILL : makeMover(scene, tune);
        scene.controls.read = () => brain();
        scene.player.hurt = () => false; // 빨리 감는 동안은 다치지 않는다
      }
      const levelUp = game.scene.getScene('LevelUp');
      if (levelUp.sys.isActive() && levelUp.choices) {
        levelUp.ready = true;
        levelUp.choose(Phaser.Utils.Array.GetRandom(levelUp.choices));
      }
      if (scene.ended || (scene.shiftMinutes && scene.shiftMinutes() >= minutes)) break;
      if (frame % 300 === 0) await yieldNow();
    }
    delete scene.player.hurt;
    if (!keepBot) scene.controls.read = read;
    game.loop.wake();
    return scene.shiftMinutes();
  }

  // 확인용: 조건이 맞을 때까지 한 프레임씩 돌리고 멈춘 채로 둔다 (화면 캡처용). 다시 움직이려면 __sim.resume()
  //   await __sim.stepUntil((scene) => scene.elites.marks.length > 0)
  async function stepUntil(test, maxFrames = 60 * 60) {
    game.loop.sleep();
    let t = simStart();
    for (let frame = 0; frame < maxFrames; frame++) {
      t += FRAME;
      stepAt(t);
      const levelUp = game.scene.getScene('LevelUp');
      if (levelUp.sys.isActive() && levelUp.choices) {
        levelUp.ready = true;
        levelUp.choose(Phaser.Utils.Array.GetRandom(levelUp.choices));
      }
      if (test(game.scene.getScene('Game'))) return frame;
      if (frame % 300 === 0) await yieldNow();
    }
    return -1;
  }
  const resume = () => game.loop.wake();

  // scene(): 지금 게임 장면 (브라우저 콘솔에서 상태 확인용)
  window.__sim = { run, runMany, start, status, jump, stepUntil, resume, scene: () => game.scene.getScene('Game') };
}
