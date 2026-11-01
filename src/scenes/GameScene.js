import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { addText } from '../systems/Text.js';
import Controls from '../systems/Controls.js';
import Combat from '../systems/Combat.js';
import Spawner from '../systems/Spawner.js';
import Juice from '../systems/Juice.js';
import DebugPanel from '../systems/DebugPanel.js';
import Hud from '../systems/Hud.js';
import Player from '../entities/Player.js';
import { OFFICE_TEXTURES } from '../art/office.js';

// 이 장면에서 쓰는 장면 이벤트. 다시하기로 장면이 재시작될 때 이전 판의 듣기를 모두 지운다
const GAME_EVENTS = ['enemy-hit', 'enemy-killed', 'player-hit', 'shift-end', 'weapon-added'];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.buildOffice();

    const { worldWidth, worldHeight } = CONFIG.office;
    this.player = new Player(this, worldWidth / 2, worldHeight / 2);
    this.controls = new Controls(this);

    this.spawner = new Spawner(this);
    this.enemies = this.spawner.enemies;
    this.combat = new Combat(this, this.player, this.enemies);
    this.juice = new Juice(this);
    this.setupShift();
    // HUD가 'weapon-added' 를 들은 뒤에 무기를 쥐어 credit 알림이 뜨게 한다
    this.combat.addStarterWeapons();
    if (import.meta.env.DEV) this.debugPanel = new DebugPanel(this);

    const lerp = CONFIG.camera.followLerp;
    this.cameras.main.startFollow(this.player, true, lerp, lerp);

    this.showControlsHint();
    // 물리 바디의 위치가 스프라이트에 반영된 뒤(POST_UPDATE) 그림자·앞뒤 정렬을 맞춘다
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncAfterPhysics, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GAME_EVENTS.forEach((name) => this.events.removeAllListeners(name));
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncAfterPhysics, this);
    });
  }

  syncAfterPhysics(_time, delta) {
    const step = this.juice.frozen ? 0 : delta;
    this.player.syncAfterPhysics(step);
    this.enemies.getChildren().forEach((e) => e.syncAfterPhysics(step));
  }

  // 근무 시간: 멘탈, 시계, 처리한 업무 수, 칼퇴·야근 판정
  //   장면 이벤트 'shift-end' { result: 'clear' | 'overtime', tasks, minutes }
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
    const summary = { result, tasks: this.tasksDone, minutes: this.shiftMinutes() };
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

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  }

  showControlsHint() {
    const { width, height } = CONFIG.screen;
    const { ui } = CONFIG;
    const hint = addText(this, width / 2, height - ui.title.creditBottom, '방향키·WASD 또는 화면을 눌러 끌면 이동')
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
    this.spawner.update(delta);
    this.enemies.getChildren().forEach((e) => e.active && e.chase(this.player));
    this.combat.update(delta);
  }
}
