import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { enemyTexture } from '../art/enemies.js';
import { addText } from './Text.js';

// 날려버리기 연출 (GAME_SPEC.md 12장 "회사에서는 못 하는 걸 여기선 한다")
// - 몬스터마다 처치될 때 회사스럽게 날아간다: 몬스터 데이터의 defeat { text, fx }
//     fx 'fling'  빙글빙글 돌며 멀리 날아가 작아진다 (이메일 → 휴지통, 포스트잇 구겨 던지기)
//     fx 'stamp'  빨간 도장이 쾅 찍히고 반으로 찢어져 떨어진다 (회의 "불참", 보고서 "반려")
//     fx 'shrink' 납작하게 눌려 사라진다 (전화 "통화 종료")
//   text 는 도장처럼 찍히는 글자 (없으면 글자 없이)
// - 보스·엘리트를 잡으면 화면이 잠깐 멈추고 번쩍, 크게 defeatLine ("팀장님, 내일 뵙겠습니다!")
// 그림자 그림과 글자는 미리 만든 것을 돌려 쓴다 (한꺼번에 많이 잡아도 휴대폰이 버벅이지 않게, 모자라면 건너뛴다)
//
// 새 연출은 FX 에 함수를 추가하고 몬스터 데이터 defeat.fx 로 부른다
export const FX = {
  fling(scene, ghost, t) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    scene.tweens.add({
      targets: ghost,
      x: ghost.x + dir * t.fling.distanceX,
      y: ghost.y - t.fling.distanceY,
      angle: dir * t.fling.spin,
      scale: ghost.scale * t.fling.endScale,
      alpha: 0,
      duration: t.fling.duration,
      ease: 'Quad.out',
    });
  },
  stamp(scene, ghost, t, takedowns) {
    // 반쪽을 하나 더 꺼내 좌우로 찢어진 것처럼 떨어뜨린다
    const half = takedowns.ghost(ghost.texture.key, ghost.x, ghost.y, ghost.scale);
    const halves = half ? [ghost, half] : [ghost];
    const w = ghost.width;
    halves.forEach((g, i) => {
      const side = i === 0 ? -1 : 1;
      if (half) g.setCrop(i === 0 ? 0 : w / 2, 0, w / 2, ghost.height);
      scene.tweens.add({
        targets: g,
        x: g.x + side * t.stamp.tearX,
        y: g.y + t.stamp.fallY,
        angle: side * t.stamp.tilt,
        alpha: 0,
        delay: t.stamp.hold,
        duration: t.stamp.duration,
        ease: 'Quad.in',
      });
    });
  },
  shrink(scene, ghost, t) {
    scene.tweens.add({
      targets: ghost,
      scaleY: 0,
      scaleX: ghost.scale * t.shrink.widen,
      alpha: 0,
      duration: t.shrink.duration,
      ease: 'Back.in',
    });
  },
};

export default class Takedowns {
  constructor(scene) {
    this.scene = scene;
    const t = CONFIG.takedown;
    this.ghosts = [];
    this.stamps = [];
    for (let i = 0; i < t.stampPool; i++) {
      this.stamps.push(
        addText(scene, 0, 0, '', { size: t.stampSize, color: t.stampColor, stroke: CONFIG.ui.bodyStroke })
          .setDepth(CONFIG.depth.flying)
          .setVisible(false),
      );
    }
    scene.events.on('enemy-killed', this.onKilled, this);
  }

  // 처치된 몬스터 모습을 흉내 내는 그림 (돌려 쓴다, 다 쓰고 있으면 null)
  ghost(key, x, y, scale) {
    let g = this.ghosts.find((o) => !o.visible);
    if (!g) {
      if (this.ghosts.length >= CONFIG.takedown.ghostPool) return null;
      g = this.scene.add.image(0, 0, key);
      this.ghosts.push(g);
    }
    this.scene.tweens.killTweensOf(g);
    g.useId = (g.useId ?? 0) + 1;
    return g
      .setTexture(key)
      .setCrop()
      .setPosition(x, y)
      .setScale(scale)
      .setAngle(0)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(CONFIG.depth.flying - 1);
  }

  onKilled({ enemy, def }) {
    if (def.boss || def.elite) this.bossDown(def, enemy);
    const d = def.defeat;
    if (!d) return;
    const t = CONFIG.takedown;
    const aim = enemy.getAimPoint ? enemy.getAimPoint() : enemy;
    const fx = FX[d.fx];
    if (!fx) throw new Error(`알 수 없는 처치 연출: ${d.fx}`);
    const ghost = this.ghost(enemyTexture(this.scene, def.art), aim.x, aim.y, def.scale ?? 1);
    if (ghost) {
      fx(this.scene, ghost, t, this);
      // 트윈이 끝나면 다시 쓸 수 있게 (그사이 다른 처치에 다시 쓰였으면 건드리지 않는다)
      const id = ghost.useId;
      this.scene.time.delayedCall(t.ghostLife, () => ghost.useId === id && ghost.setVisible(false));
    }
    if (d.text) this.stamp(aim.x, aim.y - t.stampOffsetY, d.text);
  }

  // 도장 글자: 크게 찍혔다가 쾅 줄어들고 잠깐 뒤 사라진다
  stamp(x, y, text) {
    const t = CONFIG.takedown;
    const s = this.stamps.find((o) => !o.visible);
    if (!s) return;
    this.scene.tweens.killTweensOf(s);
    s.setText(text)
      .setPosition(x, y)
      .setAngle(Phaser.Math.Between(-t.stampTilt, t.stampTilt))
      .setScale(t.stampFrom)
      .setAlpha(1)
      .setVisible(true);
    this.scene.tweens.add({ targets: s, scale: 1, duration: t.stampSlam, ease: 'Quad.in' });
    this.scene.tweens.add({ targets: s, alpha: 0, y: y - t.stampRise, delay: t.stampHold, duration: t.stampFade, onComplete: () => s.setVisible(false) });
  }

  // 보스·엘리트 퇴근: 화면이 잠깐 멈추고 하얗게 번쩍, 크게 대사, 종이가 한 번 더 터진다
  bossDown(def, enemy) {
    const b = CONFIG.takedown.boss;
    const scene = this.scene;
    scene.juice.hitStop(b.hitStop, true);
    scene.cameras.main.flash(b.flash, 255, 255, 255);
    scene.juice.shake(b.shake);
    const aim = enemy.getAimPoint ? enemy.getAimPoint() : enemy;
    scene.juice.paper.explode(b.paper, aim.x, aim.y);
    scene.juice.sfx.play('levelUp');
    scene.hud.showWarning(def.defeatLine ?? `${def.name}님 퇴근!`, CONFIG.colors.accent);
  }
}
