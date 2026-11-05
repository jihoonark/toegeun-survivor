import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import Controls from '../systems/Controls.js';
import Combat from '../systems/Combat.js';
import Spawner from '../systems/Spawner.js';
import Juice from '../systems/Juice.js';
import DebugPanel from '../systems/DebugPanel.js';
import Hud from '../systems/Hud.js';
import Pickups from '../systems/Pickups.js';
import Promotion from '../systems/Promotion.js';
import Player from '../entities/Player.js';
import { OFFICE_TEXTURES } from '../art/office.js';

// 이 장면에서 쓰는 장면 이벤트. 다시하기로 장면이 재시작될 때 이전 판의 듣기를 모두 지운다
const GAME_EVENTS = [
  'enemy-hit', 'enemy-killed', 'player-hit', 'player-healed', 'shift-end',
  'weapon-added', 'weapon-upgraded', 'xp-gained', 'xp-changed', 'promoted', 'mail-bomb',
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.buildOffice();

    const { worldWidth, worldHeight } = CONFIG.office;
    this.player = new Player(this, worldWidth / 2, worldHeight / 2);
    this.physics.add.collider(this.player, this.furniture);
    this.controls = new Controls(this);

    this.spawner = new Spawner(this);
    this.enemies = this.spawner.enemies;
    this.combat = new Combat(this, this.player, this.enemies);
    this.juice = new Juice(this);
    this.pickups = new Pickups(this, this.player);
    this.promotion = new Promotion(this, this.combat, this.player);
    this.setupShift();
    // HUD가 'weapon-added' 를 들은 뒤에 무기를 쥐어 credit 알림과 무기 칸이 맞게 한다
    this.combat.addStarterWeapons();
    this.promotion.emitChanged();
    if (import.meta.env.DEV) this.debugPanel = new DebugPanel(this);

    const lerp = CONFIG.camera.followLerp;
    this.cameras.main.startFollow(this.player, true, lerp, lerp);

    this.showControlsHint();
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

  // 근무 시간: 멘탈, 시계, 처리한 업무 수, 칼퇴·야근 판정
  //   장면 이벤트 'shift-end' { result: 'clear' | 'overtime', tasks, minutes, rank }
  setupShift() {
    this.hud = new Hud(this);
    this.elapsed = 0;
    this.tasksDone = 0;
    this.ended = false;

    this.hud.setMental(this.player.mental, CONFIG.player.maxMental);
    this.hud.setClock(0);
    this.hud.setTasks(0);

    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) => {
      if (this.ended || !enemy.active) return;
      this.player.hurt(enemy.def.contactDamage);
    });
    this.events.on('player-hit', ({ mental }) => {
      this.hud.setMental(mental, CONFIG.player.maxMental);
      if (mental <= 0) this.endShift('overtime');
    });
    this.events.on('enemy-killed', () => this.hud.setTasks(++this.tasksDone));
    this.events.on('player-healed', ({ mental }) => this.hud.setMental(mental, CONFIG.player.maxMental));

    // 무기 칸과 승진 막대
    const refreshWeapons = () => this.hud.setWeapons(this.combat.weapons);
    this.events.on('weapon-added', refreshWeapons);
    this.events.on('weapon-upgraded', refreshWeapons);
    this.events.on('xp-changed', (state) => this.hud.setXp(state));
    this.events.on('xp-gained', () => this.juice.sfx.play('pickup'));
    this.events.on('mail-bomb', () => {
      this.hud.showWarning('전체 회신 폭탄!');
      this.juice.sfx.play('alarm');
    });
  }

  // 1화는 실제 1분 = 게임 1시간
  shiftMinutes() {
    const { startHour, endHour, realDuration } = CONFIG.clock;
    return (this.elapsed / realDuration) * (endHour - startHour) * 60;
  }

  updateClock(delta) {
    this.elapsed += delta;
    const { startHour, endHour } = CONFIG.clock;
    const total = (endHour - startHour) * 60;
    const minutes = Math.min(this.shiftMinutes(), total);
    this.hud.setClock(minutes);
    if (minutes >= total) this.endShift('clear');
  }

  endShift(result) {
    if (this.ended) return;
    this.ended = true;
    this.physics.world.pause();
    this.player.anims.pause();
    const summary = { result, tasks: this.tasksDone, minutes: this.shiftMinutes(), rank: this.promotion.rank };
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
    const { worldWidth, worldHeight, furniture } = CONFIG.office;

    this.add.tileSprite(0, 0, worldWidth, worldHeight, OFFICE_TEXTURES.floor).setOrigin(0).setDepth(CONFIG.depth.floor);

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

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  }

  showControlsHint() {
    const { width, height } = CONFIG.screen;
    const { ui } = CONFIG;
    const hint = addText(this, width / 2, height - CONFIG.hud.controlsHintBottom, '방향키·WASD 또는 화면을 눌러 끌면 이동')
      .setScrollFactor(0)
      .setDepth(CONFIG.depth.hud);
    this.tweens.add({ targets: hint, alpha: 0, delay: ui.hintDuration, duration: ui.hintFade, onComplete: () => hint.destroy() });
  }

  update(time, delta) {
    if (this.ended) return;
    if (this.juice.update(time)) return; // 히트스톱 중
    this.updateClock(delta);
    if (this.ended) return;
    this.player.move(this.controls.read());
    this.spawner.update(delta, this.shiftMinutes());
    this.enemies.getChildren().forEach((e) => e.active && e.chase(this.player));
    this.combat.update(delta);
    this.pickups.update(delta);
    this.juice.trails(this.combat.projectiles, delta);
  }
}
