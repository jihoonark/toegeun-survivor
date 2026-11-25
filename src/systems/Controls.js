import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { touchDevice } from './Fullscreen.js';

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

// 로블록스식 고정 조이스틱 (사람 요청 11-19 "따라오는 조이스틱이 불편"):
// - 조이스틱 그림은 화면 왼쪽 아래 한 자리에 늘 있다 (터치 기기에서만 보인다)
// - 그 원을 누르면 원 가운데를 기준으로, 화면 왼쪽(touchArea) 다른 곳을 누르면 누른 곳을 기준으로 민 방향만큼 움직인다
//   어느 쪽이든 그림은 제자리에서 손잡이만 움직이고, 손가락을 따라오지 않는다
// config joystick.fixed 를 끄면 예전처럼 누른 곳에 생기고 따라오는 조이스틱
class VirtualJoystick {
  constructor(scene) {
    const cfg = CONFIG.joystick;
    this.scene = scene;
    this.value = new Phaser.Math.Vector2();
    this.pointerId = null;
    this.origin = new Phaser.Math.Vector2();
    this.offset = new Phaser.Math.Vector2();
    this.reanchor = false;
    this.fixed = cfg.fixed;
    // 고정 조이스틱 자리 (화면 좌표)
    this.home = new Phaser.Math.Vector2(cfg.fixedX, CONFIG.screen.height - cfg.fixedBottom);
    this.showIdle = this.fixed && touchDevice();

    this.base = scene.add.circle(0, 0, cfg.radius, cfg.color, cfg.baseAlpha);
    this.knob = scene.add.circle(0, 0, cfg.knobRadius, cfg.color, cfg.knobAlpha);
    for (const g of [this.base, this.knob]) g.setScrollFactor(0).setDepth(CONFIG.depth.hud).setVisible(false);
    if (this.fixed) {
      this.base.setStrokeStyle(cfg.ringWidth, cfg.color, cfg.ringAlpha);
      this.resetPicture();
    }

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    // 주소창·회전으로 화면이 다시 배치되면 좌표가 어긋날 수 있다
    // 끌던 손가락은 놓지 않고, 다음 움직임에서 지금 방향을 그대로 둔 채 시작점만 다시 잡는다
    const onResize = () => (this.reanchor = true);
    scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
  }

  // 고정 조이스틱: 쉬는 동안 제자리에 흐리게
  resetPicture() {
    const cfg = CONFIG.joystick;
    this.base.setPosition(this.home.x, this.home.y).setAlpha(cfg.idleAlpha).setVisible(this.showIdle);
    this.knob.setPosition(this.home.x, this.home.y).setAlpha(cfg.idleAlpha).setVisible(this.showIdle);
  }

  onDown(p) {
    if (this.pointerId !== null) return;
    const cfg = CONFIG.joystick;
    if (this.fixed) {
      // 화면 오른쪽은 조이스틱이 아니다
      if (p.x > CONFIG.screen.width * cfg.touchArea) return;
      this.pointerId = p.id;
      this.reanchor = false;
      // 원 위를 눌렀으면 원 가운데가 기준 (누른 쪽으로 바로 걷는다), 아니면 누른 곳이 기준
      const onRing = Phaser.Math.Distance.Between(p.x, p.y, this.home.x, this.home.y) <= cfg.radius + cfg.ringPad;
      this.origin.set(onRing ? this.home.x : p.x, onRing ? this.home.y : p.y);
      this.offset.set(0, 0);
      this.base.setPosition(this.home.x, this.home.y).setAlpha(1).setVisible(true);
      this.knob.setPosition(this.home.x, this.home.y).setAlpha(1).setVisible(true);
      this.value.set(0, 0);
      if (onRing) this.onMove(p);
      return;
    }
    this.pointerId = p.id;
    this.reanchor = false;
    this.origin.set(p.x, p.y);
    this.offset.set(0, 0);
    this.base.setPosition(p.x, p.y).setVisible(true);
    this.knob.setPosition(p.x, p.y).setVisible(true);
    this.value.set(0, 0);
  }

  onMove(p) {
    if (p.id !== this.pointerId) return;
    const { radius, deadZone, fullAt } = CONFIG.joystick;
    const follow = CONFIG.joystick.follow && !this.fixed;
    if (this.reanchor) {
      this.reanchor = false;
      this.origin.set(p.x - this.offset.x, p.y - this.offset.y);
    }
    let dx = p.x - this.origin.x;
    let dy = p.y - this.origin.y;
    let len = Math.hypot(dx, dy);
    // 원 밖으로 끌면 원이 손가락을 따라온다. 반대쪽으로 꺾을 때 원 안으로 되돌아올 필요가 없다
    if (follow && len > radius) {
      this.origin.set(p.x - (dx / len) * radius, p.y - (dy / len) * radius);
      this.base.setPosition(this.origin.x, this.origin.y);
      dx = p.x - this.origin.x;
      dy = p.y - this.origin.y;
      len = radius;
    }
    const clamped = Math.min(len, radius);
    const nx = len > 0 ? dx / len : 0;
    const ny = len > 0 ? dy / len : 0;
    this.offset.set(nx * clamped, ny * clamped);
    // 고정 조이스틱은 기준이 어디든 그림은 제자리에서 손잡이만 움직인다
    const center = this.fixed ? this.home : this.origin;
    this.knob.setPosition(center.x + this.offset.x, center.y + this.offset.y);

    // fullAt 만큼만 밀어도 최고 속도 (휴대폰에서 손가락을 조금만 움직여도 시원하게 걷는다)
    const push = clamped / radius;
    const strength = Math.min(1, push / fullAt);
    if (push < deadZone) this.value.set(0, 0);
    else this.value.set(nx * strength, ny * strength);
  }

  onUp(p) {
    if (p.id === this.pointerId) this.release();
  }

  release() {
    this.pointerId = null;
    this.reanchor = false;
    this.value.set(0, 0);
    if (this.fixed) return this.resetPicture();
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }
}
