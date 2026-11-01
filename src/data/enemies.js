// 몬스터 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 4장)
//
// 항목 필드
//   id             고유 이름 (영문)
//   name           화면에 보이는 이름
//   art            그림 키. src/art/enemies.js 에 없으면 기본 몬스터 그림을 쓴다
//   hp             체력
//   speed          주인공을 쫓는 속도(px/초)
//   contactDamage  주인공에게 닿았을 때 깎는 멘탈
//   xp             처치 시 경험치 (1화에서는 처리한 업무 수로만 센다)
//   spawnWeight    스폰될 확률 비중 (클수록 자주)
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
];
