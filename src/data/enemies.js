// 몬스터 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 4장)
//
// 항목 필드
//   id             고유 이름 (영문)
//   name           화면에 보이는 이름
//   art            그림 키. src/art/enemies.js 에 없으면 기본 몬스터 그림을 쓴다
//   hp             체력
//   speed          주인공을 쫓는 속도(px/초)
//   contactDamage  주인공에게 닿았을 때 깎는 멘탈
//   xp             처치 시 떨어뜨리는 결재 서류(경험치)
//   spawnWeight    스폰될 확률 비중 (클수록 자주). 0이면 저절로는 나오지 않는다 (쪼개질 때만)
//   appearAt       17:00 부터 몇 분 뒤부터 나오는지 (없으면 처음부터)
//   scale          그림 크기 배율 (없으면 1)
//   label          머리 위에 떠 있는 글자 (없으면 없음)
//   labelTime      있으면 label 이 이 시간(ms) 뒤 사라진다 (쪼개져 나온 작은 몬스터들처럼 많이 몰릴 때)
//   splitInto      처치하면 쪼개져 나오는 몬스터 { id, count } (없으면 null)
//   bodyWidth/bodyHeight  발밑 충돌 판정 크기 (몬스터끼리 밀어내기, 주인공과 닿기)
//   hitRadius      투사체에 맞는 판정 반지름. 바닥이 아니라 몸 한가운데 기준(px)
//   hop            통통 뛰기 { height: 높이 px, duration: 한 번 뛰는 시간 ms, squash: 착지 찌그러짐 0~1 }
//                  안 뛰는 몬스터는 null
//   credit         시청자 아이디어면 { nickname, comment }, 아니면 null
//                  credit이 있으면 등장할 때 "○○님의 [이름]" 이름표가 붙는다

export const ENEMIES = [
  {
    id: 'email',
    name: '이메일',
    art: 'email',
    hp: 3,
    speed: 38,
    contactDamage: 1,
    xp: 1,
    spawnWeight: 1,
    bodyWidth: 16,
    bodyHeight: 8,
    hitRadius: 11,
    hop: { height: 6, duration: 480, squash: 0.25 },
    credit: null,
  },
  {
    // 잡으면 최종2 두 개로, 최종2 를 잡으면 진짜최종 두 개로 쪼개진다
    id: 'pptx-final',
    name: '최종.pptx',
    label: '최종.pptx',
    art: 'pptx',
    scale: 1.15,
    hp: 5,
    speed: 30,
    contactDamage: 1,
    xp: 2,
    spawnWeight: 0.45,
    appearAt: 10,
    bodyWidth: 18,
    bodyHeight: 9,
    hitRadius: 13,
    hop: { height: 4, duration: 620, squash: 0.2 },
    splitInto: { id: 'pptx-final2', count: 2 },
    credit: null,
  },
  {
    id: 'pptx-final2',
    name: '최종2.pptx',
    label: '최종2.pptx',
    labelTime: 900,
    art: 'pptx',
    scale: 0.85,
    hp: 3,
    speed: 42,
    contactDamage: 1,
    xp: 1,
    spawnWeight: 0,
    bodyWidth: 14,
    bodyHeight: 7,
    hitRadius: 10,
    hop: { height: 4, duration: 480, squash: 0.2 },
    splitInto: { id: 'pptx-real-final', count: 2 },
    credit: null,
  },
  {
    id: 'pptx-real-final',
    name: '진짜최종.pptx',
    label: '진짜최종.pptx',
    labelTime: 900,
    art: 'pptx',
    scale: 0.65,
    hp: 1,
    speed: 56,
    contactDamage: 1,
    xp: 1,
    spawnWeight: 0,
    bodyWidth: 10,
    bodyHeight: 6,
    hitRadius: 7,
    hop: { height: 3, duration: 360, squash: 0.2 },
    splitInto: null,
    credit: null,
  },
  {
    // 퇴근 직전에만 나와서 빠르게 달려든다
    id: 'deadline',
    name: '오늘까지 되죠?',
    label: '오늘까지 되죠?',
    labelTime: 1200,
    art: 'deadline',
    hp: 4,
    // 주인공(90)보다 빨라서 도망으로는 못 피한다
    speed: 108,
    contactDamage: 2,
    xp: 3,
    spawnWeight: 1.2,
    appearAt: 50,
    bodyWidth: 14,
    bodyHeight: 8,
    hitRadius: 10,
    hop: { height: 3, duration: 260, squash: 0.15 },
    credit: null,
  },
];

export function getEnemy(id) {
  const enemy = ENEMIES.find((e) => e.id === id);
  if (!enemy) throw new Error(`알 수 없는 몬스터: ${id}`);
  return enemy;
}
