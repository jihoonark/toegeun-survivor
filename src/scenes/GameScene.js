import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import Controls from '../systems/Controls.js';
import { touchDevice } from '../systems/Fullscreen.js';
import Combat from '../systems/Combat.js';
import Spawner from '../systems/Spawner.js';
import Juice from '../systems/Juice.js';
import DebugPanel from '../systems/DebugPanel.js';
import Hud from '../systems/Hud.js';
import Pickups from '../systems/Pickups.js';
import Promotion from '../systems/Promotion.js';
import Items from '../systems/Items.js';
import Desk from '../systems/Desk.js';
import EnemyShots from '../systems/EnemyShots.js';
import Player from '../entities/Player.js';
import { music } from '../systems/Music.js';
import Elites from '../systems/Elites.js';
import Stairs from '../systems/Stairs.js';
import Rooms from '../systems/Rooms.js';
import Takedowns from '../systems/Takedowns.js';
import Bombs from '../systems/Bombs.js';
import FloorRules from '../systems/FloorRules.js';
import { OFFICE_TEXTURES, floorTexture } from '../art/office.js';
import { FLOORS, getFloor } from '../data/floors.js';

// 이 장면에서 쓰는 장면 이벤트. 다시하기로 장면이 재시작될 때 이전 판의 듣기를 모두 지운다
const GAME_EVENTS = [
  'enemy-hit', 'enemy-killed', 'player-hit', 'player-healed', 'shift-end',
  'weapon-added', 'weapon-upgraded', 'xp-gained', 'xp-changed', 'promoted', 'mail-bomb',
  'wave-warning', 'boss-spawned', 'item-added', 'item-upgraded', 'desk-ready', 'desk-done', 'npc-joined', 'npc-refreshed', 'npc-guard', 'npc-hit', 'npc-defeated', 'enemy-rage',
  'elite-spawned', 'elite-aim', 'elite-fire', 'elite-landing', 'stairs-open',
  'meeting-door', 'meeting-stop',
  'shot-parried', 'elite-reflect', 'elite-returned', 'bomb-dropped', 'bomb-exploded',
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  // data.floor: 층 번호 (엘리베이터에서 고른 층). 없으면 첫 층
  create(data) {
    this.floor = getFloor(data?.floor ?? FLOORS[0].id);
    this.buildOffice();

    const [startX, startY] = this.floor.map.start;
    this.player = new Player(this, startX, startY);
    this.physics.add.collider(this.player, this.furniture);
    this.physics.add.collider(this.player, this.walls);
    this.controls = new Controls(this);

    this.elites = new Elites(this, this.floor);
    this.spawner = new Spawner(this, this.floor);
    this.floorRules = new FloorRules(this, this.floor);
    this.enemies = this.spawner.enemies;
    this.combat = new Combat(this, this.player, this.enemies);
    this.juice = new Juice(this);
    this.pickups = new Pickups(this, this.player);
    this.bombs = new Bombs(this, this.player);
    this.items = new Items(this, this.player);
    this.promotion = new Promotion(this, this.combat, this.player, this.items);
    this.setupShift();
    this.desk = new Desk(this);
    this.stairs = new Stairs(this);
    this.events.on('meeting-door', () => this.juice.sfx.play('alarm'));
    this.events.on('meeting-stop', () => this.juice.sfx.play('ping'));
    this.events.on('stairs-open', () => {
      this.hud.showWarning('계단 열림!', CONFIG.colors.accent);
      this.juice.sfx.play('levelUp');
    });
    this.enemyShots = new EnemyShots(this);
    this.events.on('enemy-rage', ({ enemy }) => {
      this.hud.showWarning(`${enemy.def.name}님이 화났다!`);
      this.juice.sfx.play('alarm');
    });
    this.events.on('desk-ready', () => this.hud.showNotice('내 자리: 선배가 물어볼 게 있대요'));
    this.events.on('npc-joined', ({ npc }) => this.hud.showWarning(npc.mode.join, CONFIG.colors.accent, CONFIG.ui.bodyFontSize));
    this.events.on('npc-refreshed', ({ npc }) => this.hud.showNotice(npc.mode.refreshNotice));
    this.events.on('npc-guard', () => this.juice.sfx.play('guard'));
    this.events.on('npc-hit', () => this.juice.sfx.play('hurt'));
    this.events.on('npc-defeated', ({ npc }) => this.hud.showNotice(npc.mode.defeatNotice));
    // HUD가 'weapon-added' 를 들은 뒤에 무기를 쥐어 credit 알림과 무기 칸이 맞게 한다
    this.combat.addStarterWeapons();
    this.promotion.emitChanged();
    if (import.meta.env.DEV) this.debugPanel = new DebugPanel(this);

    const lerp = CONFIG.camera.followLerp;
    this.cameras.main.startFollow(this.player, true, lerp, lerp);

    this.showControlsHint();
    music.use(this).play(this.floor.theme.music, { restart: true });
    // 물리 바디의 위치가 스프라이트에 반영된 뒤(POST_UPDATE) 그림자·앞뒤 정렬을 맞춘다
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncAfterPhysics, this);
    // 승진 카드를 고르는 동안 누르던 키·조이스틱이 돌아와서도 눌린 채로 남지 않게
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.input.keyboard?.resetKeys();
      this.controls.joystick.release();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('LevelUp');
      GAME_EVENTS.forEach((name) => this.events.removeAllListeners(name));
      this.events.off(Phaser.Scenes.Events.RESUME);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncAfterPhysics, this);
    });
  }

  syncAfterPhysics(_time, delta) {
    const step = this.juice.frozen ? 0 : delta;
    this.player.syncAfterPhysics(step);
    this.enemies.getChildren().forEach((e) => e.syncAfterPhysics(step));
  }

  // 근무 시간: 멘탈, 시계, 처리한 업무 수, 칼퇴(계단 도착)·야근 판정
  //   장면 이벤트 'shift-end' { result: 'clear' | 'overtime', tasks, minutes, rank }
  setupShift() {
    this.hud = new Hud(this);
    this.elapsed = 0;
    this.tasksDone = 0;
    this.ended = false;

    this.hud.setMental(this.player.mental, this.player.maxMental);
    this.hud.setClock(0);
    this.hud.setTasks(0);

    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) => {
      if (this.ended || !enemy.active || enemy.flight) return;
      this.player.hurt(enemy.def.contactDamage);
    });
    this.events.on('player-hit', ({ mental }) => {
      this.hud.setMental(mental, this.player.maxMental);
      if (mental <= 0) this.endShift('overtime');
    });
    this.events.on('enemy-killed', () => this.hud.setTasks(++this.tasksDone));
    this.events.on('player-healed', ({ mental }) => this.hud.setMental(mental, this.player.maxMental));

    // 무기 칸과 승진 막대
    const refreshWeapons = () => this.hud.setWeapons(this.combat.weapons);
    this.events.on('weapon-added', refreshWeapons);
    this.events.on('weapon-upgraded', refreshWeapons);
    const refreshItems = () => this.hud.setItems(this.items.slots);
    this.events.on('item-added', refreshItems);
    this.events.on('item-upgraded', refreshItems);
    this.events.on('xp-changed', (state) => this.hud.setXp(state));
    this.events.on('xp-gained', () => this.juice.sfx.play('pickup'));
    this.events.on('mail-bomb', () => {
      this.hud.showWarning('전체 회신 폭탄!');
      this.juice.sfx.play('alarm');
    });
    this.events.on('wave-warning', ({ text }) => {
      this.hud.showWarning(text);
      this.juice.sfx.play('alarm');
    });
    // 보스: 체력 막대, 처치하면 먼저 퇴근한다
    this.events.on('boss-spawned', ({ enemy }) => this.hud.showBoss(enemy));
    this.events.on('elite-spawned', ({ enemy }) => this.hud.showBoss(enemy));
    this.events.on('elite-aim', () => this.juice.sfx.play('ping'));
    this.events.on('elite-landing', () => {
      this.juice.sfx.play('guard');
      const s = CONFIG.elite.landingShake;
      this.cameras.main.shake(s.duration, s.intensity * CONFIG.juice.shake.strength);
    });
    // 처치 연출(삭제·불참·반려 도장), 보스·엘리트 퇴근 장면
    this.takedowns = new Takedowns(this);
    this.events.on('shot-parried', ({ x, y, line }) => {
      if (line) this.takedowns.stamp(x, y, line);
      this.juice.sfx.play('hit');
    });
    this.events.on('elite-reflect', ({ x, y }) => {
      this.takedowns.stamp(x, y, '반송!');
      this.juice.sfx.play('guard');
    });
    this.events.on('elite-returned', () => this.juice.shake(CONFIG.elite.landingShake));
    this.events.on('bomb-dropped', () => this.juice.sfx.play('ping'));
    this.events.on('bomb-exploded', () => {
      const b = CONFIG.bomb;
      this.juice.screenFlash(b.flash, b.flashColor);
      this.juice.shake(b.shake);
      this.juice.sfx.play('alarm');
      this.hud.showWarning('전체 회신!', CONFIG.colors.accent);
    });
  }

  // 1화는 실제 1분 = 게임 1시간
  shiftMinutes() {
    const { startHour, endHour, realDuration } = CONFIG.clock;
    return (this.elapsed / realDuration) * (endHour - startHour) * 60;
  }

  // 18:00 이 지나도 시계는 계속 간다 (계단에 도착해야 퇴근)
  updateClock(delta) {
    this.elapsed += delta;
    this.hud.setClock(this.shiftMinutes());
  }

  endShift(result) {
    if (this.ended) return;
    this.ended = true;
    this.physics.world.pause();
    this.player.anims.pause();
    music.stop();
    const summary = { result, floor: this.floor.id, tasks: this.tasksDone, minutes: this.shiftMinutes(), rank: this.promotion.rank };
    this.events.emit('shift-end', summary);

    // 그 자리에서 결과를 크게 한 번 보여 주고 결과 화면으로 넘어간다
    const { width, height } = CONFIG.screen;
    const clear = result === 'clear';
    addText(this, width / 2, height / 2, clear ? '칼퇴 성공' : '야근 확정', {
      size: CONFIG.ui.titleFontSize,
      color: clear ? CONFIG.colors.accent : CONFIG.colors.danger,
    })
      .setScrollFactor(0)
      .setDepth(CONFIG.depth.hud);
    this.time.delayedCall(CONFIG.result.delay, () => this.scene.start('Result', summary));
  }

  buildOffice() {
    const { width: worldWidth, height: worldHeight, furniture, desk } = this.floor.map;
    const { theme } = this.floor;

    this.add.tileSprite(0, 0, worldWidth, worldHeight, floorTexture(this, this.floor.id, theme.floor)).setOrigin(0).setDepth(CONFIG.depth.floor);
    // 층 조명: 화면 전체에 얇게 덮는 색 (HUD 아래)
    if (theme.light) {
      const { width, height } = CONFIG.screen;
      this.add.rectangle(0, 0, width, height, theme.light.color, theme.light.alpha).setOrigin(0).setScrollFactor(0).setDepth(CONFIG.depth.hud - 1);
    }

    // 탑다운 3/4 시점: 발밑 y가 클수록 앞에 그려지도록 깊이를 y로 둔다
    for (const { type, positions } of furniture) {
      const key = OFFICE_TEXTURES[type];
      if (!key) throw new Error(`알 수 없는 가구 종류: ${type}`);
      for (const [x, y] of positions) this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    }
    // 주인공은 가구 발밑을 지나갈 수 없다 (구석에 몰리면 위험해진다)
    this.furniture = this.physics.add.staticGroup();
    for (const { type, positions } of furniture) {
      const block = CONFIG.furnitureBlock[type];
      if (!block) continue;
      for (const [x, y] of positions) {
        const zone = this.add.zone(x, y - block.height / 2, block.width, block.height);
        this.furniture.add(zone);
      }
    }

    // 유리벽 회의실 (없는 층은 빈 벽 묶음)
    this.rooms = new Rooms(this, this.floor.map);
    this.walls = this.rooms.walls;

    const myBlock = CONFIG.furnitureBlock.desk;
    this.furniture.add(this.add.zone(desk[0], desk[1] - myBlock.height / 2, myBlock.width, myBlock.height));

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  }

  showControlsHint() {
    const { width, height } = CONFIG.screen;
    const { ui } = CONFIG;
    const message = touchDevice() && CONFIG.joystick.fixed ? '왼쪽 아래 조이스틱(또는 화면 왼쪽)을 끌면 이동' : '방향키·WASD 또는 화면을 눌러 끌면 이동';
    const hint = addText(this, width / 2, height - CONFIG.hud.controlsHintBottom, message)
      .setScrollFactor(0)
      .setDepth(CONFIG.depth.hud);
    this.tweens.add({ targets: hint, alpha: 0, delay: ui.hintDuration, duration: ui.hintFade, onComplete: () => hint.destroy() });
  }

  update(time, delta) {
    if (this.ended) return;
    if (this.desk.transitioning) return; // 회사 PC 화면으로 넘어가는 중
    if (this.juice.update(time)) return; // 히트스톱 중
    this.updateClock(delta);
    // 계단 도착은 이 프레임의 공격을 다 처리한 뒤 맨 끝에 판정한다 (같은 프레임에 멘탈이 0이 되면 야근이 먼저)
    const atStairs = this.stairs.update(this.shiftMinutes(), this.player);
    // 층 특별 규칙 (14층: 회의실 문 열림, 회의실에 들어가면 붙잡힘)
    this.floorRules.update(delta, this.shiftMinutes(), this.player);
    // 회사 PC 화면으로 넘어가는 중이거나, 회의실에 붙잡히거나 회의 진행자에게 지목되면 제자리 (무기는 계속 나간다)
    const locked = this.desk.update(delta, this.shiftMinutes(), this.player, this.spawner) || this.player.frozen;
    if (this.desk.transitioning) return; // 방금 회사 PC 화면으로 넘어가기 시작
    // 17:50부터 음악이 빨라진다
    music.setTempo(this.shiftMinutes() >= CONFIG.music.rushFrom ? CONFIG.music.rushTempo : 1);
    this.player.move(locked ? Desk.STILL : this.controls.read());
    this.spawner.update(delta, this.shiftMinutes());
    this.enemies.getChildren().forEach((e) => e.active && e.chase(this.player));
    this.combat.update(delta);
    if (this.juice.frozen) return; // 방금 처치로 히트스톱이 걸렸다
    this.enemyShots.update(delta, this.enemies, this.player, this.combat.projectiles);
    this.elites.update(delta, this.enemies, this.player, this.combat.projectiles);
    this.pickups.update(delta);
    this.bombs.update(delta);
    this.juice.trails(this.combat.projectiles, delta);
    this.hud.updateBoss();
    const helper = this.desk.npcs.find((n) => !n.leaving);
    this.hud.setBuff(helper ? `🛡️ ${helper.def.name} 지원 ${helper.secondsLeft}초` : '');
    if (atStairs && !this.ended) this.endShift('clear');
  }
}
