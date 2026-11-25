// 층 목록 (GAME_SPEC.md 12장 "판 구조", "층 구성"). 항목 하나를 추가하면 엘리베이터에 층이 생긴다
// 배열 순서 = 올라가는 순서가 아니라 공개 순서. 첫 층은 처음부터 열려 있고, 앞 층을 클리어하면 다음 층이 열린다
//
// 항목 필드
//   id        층 번호 (엘리베이터 버튼 숫자)
//   name      화면에 보이는 이름 ("15층")
//   zone      구역 이름 ("기획팀")
//   intro     엘리베이터에서 층을 고르면 보이는 한 줄 소개
//   theme     분위기
//     floor     바닥 무늬 { pattern: 'carpet' | 'tile', base, dark, light } (색은 '#rrggbb')
//     light     조명 색을 화면 전체에 얇게 덮는다 { color: 0xrrggbb, alpha } (없으면 null)
//     music     배경음악 이름 (src/data/music.js)
//   map       맵. 좌표는 픽셀, 가구는 발밑(아래쪽 가운데) 기준
//     width, height   맵 크기 (화면 480x270 보다 넓게, 카메라가 따라간다)
//     start           주인공이 시작하는 곳 [x, y]
//     desk            내 자리 책상 발밑 [x, y]
//     stairs          18:00 에 계단이 생길 수 있는 곳들 [[x, y], ...]. 그때 주인공에게서 가장 먼 곳에 생긴다
//     furniture       [{ type, positions: [[x, y], ...] }] (그림은 src/art/office.js, 막는 크기는 config furnitureBlock)
//     rooms           유리벽 회의실 [{ name, x, y, w, h, door: 'top' | 'bottom' | 'left' | 'right' }] (systems/Rooms.js, 없으면 없음)
//     walls           회의실 밖 낱장 유리 칸막이 [{ x1, y1, x2, y2 }] 가로 또는 세로 한 줄 (없으면 없음)
//   stages    시간대별 난이도. 17:00 부터 at 분이 지나면 그 단계 값으로 서서히 바뀐다 (단계 사이는 부드럽게 이어진다)
//               interval: 다음 적이 나오기까지 간격(ms), batch: 한 번에 나오는 수 [최소, 최대]
//               hp / speed: 몬스터 기본 체력·속도에 곱하는 배율
//   enemies   저절로 나오는 몬스터 [{ id, weight: 나올 비중, from: 17:00 부터 몇 분 뒤부터(없으면 처음부터) }]
//   waves     몰려오는 패턴: 그 시각(17:00 부터 분)에 한꺼번에 나온다
//               ring: "전체 회신 폭탄!" 주인공을 빙 둘러 사방에서 / line: 한쪽에서 줄지어 (gap: 줄 간격 px)
//               boss: 보스 한 마리 (enemy 필수) / warning: 글자만 띄우는 알림
//               enemy: 나올 몬스터 id (없으면 그 시각에 나올 수 있는 몬스터 중에서 고른다)
//               warning: 있으면 그 글자를 화면에 크게 띄운다 (ring 은 없어도 "전체 회신 폭탄!")
//   elites    엘리트 등장 [{ id, at }] (src/data/elites.js)
//   rules     특별 규칙 [{ type, ... }] (systems/FloorRules.js). 없으면 []

export const FLOORS = [
  {
    id: 15,
    name: '15층',
    zone: '기획팀',
    intro: '옆 팀 과장과 팀장님이 기다리는 기획팀',
    theme: {
      floor: { pattern: 'carpet', base: '#565e74', dark: '#4b5266', light: '#626b82' },
      light: null,
      music: 'game',
    },
    map: {
      width: 960,
      height: 540,
      start: [480, 270],
      desk: [480, 238],
      stairs: [[60, 300], [900, 300], [480, 60], [480, 528]],
      furniture: [
        {
          type: 'desk',
          positions: [
            // 시작 화면 네 귀퉁이 책상 묶음 (가운데는 비워 둔다)
            [300, 200], [356, 200], [604, 200], [660, 200],
            [300, 380], [356, 380], [604, 380], [660, 380],
            // 바깥쪽 책상 줄
            [100, 110], [156, 110], [804, 110], [860, 110],
            [100, 480], [156, 480], [804, 480], [860, 480],
          ],
        },
        {
          type: 'plant',
          positions: [
            [24, 40], [936, 40], [24, 520], [936, 520],
            [480, 170], [480, 430], [250, 300], [710, 300],
          ],
        },
      ],
    },
    stages: [
      { at: 0, interval: 1150, batch: [1, 1], hp: 1, speed: 1 },
      { at: 10, interval: 950, batch: [1, 2], hp: 1.15, speed: 1.02 },
      { at: 20, interval: 900, batch: [1, 2], hp: 1.25, speed: 1 },
      { at: 30, interval: 750, batch: [1, 2], hp: 1.45, speed: 1.03 },
      { at: 40, interval: 600, batch: [1, 2], hp: 1.7, speed: 1.06 },
      { at: 50, interval: 480, batch: [2, 3], hp: 2, speed: 1.1 },
      { at: 55, interval: 440, batch: [2, 3], hp: 2.05, speed: 1.12 },
    ],
    enemies: [
      { id: 'email', weight: 1 },
      { id: 'pptx-final', weight: 0.45, from: 14 },
      { id: 'meeting', weight: 0.4, from: 20 },
      { id: 'postit', weight: 0.18, from: 25 },
      { id: 'deadline', weight: 0.7, from: 50 },
    ],
    waves: [
      { at: 3, type: 'line', count: 5, gap: 16, enemy: 'email' },
      { at: 6, type: 'line', count: 6, gap: 16, enemy: 'email' },
      { at: 9, type: 'ring', count: 8 },
      { at: 12, type: 'line', count: 8, gap: 16, enemy: 'email' },
      { at: 16, type: 'ring', count: 6 },
      { at: 20, type: 'line', count: 8, gap: 16, enemy: 'email' },
      { at: 25, type: 'line', count: 8, gap: 16, enemy: 'email' },
      { at: 30, type: 'boss', enemy: 'team-lead', warning: '팀장님 등장!' },
      { at: 36, type: 'line', count: 10, gap: 14, enemy: 'email' },
      { at: 40, type: 'ring', count: 10 },
      { at: 44, type: 'line', count: 10, gap: 14, enemy: 'email' },
      { at: 48, type: 'line', count: 12, gap: 14, enemy: 'email' },
      { at: 50, type: 'ring', count: 12 },
      { at: 55, type: 'warning', warning: '퇴근 5분 전!' },
      { at: 55.2, type: 'ring', count: 12 },
      { at: 58, type: 'line', count: 12, gap: 12, enemy: 'email' },
    ],
    // 17:15 옆 팀 과장 (팀장 전 구간을 긴장감 있게)
    elites: [{ id: 'neighbor-manager', at: 15 }],
    rules: [],
  },
  {
    id: 14,
    name: '14층',
    zone: '회의실 층',
    intro: '유리벽 회의실 미로. 회의 진행자와 팀장님까지 회의에 들어온다',
    theme: {
      floor: { pattern: 'tile', base: '#b9a98c', dark: '#a08f72', light: '#d4c6aa' },
      light: { color: 0xfff2c0, alpha: 0.07 },
      music: 'meeting',
    },
    map: {
      width: 1120,
      height: 640,
      start: [560, 356],
      desk: [560, 312],
      stairs: [[40, 222], [1080, 418], [560, 36], [300, 610]],
      // 회의실 10개가 둘레를 감싸고, 가운데 광장은 칸막이로 막혀 미로처럼 돌아가야 한다
      rooms: [
        { name: '회의실 A', x: 80, y: 70, w: 180, h: 110, door: 'bottom' },
        { name: '회의실 B', x: 340, y: 70, w: 180, h: 110, door: 'right' },
        { name: '회의실 C', x: 600, y: 70, w: 180, h: 110, door: 'bottom' },
        { name: '회의실 D', x: 860, y: 70, w: 180, h: 110, door: 'left' },
        { name: '회의실 E', x: 80, y: 265, w: 160, h: 110, door: 'right' },
        { name: '회의실 F', x: 880, y: 265, w: 160, h: 110, door: 'left' },
        { name: '회의실 G', x: 80, y: 460, w: 180, h: 110, door: 'top' },
        { name: '회의실 H', x: 340, y: 460, w: 180, h: 110, door: 'left' },
        { name: '회의실 I', x: 600, y: 460, w: 180, h: 110, door: 'top' },
        { name: '회의실 J', x: 860, y: 460, w: 180, h: 110, door: 'right' },
      ],
      walls: [
        { x1: 400, y1: 220, x2: 400, y2: 330 },
        { x1: 720, y1: 300, x2: 720, y2: 410 },
        { x1: 450, y1: 420, x2: 660, y2: 420 },
        { x1: 300, y1: 222, x2: 360, y2: 222 },
        { x1: 790, y1: 222, x2: 860, y2: 222 },
      ],
      furniture: [
        {
          type: 'plant',
          positions: [
            [24, 40], [1096, 40], [24, 620], [1096, 620],
            [300, 330], [820, 330], [560, 200], [560, 445],
          ],
        },
      ],
    },
    stages: [
      // 초반 밀도는 15층과 비슷하게 (14층의 어려움은 회의실 규칙·엘리트·팀장·미로에서)
      { at: 0, interval: 1150, batch: [1, 1], hp: 1, speed: 1 },
      { at: 10, interval: 950, batch: [1, 2], hp: 1.2, speed: 1.03 },
      { at: 20, interval: 760, batch: [1, 2], hp: 1.4, speed: 1.06 },
      { at: 30, interval: 640, batch: [1, 2], hp: 1.6, speed: 1.08 },
      { at: 40, interval: 480, batch: [2, 3], hp: 2.05, speed: 1.12 },
      { at: 50, interval: 420, batch: [2, 3], hp: 2.3, speed: 1.14 },
      { at: 55, interval: 400, batch: [2, 3], hp: 2.45, speed: 1.16 },
    ],
    // 회의 초대가 주인공 (처음 5분은 시작 무기로도 잡히는 이메일 위주). 포스트잇·보고서가 15층보다 일찍 나온다
    enemies: [
      { id: 'meeting', weight: 1, from: 5 },
      { id: 'email', weight: 0.8 },
      { id: 'pptx-final', weight: 0.35, from: 8 },
      { id: 'postit', weight: 0.25, from: 12 },
      { id: 'deadline', weight: 1, from: 48 },
    ],
    waves: [
      { at: 4, type: 'line', count: 6, gap: 16, enemy: 'email' },
      { at: 10, type: 'ring', count: 8 },
      { at: 18, type: 'line', count: 8, gap: 18, enemy: 'meeting' },
      { at: 25, type: 'ring', count: 10 },
      { at: 30, type: 'boss', enemy: 'team-lead', warning: '팀장님도 회의 들어오심!' },
      { at: 34, type: 'line', count: 10, gap: 14, enemy: 'email' },
      { at: 38, type: 'ring', count: 12 },
      { at: 45, type: 'line', count: 10, gap: 18, enemy: 'meeting' },
      { at: 50, type: 'ring', count: 12 },
      { at: 55, type: 'warning', warning: '퇴근 5분 전!' },
      { at: 55.2, type: 'ring', count: 14 },
      { at: 58, type: 'line', count: 12, gap: 12, enemy: 'email' },
    ],
    // 회의 진행자 → 옆 팀 과장(15층에서 따라 내려옴) → 17:30 팀장 → 회의 진행자 한 번 더
    elites: [
      { id: 'facilitator', at: 12 },
      { id: 'neighbor-manager', at: 21 },
      { id: 'facilitator', at: 42 },
    ],
    rules: [
      {
        type: 'meetingDoors',
        // 17:06 부터 (시작 무기만으로 회의 초대 떼를 감당하기 어렵다)
        first: 24000,
        every: 4500,
        count: [2, 4],
        enemy: 'meeting',
        range: 320,
        minDistance: 70,
        push: { strength: 120, duration: 300, spread: 0.35 },
        inset: 6,
        label: '회의 끝!',
      },
      { type: 'meetingStop', hold: 1000, label: '회의 중' },
    ],
  },
  {
    id: 13,
    name: '13층',
    zone: '기획팀',
    intro: '해 진 기획팀 사무실. 17:59에 팀장님이 기다린다 (시즌 1 마지막 층)',
    theme: {
      // 해가 지고 형광등이 반쯤 꺼진 사무실: 어두운 카펫에 푸른 밤빛을 덮는다
      floor: { pattern: 'carpet', base: '#3f4558', dark: '#353a4c', light: '#4a5166' },
      light: { color: 0x0c0a28, alpha: 0.3 },
      music: 'finale',
    },
    map: {
      width: 1000,
      height: 600,
      start: [500, 300],
      desk: [500, 268],
      stairs: [[50, 300], [950, 300], [500, 50], [500, 580]],
      furniture: [
        {
          type: 'desk',
          positions: [
            // 책상 줄이 사무실을 칸칸이 나눈다 (가운데 십자 통로는 비워 둔다)
            [150, 140], [206, 140], [262, 140], [738, 140], [794, 140], [850, 140],
            [150, 240], [206, 240], [262, 240], [738, 240], [794, 240], [850, 240],
            [150, 380], [206, 380], [262, 380], [738, 380], [794, 380], [850, 380],
            [150, 480], [206, 480], [262, 480], [738, 480], [794, 480], [850, 480],
            [400, 160], [600, 160], [400, 450], [600, 450],
          ],
        },
        {
          type: 'plant',
          positions: [
            [24, 40], [976, 40], [24, 580], [976, 580],
            [500, 200], [500, 400], [340, 300], [660, 300],
          ],
        },
      ],
    },
    // 14층보다 조금 더 세게. 17:59 에 시계가 멈추면 몬스터는 그 단계로 계속 나온다
    stages: [
      { at: 0, interval: 1050, batch: [1, 2], hp: 1.1, speed: 1 },
      { at: 10, interval: 900, batch: [1, 2], hp: 1.3, speed: 1.03 },
      { at: 20, interval: 760, batch: [1, 2], hp: 1.5, speed: 1.06 },
      { at: 30, interval: 640, batch: [1, 2], hp: 1.75, speed: 1.08 },
      { at: 40, interval: 520, batch: [2, 3], hp: 2.1, speed: 1.12 },
      { at: 50, interval: 460, batch: [2, 3], hp: 2.35, speed: 1.14 },
      { at: 58.9, interval: 460, batch: [2, 3], hp: 2.35, speed: 1.14 },
      // 팀장님과 붙는 동안은 몬스터가 드문드문 (보스에게 집중)
      { at: 59, interval: 2000, batch: [1, 1], hp: 2.35, speed: 1.14 },
    ],
    // 15·14층 몬스터가 다 섞여 나온다
    enemies: [
      { id: 'email', weight: 1 },
      { id: 'pptx-final', weight: 0.5, from: 6 },
      { id: 'meeting', weight: 0.6, from: 10 },
      { id: 'postit', weight: 0.25, from: 15 },
      { id: 'deadline', weight: 0.8, from: 45 },
    ],
    waves: [
      { at: 3, type: 'line', count: 6, gap: 16, enemy: 'email' },
      { at: 8, type: 'ring', count: 8 },
      { at: 14, type: 'line', count: 8, gap: 18, enemy: 'meeting' },
      { at: 26, type: 'ring', count: 10 },
      { at: 32, type: 'line', count: 10, gap: 14, enemy: 'email' },
      { at: 36, type: 'ring', count: 12 },
      { at: 46, type: 'line', count: 10, gap: 18, enemy: 'meeting' },
      { at: 50, type: 'ring', count: 12 },
      { at: 55, type: 'warning', warning: '퇴근 5분 전…?' },
      { at: 55.2, type: 'ring', count: 14 },
    ],
    // 17:20 옆 팀 과장, 17:40 회의 진행자
    elites: [
      { id: 'neighbor-manager', at: 20 },
      { id: 'facilitator', at: 40 },
    ],
    rules: [
      {
        // 17:59 에서 시계가 멈추고 팀장님(진심 모드). 퇴근시켜야 18:00, 계단이 열린다
        type: 'finalBoss',
        at: 59,
        enemy: 'team-lead-final',
        warning: '17:59… 팀장님: "이거 하나만 더"',
        tempo: 1.08,
        phases: [
          {
            below: 0.7,
            line: '이거 하나만 더',
            warning: '서류 더미가 날아온다!',
            skill: {
              type: 'toss',
              first: 1200,
              every: 5000,
              telegraph: 1000,
              lines: ['이거 하나만 더', '이것도 같이 봐 줘', '급한 거야'],
              range: 260,
              radius: 30,
              grabRadius: 140,
              count: 3,
              filler: 'pptx-final',
              flightTime: 550,
              arcHeight: 34,
              scatter: 14,
              damage: 1,
              reflectTime: 450,
              reflectDamage: 25,
            },
          },
          {
            below: 0.4,
            line: '잠깐 회의 하나만',
            warning: '긴급 회의 소집!',
            spawn: { id: 'meeting', count: 6, radius: 60 },
            skill: {
              type: 'spotlight',
              first: 1500,
              every: 3200,
              telegraph: 950,
              lines: ['자, 한 명씩 말해 봐', '너는 어떻게 생각해?', '다음?', '그래서 결론이 뭐야?'],
              range: 280,
              radius: 32,
              color: 0xffd23f,
              playerEvery: 2,
              hold: 1200,
              heldLabel: '회의 참석 중…',
              heldLine: '좋아, 그럼 그렇게 하자',
            },
          },
        ],
      },
    ],
  },
];

export function getFloor(id) {
  const floor = FLOORS.find((f) => f.id === id);
  if (!floor) throw new Error(`알 수 없는 층: ${id}`);
  return floor;
}
