// 능력(아이템) 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 4장)
// 아이템은 공격하지 않고 능력치를 올린다. 무기 칸 아래 아이템 칸(config items.slots)에 들어가 레벨이 오른다
// fallback 카드는 칸에 들어가지 않는 일회용 카드다 (고를 무기·아이템 카드가 없거나 멘탈이 낮을 때)
//
// 항목 필드
//   id           고유 이름 (영문)
//   name         화면에 보이는 이름
//   icon         아이콘 그림 키 (src/art/items.js 에 없으면 다른 그림 키, 그것도 없으면 물음표 상자)
//   description  카드에 보이는 설명 (처음 얻을 때)
//   effect       레벨마다 더해지는 효과
//                  moveSpeed: 이동 속도 증가 비율 (0.1 = +10%)
//                  maxMental: 최대 멘탈 증가
//                  heal:      얻는 순간 멘탈 회복
//   maxLevel     최대 레벨 (없으면 config items.maxLevel)
//   levelDesc    강화 카드에 보이는 설명
//   fallback     true 면 칸에 들어가지 않는 일회용 카드
//   credit       시청자 아이디어면 { nickname, comment }, 아니면 null

const VIEWER_DRINKS = {
  nickname: '@minseonan9716',
  // 원문 그대로 보관한다 (상품 이름이 들어 있어 화면에는 닉네임만 쓴다)
  comment: '자양강장제(바카스?), 레드불, 비타민, 우루사? ㅋㅋㅋ',
};

export const UPGRADES = [
  {
    id: 'energy-drink',
    name: '자양강장제',
    icon: 'energy-drink',
    description: '이동 속도 +10%',
    effect: { moveSpeed: 0.1 },
    maxLevel: 3,
    levelDesc: '이동 속도 +10% 더',
    credit: VIEWER_DRINKS,
  },
  {
    id: 'multivitamin',
    name: '종합비타민',
    icon: 'multivitamin',
    description: '최대 멘탈 +1, 회복 1',
    effect: { maxMental: 1, heal: 1 },
    maxLevel: 3,
    levelDesc: '최대 멘탈 +1 더',
    credit: VIEWER_DRINKS,
  },
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

export const SLOT_ITEMS = UPGRADES.filter((u) => !u.fallback);
export const FALLBACK_ITEMS = UPGRADES.filter((u) => u.fallback);
