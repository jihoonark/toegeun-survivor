// 사무실 NPC 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 12장 "사무실 NPC")
// NPC는 내 자리 보상 등으로 나타나 주인공을 따라다닌다. 몬스터와 부딪히지 않고 맞지도 않는다
//
// 항목 필드
//   id          고유 이름 (영문)
//   name        이름
//   art         그림 키 (src/art/npcs.js)
//   follow      따라다니기 { distance: 주인공과 떨어지는 거리(px), speed: px/초 }
//   modes       행동 방식별 설정. 내 자리 보상의 mode 로 고른다
//     guard     막아 주기: interval(ms)마다 주인공 앞으로 뛰어나와 서류철을 들고, active(ms) 동안 주인공 둘레 radius(px) 안의
//               몬스터를 push(px/초)로 밀어낸다. 펴는 순간 원 안 몬스터에게 "접수!" 도장과 damage 만큼 피해
//     duration  함께 있는 시간(ms). 지나면 leaveLine 을 남기고 떠난다
//     hp        체력. 몬스터에 닿으면 깎이고, 0이 되면 defeatLine 을 남기고 먼저 떠난다
//     join      나타날 때 화면에 뜨는 알림
//     refreshLine / refreshNotice  이미 함께 있는데 또 불렀을 때 (새로 오지 않고 시간만 처음부터)
//     lines     막을 때 머리 위에 뜨는 말 (차례로)
//   credit      시청자 아이디어면 { nickname, comment }, 아니면 null

export const NPCS = [
  {
    id: 'senior',
    name: '선배',
    art: 'senior',
    follow: { distance: 26, speed: 120 },
    modes: {
      guard: {
        interval: 5000,
        active: 1500,
        radius: 64,
        push: 180,
        damage: 1,
        duration: 40000,
        join: '선배 합류! 5초마다 업무를 막아 줍니다',
        lines: ['이건 내가 받을게!', '결재는 내 담당!', '여기 맡겨!', '접수 완료!'],
        leaveLine: '먼저 퇴근할게~ 수고해!',
        refreshLine: '또 불렀어? 좋아, 더 있어 줄게!',
        refreshNotice: '선배 지원 시간이 다시 40초로!',
        hp: 6,
        hurtLine: '아야!',
        defeatLine: '더는 못 버티겠어… 먼저 갈게 😵',
        defeatNotice: '선배가 지쳐서 먼저 퇴근했습니다',
      },
    },
    credit: null,
  },
];

export function getNpc(id) {
  const npc = NPCS.find((n) => n.id === id);
  if (!npc) throw new Error(`알 수 없는 NPC: ${id}`);
  return npc;
}
