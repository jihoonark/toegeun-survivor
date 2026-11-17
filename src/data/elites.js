// 엘리트 목록 (GAME_SPEC.md 12장 "엘리트"). 항목 하나를 추가하면 층 데이터(floors.js elites)에서 부를 수 있다
// 일반 몬스터보다 강하고 보스보다 약한 층별 강적. 나올 때 경고 글자, 화면 아래 체력 막대, 머리 위 이름표가 붙고
// 기술을 쓰기 전에 반드시 바닥에 예고 표시를 먼저 보여 준다 (systems/Elites.js)
//
// 항목 필드 (몬스터 필드는 src/data/enemies.js 와 같다: art, hp, speed, contactDamage, xp, xpPieces, scale,
//            bodyWidth/bodyHeight, hitRadius, hop, knockbackScale, stunScale, credit)
//   id        고유 이름 (영문)
//   name      이름표에 보이는 이름
//   warning   나올 때 화면에 크게 뜨는 글자
//   skill     기술 { type, first, every, telegraph, lines, ... }
//               type: systems/Elites.js 의 SKILLS 에 있는 기술 이름
//               first: 나온 뒤 첫 기술까지(ms), every: 그다음부터 간격(ms)
//               telegraph: 예고 표시가 떠 있는 시간(ms). 이동안 엘리트는 멈춰서 준비한다
//               lines: 기술을 쓸 때 말풍선 대사 (하나를 고른다)
//               나머지는 기술마다 다르다 (Elites.js 의 기술 설명 참고)

export const ELITES = [
  {
    // 15층 17:15. 주인공 발밑에 예고 원을 띄우고, 자기 둘레 몬스터를 그 원 안으로 던져 떠넘긴다
    id: 'neighbor-manager',
    name: '옆 팀 과장',
    label: '옆 팀 과장',
    warning: '옆 팀 과장 등장!',
    art: 'neighbor-manager',
    scale: 1.4,
    hp: 70,
    speed: 40,
    contactDamage: 2,
    xp: 25,
    xpPieces: 6,
    knockbackScale: 0.2,
    stunScale: 0.4,
    bodyWidth: 20,
    bodyHeight: 10,
    hitRadius: 16,
    hop: null,
    skill: {
      type: 'toss',
      first: 2500,
      every: 5500,
      telegraph: 1000,
      lines: ['이거 우리 팀 일 아니죠?', '그쪽 팀 일 같은데요?', '저희는 바빠서요~', '이건 넘길게요'],
      // 주인공이 range(px) 안에 있을 때만. 예고 원 반지름 radius(px)
      range: 180,
      radius: 28,
      // 자기 둘레 grabRadius(px) 안 일반 몬스터 count 마리 (모자라면 filler 몬스터를 새로 꺼내 던진다)
      grabRadius: 110,
      count: 3,
      filler: 'email',
      // 날아가는 시간(ms), 포물선 높이(px), 원 안에서 흩어지는 거리(px), 떨어질 때 원 안에 있으면 깎이는 멘탈
      flightTime: 550,
      arcHeight: 30,
      scatter: 14,
      damage: 1,
    },
    credit: null,
  },
];

for (const elite of ELITES) elite.elite = true;

export function getElite(id) {
  const elite = ELITES.find((e) => e.id === id);
  if (!elite) throw new Error(`알 수 없는 엘리트: ${id}`);
  return elite;
}
