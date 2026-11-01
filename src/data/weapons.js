// 무기 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 4장)
//
// 항목 필드
//   id          고유 이름 (영문)
//   name        화면에 보이는 이름
//   projectile  투사체 그림 키. src/art/projectiles.js 에 없으면 기본 투사체 그림을 쓴다
//   damage      한 번 맞힐 때 데미지
//   cooldown    발사 간격(ms)
//   speed       투사체 속도(px/초)
//   range       이 거리 안의 가장 가까운 적을 노린다(px)
//   lifetime    투사체가 사라지기까지 시간(ms)
//   pierce      몇 마리를 더 뚫고 지나가는지 (0이면 첫 적에서 사라짐)
//   spin        투사체 회전 속도(도/초)
//   credit      시청자 아이디어면 { nickname, comment }, 아니면 null
//
// 전체 공격 속도·데미지 배율은 config.js 의 combat 에서 조절한다

export const WEAPONS = [
  {
    id: 'americano',
    name: '아메리카노 던지기',
    projectile: 'americano',
    damage: 1,
    cooldown: 700,
    speed: 200,
    range: 180,
    lifetime: 1200,
    pierce: 0,
    spin: 540,
    credit: null,
  },
];

export function getWeapon(id) {
  const weapon = WEAPONS.find((w) => w.id === id);
  if (!weapon) throw new Error(`알 수 없는 무기: ${id}`);
  return weapon;
}
