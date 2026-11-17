// 층 목록 (GAME_SPEC.md 12장 "판 구조", "층 구성"). 항목 하나를 추가하면 엘리베이터에 층이 생긴다
// 배열 순서 = 올라가는 순서가 아니라 공개 순서. 첫 층은 처음부터 열려 있고, 앞 층을 클리어하면 다음 층이 열린다
//
// 항목 필드
//   id        층 번호 (엘리베이터 버튼 숫자)
//   name      화면에 보이는 이름 ("15층")
//   zone      구역 이름 ("우리 팀")
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
    zone: '우리 팀',
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
];

export function getFloor(id) {
  const floor = FLOORS.find((f) => f.id === id);
  if (!floor) throw new Error(`알 수 없는 층: ${id}`);
  return floor;
}
