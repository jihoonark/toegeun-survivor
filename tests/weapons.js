// 개발 서버의 /tests/weapons.html에서 실제 Phaser 바디·풀·승진 경로를 검사한다.
import Phaser from 'phaser';
import { CONFIG } from '../src/config.js';
import { getWeapon, statsAt, maxLevelOf } from '../src/data/weapons.js';
import { ENEMIES } from '../src/data/enemies.js';
import { createHeroTextures } from '../src/art/hero.js';
import { createProjectileTextures } from '../src/art/projectiles.js';
import { createEnemyTextures } from '../src/art/enemies.js';
import { createEffectTextures } from '../src/art/effects.js';
import Enemy from '../src/entities/Enemy.js';
import Combat from '../src/systems/Combat.js';
import Promotion from '../src/systems/Promotion.js';
import Hud from '../src/systems/Hud.js';
import Pickups from '../src/systems/Pickups.js';
import Juice from '../src/systems/Juice.js';

const results = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function test(name, run) {
  try { run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}

class WeaponTestScene extends Phaser.Scene {
  create() {
    createHeroTextures(this);
    createProjectileTextures(this);
    createEnemyTextures(this);
    createEffectTextures(this);
    const card = getWeapon('corporate-card');
    const coffee = getWeapon('americano');
    const owner = this.physics.add.sprite(180, 140, '__DEFAULT');
    const enemies = this.physics.add.group({ classType: Enemy });
    const combat = new Combat(this, owner, enemies);
    const promotion = new Promotion(this, combat, owner);
    const hud = new Hud(this);
    this.events.on('weapon-added', () => hud.setWeapons(combat.weapons));
    this.events.on('weapon-upgraded', () => hud.setWeapons(combat.weapons));
    combat.addStarterWeapons();

    test('시작 무기 유지와 새 무기 승진 카드', () => {
      assert(combat.weapons.length === 1 && combat.weapons[0].def === coffee, '시작 무기 변경');
      const choice = promotion.choices().find((c) => c.type === 'new' && c.weapon === card);
      assert(choice && choice.desc === card.description, '새 무기 카드 누락');
      promotion.pending = 1;
      promotion.pick(choice);
      assert(hud.slots[1].icon.texture.key === 'projectile-corporate-card', '무기 칸 그림 누락');
    });
    test('1~5단계 누적 강화와 최대 단계 카드 제외', () => {
      const expected = [[1, 1250, 1], [2, 1250, 1], [2, 900, 1], [2, 900, 2], [3, 900, 2]];
      for (let level = 1; level <= 5; level++) {
        const s = statsAt(card, level);
        assert(JSON.stringify([s.count, s.cooldown, s.damage]) === JSON.stringify(expected[level - 1]), `단계 ${level} 수치`);
        if (level > 1) combat.upgradeWeapon(card.id);
      }
      assert(maxLevelOf(card) === 5 && hud.slots[1].level.text === '5', '최대 단계 표시');
      assert(!promotion.choices().some((c) => c.weapon === card), '최대 단계 카드 재등장');
    });

    const p = combat.projectiles.get();
    const launch = (weapon = card) => {
      this.physics.world.resume();
      p.fire(weapon, owner.x, owner.y - CONFIG.player.handHeight, 0, weapon.damage, owner);
    };
    test('왕복 각각 한 번 명중, 등장 번호가 바뀐 적은 새로 명중', () => {
      launch();
      const target = { spawnId: 1 };
      assert(p.hit(target) && !p.hit(target) && p.active, '출발 중 중복 명중');
      p.setPosition(owner.x + 80, owner.y - CONFIG.player.handHeight);
      p.updateReturn(card.returnAfter);
      assert(p.returning && p.hit(target) && !p.hit(target), '귀환 중 중복 명중');
      target.spawnId++;
      assert(p.hit(target), '재사용된 적 명중 누락');
    });
    test('히트스톱 동안 귀환·수명·회전 정지', () => {
      launch();
      const before = [p.returnLeft, p.lifeLeft, p.angle];
      this.physics.world.pause();
      p.preUpdate(0, 300);
      assert(JSON.stringify(before) === JSON.stringify([p.returnLeft, p.lifeLeft, p.angle]), '정지 중 상태 변화');
      this.physics.world.resume();
    });
    test('이동한 주인공 추적과 손 도착 시 회수', () => {
      launch();
      p.setPosition(owner.x + 90, owner.y - 50);
      p.updateReturn(card.returnAfter);
      assert(p.body.velocity.x < 0 && p.body.velocity.y > 0, '귀환 방향');
      owner.y += 30;
      p.updateReturn(16);
      assert(p.body.velocity.y > 0, '이동한 손 추적');
      p.setPosition(owner.x, owner.y - CONFIG.player.handHeight);
      p.updateReturn(16);
      assert(!p.active && !p.body.enable, '회수 실패');
    });

    for (const delta of [1000 / 60, 1000 / 15]) {
      test(`실제 물리 이동과 왕복 명중 (${Math.round(1000 / delta)}프레임)`, () => {
        const enemy = enemies.get();
        enemy.spawn({ ...ENEMIES[0], hp: 100, hop: null }, owner.x + 60, owner.y);
        launch();
        try {
          for (let time = 0; p.active && time < card.lifetime; time += delta) {
            p.preUpdate(time, delta);
            this.physics.world.update(time, delta);
            this.physics.world.postUpdate();
            combat.checkHits();
          }
          assert(!p.active, '회수 실패 또는 수명 종료 지연');
          assert(p.lifeLeft > 0, '회수 대신 수명으로 제거됨');
          assert(enemy.hp === 100 - card.damage * 2, `왕복 피해 불일치: ${enemy.hp}`);
        } finally {
          enemy.remove();
        }
      });
    }
    test('수명 제한과 주인공 제거 시 투사체 회수', () => {
      launch();
      p.preUpdate(0, card.lifetime);
      assert(!p.active, '수명 제한 실패');
      launch();
      owner.setActive(false);
      p.preUpdate(0, 16);
      assert(!p.active, '주인공 없는 투사체 잔류');
      owner.setActive(true);
    });
    test('같은 풀 객체를 아메리카노로 재사용', () => {
      launch();
      p.setPosition(owner.x + 80, owner.y);
      p.updateReturn(card.returnAfter);
      p.remove();
      assert(combat.projectiles.get() === p, '풀 재사용 실패');
      launch(coffee);
      p.preUpdate(0, 16);
      assert(!p.returning && p.returnLeft == null && p.body.velocity.x === coffee.speed, '귀환 상태 누수');
      assert(p.hit({ spawnId: 1 }) && !p.active, '기본 아메리카노 소멸 실패');
      launch(statsAt(coffee, 5));
      p.hit({ spawnId: 1 });
      assert(p.active, '아메리카노 관통 실패');
      p.hit({ spawnId: 2 });
      assert(!p.active, '아메리카노 관통 횟수 초과');
    });
    test('다른 이름의 데이터로 귀환 동작 재사용', () => {
      launch({ ...card, id: 'test-return', projectile: 'missing' });
      p.setPosition(owner.x + 80, owner.y);
      p.updateReturn(card.returnAfter);
      assert(p.returning && p.texture.key === 'projectile-default', '무기 이름에 종속됨');
      p.remove();
    });
    test('처치 타격감과 결재 서류 수집', () => {
      const juice = new Juice(this);
      const pickups = new Pickups(this, owner);
      const enemy = enemies.get();
      enemy.spawn({ ...ENEMIES[0], hp: card.damage }, owner.x + 20, owner.y);
      launch();
      combat.onHit(p, enemy);
      assert(!enemy.active && juice.frozen && this.physics.world.isPaused, '처치 히트스톱 누락');
      const paper = pickups.pool.find((item) => item.active);
      assert(paper && paper.value === ENEMIES[0].xp, '결재 서류 누락');
      const before = promotion.xp;
      pickups.collect(paper);
      assert(promotion.xp === before + ENEMIES[0].xp, '경험치 누락');
      juice.update(juice.frozenUntil);
      assert(!this.physics.world.isPaused, '히트스톱 해제 실패');
      p.remove();
    });
    test('최대 단계 다중 발사와 풀 한도', () => {
      const target = { getCenter: () => ({ x: owner.x + 80, y: owner.y }) };
      combat.fire(statsAt(card, 5), target, 2);
      assert(combat.projectiles.countActive(true) === 3, '카드 3장 발사 실패');
      combat.fire(statsAt(coffee, 5), target, 2);
      assert(combat.projectiles.countActive(true) === 6, '동시 무기 발사 실패');
      for (let i = 0; i < CONFIG.combat.projectilePoolSize; i++) combat.fire(statsAt(card, 5), target, 2);
      assert(combat.projectiles.countActive(true) === CONFIG.combat.projectilePoolSize, '풀 한도 위반');
      combat.projectiles.getChildren().forEach((item) => item.remove());
    });
    this.physics.world.pause();
    window.weaponTestResults = results;
    document.getElementById('results').textContent = results.map((r) => `${r.passed ? '통과' : '실패'}: ${r.name}${r.error ? ` — ${r.error}` : ''}`).join('\n');
  }
}

new Phaser.Game({
  type: Phaser.CANVAS, width: CONFIG.screen.width, height: CONFIG.screen.height,
  parent: 'game', pixelArt: true, backgroundColor: CONFIG.screen.backgroundColor,
  audio: { noAudio: true }, physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  scene: WeaponTestScene,
});
