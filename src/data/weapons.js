import { CONFIG } from '../config.js';

// 무기 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 4장)
// starter 가 아닌 무기는 승진 카드에 "새 무기"로 나온다
//
// 항목 필드
//   id           고유 이름 (영문)
//   name         화면에 보이는 이름
//   description  승진 카드에 보이는 한 줄 설명 (새 무기일 때)
//   projectile   투사체 그림 키. src/art/projectiles.js 에 없으면 기본 투사체 그림을 쓴다 (무기 칸 아이콘도 이 그림)
//   damage       한 번 맞힐 때 데미지
//   cooldown     발사 간격(ms)
//   count        한 번에 던지는 개수
//   spread       여러 개를 던질 때 사이 각도(도)
//   speed        투사체 속도(px/초)
//   range        이 거리 안의 가장 가까운 적을 노린다(px)
//   lifetime     투사체가 사라지기까지 시간(ms)
//   pierce       몇 마리를 더 뚫고 지나가는지 (0이면 첫 적에서 사라짐, Infinity면 제한 없음)
//   spin         투사체 회전 속도(도/초)
//   returnAfter  지정하면 이 시간(ms) 뒤 발사한 주인공을 향해 돌아온다. 왕복 각각 한 번씩 명중
//   returnSpeed  돌아올 때 속도(px/초). 돌아서는 순간 관통 횟수도 새로 센다
//   catchRadius  돌아온 투사체를 회수하는 손 주변 거리(px). lifetime은 왕복 전체의 제한 시간
//   orient       true 면 날아가는 방향을 바라본다 (spin 대신)
//   stun         맞은 몬스터를 이 시간(ms) 동안 그 자리에 고정한다 (없으면 0)
//   levels       Lv2 부터 바뀌는 값. levels[0] 이 Lv2. { desc: 카드 설명, 바뀌는 필드: 값 }
//                Lv1 은 위의 기본값이고, 레벨이 오르면 앞 레벨의 변경 위에 차례로 쌓인다
//   starter      true 면 처음부터 들고 시작한다
//   credit       시청자 아이디어면 { nickname, comment }, 아니면 null
//
// 전체 공격 속도·데미지 배율은 config.js 의 combat, 최대 레벨은 weapons.maxLevel

export const WEAPONS = [
  {
    id: 'americano',
    name: '아메리카노 던지기',
    description: '가장 가까운 업무에 뜨거운 아메리카노를 던진다',
    projectile: 'americano',
    damage: 1,
    cooldown: 700,
    count: 1,
    spread: 14,
    speed: 200,
    range: 180,
    lifetime: 1200,
    pierce: 0,
    spin: 540,
    levels: [
      { desc: '컵을 2개씩 던진다', count: 2 },
      { desc: '더 빨리 던진다', cooldown: 540 },
      { desc: '데미지 2', damage: 2 },
      { desc: '컵 3개, 한 마리를 뚫고 지나간다', count: 3, pierce: 1 },
    ],
    starter: true,
    credit: null,
  },
  {
    id: 'corporate-card',
    name: '법인카드',
    description: '업무를 관통하고 돌아오는 카드',
    projectile: 'corporate-card',
    damage: 1,
    cooldown: 1250,
    count: 1,
    spread: 32,
    speed: 240,
    range: 140,
    lifetime: 2500,
    pierce: Infinity,
    spin: 720,
    returnAfter: 500,
    returnSpeed: 300,
    catchRadius: 8,
    levels: [
      { desc: '카드 2장으로 넓게 긁는다', count: 2 },
      { desc: '더 자주 긁는다', cooldown: 900 },
      { desc: '왕복 각각 피해 2', damage: 2 },
      { desc: '카드 3장으로 부채꼴 관통', count: 3 },
    ],
    starter: false,
    credit: null,
  },
  {
    id: 'stapler',
    name: '스테이플러',
    description: '찍힌 업무는 잠깐 그 자리에 고정된다',
    projectile: 'staple',
    damage: 1,
    cooldown: 950,
    count: 1,
    spread: 10,
    speed: 280,
    range: 170,
    lifetime: 700,
    pierce: 0,
    spin: 0,
    orient: true,
    stun: 700,
    levels: [
      { desc: '더 오래 고정한다', stun: 1100 },
      { desc: '두 발씩 찍는다', count: 2 },
      { desc: '세 마리까지 뚫고 찍는다', pierce: 2 },
      { desc: '빠르고 세게 찍는다', cooldown: 650, damage: 2 },
    ],
    credit: null,
  },
];

export function getWeapon(id) {
  const weapon = WEAPONS.find((w) => w.id === id);
  if (!weapon) throw new Error(`알 수 없는 무기: ${id}`);
  return weapon;
}

export const maxLevelOf = (weapon) => Math.min(CONFIG.weapons.maxLevel, 1 + (weapon.levels?.length ?? 0));

// 그 레벨의 실제 수치 (기본값 위에 Lv2..level 의 변경을 차례로 덮는다)
export function statsAt(weapon, level) {
  const stats = { count: 1, spread: 0, ...weapon };
  for (const change of (weapon.levels ?? []).slice(0, level - 1)) {
    const { desc, ...values } = change;
    Object.assign(stats, values);
  }
  return stats;
}

export const levelDesc = (weapon, level) => weapon.levels?.[level - 2]?.desc ?? '강화';
