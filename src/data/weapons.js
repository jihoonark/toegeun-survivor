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
//   pierce       몇 마리를 더 뚫고 지나가는지 (0이면 첫 적에서 사라짐)
//   spin         투사체 회전 속도(도/초)
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
