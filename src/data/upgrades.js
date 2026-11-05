// 능력(아이템) 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 4장)
// 2화에서는 아이템 칸이 아직 없고, 승진 때 고를 무기 카드가 하나도 없을 때 나오는 카드(fallback)만 쓴다
//
// 항목 필드
//   id           고유 이름 (영문)
//   name         화면에 보이는 이름
//   icon         아이콘 그림 키 (src/art 의 텍스처 키)
//   description  카드에 보이는 설명
//   effect       효과. { heal: 멘탈 회복량 }
//   fallback     true 면 고를 무기 카드가 없을 때 나온다
//   credit       시청자 아이디어면 { nickname, comment }, 아니면 null

export const UPGRADES = [
  {
    id: 'pantry-coffee',
    name: '탕비실 커피믹스',
    icon: 'projectile-americano',
    description: '멘탈 2 회복',
    effect: { heal: 2 },
    fallback: true,
    credit: null,
  },
];
