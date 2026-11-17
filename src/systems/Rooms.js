import { CONFIG } from '../config.js';
import { OFFICE_TEXTURES } from '../art/office.js';
import { addText } from './Text.js';

// 유리벽 회의실 (층 데이터 map.rooms, map.walls)
// - 회의실마다 네 벽 중 door 쪽에 문 틈이 있다. 벽은 주인공만 막고, 몬스터와 투사체는 그냥 지나간다 (가구와 같은 규칙)
// - map.walls 는 회의실 밖의 낱장 유리 칸막이 { x1, y1, x2, y2 } (가로 또는 세로 한 줄)
// - 문 열림(openDoor)은 특별 규칙(FloorRules)이 부른다
// 3/4 시점이라 가로 벽은 벽 발밑 y 를 깊이로 쓰고, 유리는 그 위로 glassHeight 만큼 서 있다
export default class Rooms {
  constructor(scene, map) {
    this.scene = scene;
    this.walls = scene.physics.add.staticGroup();
    this.rooms = (map.rooms ?? []).map((room) => this.build(room));
    for (const w of map.walls ?? []) this.wall(w.x1, w.y1, w.x2, w.y2);
  }

  // 회의실 하나: 안쪽 바닥, 탁자, 화이트보드, 이름, 문 틈 있는 네 벽
  build(room) {
    const R = CONFIG.rooms;
    const { x, y, w, h, door } = room;
    this.scene.add.rectangle(x, y, w, h, R.floorColor).setOrigin(0).setDepth(CONFIG.depth.floor + 1);
    this.scene.add.image(x + w / 2, y + h / 2 + R.tableOffsetY, OFFICE_TEXTURES.meetingTable).setOrigin(0.5, 1).setDepth(y + h / 2 + R.tableOffsetY);
    this.scene.add.image(x + w / 2, y + R.boardOffsetY, OFFICE_TEXTURES.whiteboard).setOrigin(0.5, 1).setDepth(y + R.boardOffsetY);
    addText(this.scene, x + R.nameInset, y + R.nameInset, room.name, { size: CONFIG.ui.smallFontSize, color: R.nameColor, origin: 0, stroke: 0 })
      .setDepth(y + R.nameInset);

    const half = R.doorWidth / 2;
    const sides = {
      top: [x, y, x + w, y],
      bottom: [x, y + h, x + w, y + h],
      left: [x, y, x, y + h],
      right: [x + w, y, x + w, y + h],
    };
    let doorAt = null;
    for (const [side, [x1, y1, x2, y2]] of Object.entries(sides)) {
      if (side !== door) {
        this.wall(x1, y1, x2, y2);
        continue;
      }
      // 문 쪽 벽은 가운데를 비워 두 토막으로
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      if (y1 === y2) {
        this.wall(x1, y1, mx - half, y2);
        this.wall(mx + half, y1, x2, y2);
      } else {
        this.wall(x1, y1, x2, my - half);
        this.wall(x1, my + half, x2, y2);
      }
      doorAt = { x: mx, y: my };
    }
    // 문 밖으로 나가는 방향
    const out = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[door];
    const doorMark = this.scene.add
      .rectangle(doorAt.x, doorAt.y, out[0] ? R.wallThickness : R.doorWidth, out[1] ? R.wallThickness : R.doorWidth, R.doorColor)
      .setDepth(doorAt.y)
      .setAlpha(R.doorAlpha);
    return { ...room, door: doorAt, out, doorMark };
  }

  // (x1, y1) → (x2, y2) 가로 또는 세로 유리벽 한 토막
  wall(x1, y1, x2, y2) {
    const R = CONFIG.rooms;
    const t = R.wallThickness;
    const g = this.scene.add.graphics();
    if (y1 === y2) {
      const left = Math.min(x1, x2);
      const len = Math.abs(x2 - x1);
      if (len <= 0) return;
      this.walls.add(this.scene.add.zone(left + len / 2, y1, len, t));
      // 바닥 틀, 유리, 위쪽 틀, 세로 창살
      g.fillStyle(R.glass, R.glassAlpha).fillRect(left, y1 - R.glassHeight, len, R.glassHeight);
      g.fillStyle(R.frame).fillRect(left, y1 - R.glassHeight, len, 1).fillRect(left, y1 - 1, len, 2);
      for (let mx = left; mx <= left + len; mx += R.mullionGap) g.fillRect(mx, y1 - R.glassHeight, 1, R.glassHeight);
      g.fillStyle(R.shine, R.shineAlpha).fillRect(left + 3, y1 - R.glassHeight + 3, Math.min(len - 6, R.shineLength), 1);
      g.setDepth(y1);
    } else {
      const top = Math.min(y1, y2);
      const len = Math.abs(y2 - y1);
      if (len <= 0) return;
      this.walls.add(this.scene.add.zone(x1, top + len / 2, t, len));
      g.fillStyle(R.glass, R.glassAlpha).fillRect(x1 - t / 2, top - R.glassHeight, t, len + R.glassHeight);
      g.fillStyle(R.frame).fillRect(x1 - t / 2, top - R.glassHeight, 1, len + R.glassHeight).fillRect(x1 + t / 2 - 1, top - R.glassHeight, 1, len + R.glassHeight);
      g.setDepth(top + len);
    }
  }

  // 주인공이 들어 있는 회의실 (없으면 null). 벽 두께만큼 안쪽 기준
  roomAt(px, py) {
    const pad = CONFIG.rooms.wallThickness;
    return this.rooms.find((r) => px > r.x + pad && px < r.x + r.w - pad && py > r.y + pad && py < r.y + r.h - pad) ?? null;
  }

  // 문이 열리는 표시: 문 칸이 노랗게 번쩍이고 "회의 끝!" 글자가 문 밖으로 떠오른다
  openDoor(room, label) {
    const R = CONFIG.rooms;
    const { x, y } = room.door;
    room.doorMark.setFillStyle(R.doorOpenColor).setAlpha(1);
    this.scene.tweens.add({
      targets: room.doorMark,
      alpha: R.doorAlpha,
      delay: R.doorOpenTime,
      duration: R.doorFade,
      onComplete: () => room.doorMark.setFillStyle(R.doorColor),
    });
    const text = addText(this.scene, x + room.out[0] * R.labelDistance, y + room.out[1] * R.labelDistance, label, {
      size: CONFIG.ui.smallFontSize,
      color: CONFIG.colors.accent,
    }).setDepth(CONFIG.depth.flying);
    this.scene.tweens.add({ targets: text, y: text.y - R.labelRise, alpha: 0, delay: R.doorOpenTime, duration: R.doorFade, onComplete: () => text.destroy() });
  }
}
