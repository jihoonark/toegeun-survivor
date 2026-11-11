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
//   boss           true 면 화면 위에 체력 막대가 뜬다 (config spawn.waves 의 boss 로 나온다)
//   summon         있으면 every(ms)마다 id 몬스터를 count 마리 불러낸다 { id, count, every }
//   knockbackScale 넉백 받는 비율 (없으면 1, 0이면 안 밀림)
//   stunScale      스테이플러 고정 시간 비율 (없으면 1)
//   xpPieces       처치 시 결재 서류를 몇 장으로 나눠 떨어뜨리는지 (없으면 1)
//   group          있으면 저절로 나올 때 이만큼 한꺼번에 모여서 나온다 (포스트잇 떼) / groupGap: 서로 떨어진 거리(px)
//   attack         있으면 말풍선을 쏜다 (systems/EnemyShots.js)
//                  { lines: 쏘는 말, interval(ms), speed(px/초), damage, range(px), lifetime(ms),
//                    rageAfter(ms): 나온 뒤 이만큼 지나면 화남, rageBelow: 체력이 이 비율 아래면 화남,
//                    rageInterval, rageCount: 화나면 몇 갈래, rageSpread: 갈래 사이 각도(도),
//                    rageSpeed: 화나면 이동 속도 배율, rageLabel: 화나면 바뀌는 머리 위 글자 }
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
    appearAt: 14,
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
  {
    // 17:30 중간 보스. 느리지만 튼튼하고, 이메일을 계속 불러낸다
    id: 'team-lead',
    name: '팀장',
    label: '이거 하나만 더',
    art: 'team-lead',
    scale: 1.6,
    hp: 130,
    speed: 32,
    contactDamage: 2,
    xp: 40,
    xpPieces: 10,
    spawnWeight: 0,
    boss: true,
    summon: { id: 'email', count: 2, every: 4500 },
    // 잔소리 말풍선. 20초가 지나거나 체력이 반 아래면 화나서 3갈래로
    attack: {
      lines: ['그거 말고', '다시 해 와', '이거 왜 이래?', '내일까지 돼?', '한 장으로 줄여 봐', '근거가 뭐야?'],
      interval: 2400,
      speed: 85,
      damage: 1,
      range: 240,
      lifetime: 3000,
      rageAfter: 20000,
      rageBelow: 0.5,
      rageInterval: 1800,
      rageCount: 3,
      rageSpread: 24,
      rageSpeed: 1.3,
      rageLabel: '화났다!!',
    },
    knockbackScale: 0.1,
    stunScale: 0.3,
    bodyWidth: 22,
    bodyHeight: 10,
    hitRadius: 18,
    hop: null,
    credit: null,
  },
  {
    // 느리고 튼튼하다. 잡으면 서류를 넉넉히
    id: 'meeting',
    name: '회의 초대',
    label: '30분만 회의할까요?',
    labelTime: 1500,
    art: 'meeting',
    scale: 1.1,
    hp: 7,
    speed: 26,
    contactDamage: 1,
    xp: 3,
    spawnWeight: 0.4,
    appearAt: 20,
    bodyWidth: 18,
    bodyHeight: 9,
    hitRadius: 13,
    hop: { height: 3, duration: 700, squash: 0.2 },
    credit: null,
  },
  {
    // 작고 빠르게 세 장씩 몰려온다
    id: 'postit',
    name: '포스트잇',
    label: '이것도요',
    labelTime: 700,
    art: 'postit',
    scale: 0.7,
    hp: 1,
    speed: 54,
    contactDamage: 1,
    xp: 1,
    spawnWeight: 0.18,
    group: 3,
    groupGap: 10,
    appearAt: 25,
    bodyWidth: 10,
    bodyHeight: 6,
    hitRadius: 8,
    hop: { height: 4, duration: 320, squash: 0.25 },
    credit: null,
  },
  {
    // 내 자리 퀴즈를 틀리면 나온다. 주인공보다 조금 빠르고 튼튼해서 잡아야 떨어진다
    id: 'client-call',
    name: '거래처',
    label: '통화 가능하세요?',
    art: 'client-call',
    scale: 1.25,
    hp: 30,
    speed: 96,
    contactDamage: 2,
    xp: 8,
    xpPieces: 4,
    spawnWeight: 0,
    knockbackScale: 0.4,
    bodyWidth: 18,
    bodyHeight: 9,
    hitRadius: 14,
    hop: { height: 5, duration: 240, squash: 0.15 },
    credit: null,
  },
];

export function getEnemy(id) {
  const enemy = ENEMIES.find((e) => e.id === id);
  if (!enemy) throw new Error(`알 수 없는 몬스터: ${id}`);
  return enemy;
}
