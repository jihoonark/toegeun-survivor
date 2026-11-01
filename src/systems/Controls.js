import Phaser from 'phaser';
import { CONFIG } from '../config.js';

// 키보드(방향키·WASD)와 가상 조이스틱을 합쳐 이동 방향 하나로 돌려준다
// 돌려주는 값: { x, y } 길이 0~1 (조이스틱은 민 만큼 느리게도 걷는다)
export default class Controls {
  constructor(scene) {
    this.scene = scene;
    this.vec = new Phaser.Math.Vector2();

    const kb = scene.input.keyboard;
    this.keys = kb?.addKeys({
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      w: 'W',
      a: 'A',
      s: 'S',
      d: 'D',
    });

    this.joystick = new VirtualJoystick(scene);
  }

  read() {
    const k = this.keys;
    let x = 0;
    let y = 0;
    if (k) {
      if (k.left.isDown || k.a.isDown) x -= 1;
      if (k.right.isDown || k.d.isDown) x += 1;
      if (k.up.isDown || k.w.isDown) y -= 1;
      if (k.down.isDown || k.s.isDown) y += 1;
    }
    if (x !== 0 || y !== 0) return this.vec.set(x, y).normalize();
    return this.vec.copy(this.joystick.value);
  }
}

class VirtualJoystick {
  constructor(scene) {
    const cfg = CONFIG.joystick;
    this.scene = scene;
    this.value = new Phaser.Math.Vector2();
    this.pointerId = null;
    this.origin = new Phaser.Math.Vector2();

    this.base = scene.add.circle(0, 0, cfg.radius, cfg.color, cfg.baseAlpha);
    this.knob = scene.add.circle(0, 0, cfg.knobRadius, cfg.color, cfg.knobAlpha);
    for (const g of [this.base, this.knob]) g.setScrollFactor(0).setDepth(Infinity).setVisible(false);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    // 주소창·회전으로 화면이 다시 배치되면 시작점 좌표가 어긋나므로 새 터치부터 받는다
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.release, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, this.release, this));
  }

  onDown(p) {
    if (this.pointerId !== null) return;
    this.pointerId = p.id;
    this.origin.set(p.x, p.y);
    this.base.setPosition(p.x, p.y).setVisible(true);
    this.knob.setPosition(p.x, p.y).setVisible(true);
    this.value.set(0, 0);
  }

  onMove(p) {
    if (p.id !== this.pointerId) return;
    const { radius, deadZone } = CONFIG.joystick;
    const dx = p.x - this.origin.x;
    const dy = p.y - this.origin.y;
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, radius);
    const nx = len > 0 ? dx / len : 0;
    const ny = len > 0 ? dy / len : 0;
    this.knob.setPosition(this.origin.x + nx * clamped, this.origin.y + ny * clamped);

    const strength = clamped / radius;
    if (strength < deadZone) this.value.set(0, 0);
    else this.value.set(nx * strength, ny * strength);
  }

  onUp(p) {
    if (p.id === this.pointerId) this.release();
  }

  release() {
    this.pointerId = null;
    this.value.set(0, 0);
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }
}
