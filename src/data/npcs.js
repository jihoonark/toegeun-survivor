// 사무실 NPC 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 12장 "사무실 NPC")
// NPC는 자리 이벤트 결과로 나타나 주인공을 따라다닌다. 몬스터와 부딪히지 않고 맞지도 않는다
//
// 항목 필드
//   id          고유 이름 (영문)
//   name        이름
//   art         그림 키 (src/art/npcs.js)
//   follow      따라다니기 { distance: 주인공과 떨어지는 거리(px), speed: px/초 }
//   modes       행동 방식별 설정. 자리 이벤트 결과의 mode 로 고른다
//     ally      도와준다: interval(ms)마다 range(px) 안의 가장 가까운 몬스터를 damage 만큼 친다
//     pester    방해한다: interval(ms)마다 enemy 몬스터를 count 마리 주인공 쪽으로 보낸다
//     lines     그때 머리 위에 뜨는 말 (차례로 돌아가며)
//     mark      머리 위에 늘 떠 있는 표시 (없으면 없음)
//   credit      시청자 아이디어면 { nickname, comment }, 아니면 null

export const NPCS = [
  {
    id: 'senior',
    name: '선배',
    art: 'senior',
    follow: { distance: 26, speed: 110 },
    modes: {
      ally: {
        interval: 1800,
        range: 80,
        damage: 4,
        lines: ['이건 내가 할게!', '아까 고마웠어', '퇴근은 같이 하자', '이 메일 내가 받을게'],
      },
      pester: {
        interval: 7000,
        enemy: 'email',
        count: 2,
        lines: ['저기… 메신저 봤어?', '바쁜가 보네…', '이것만 좀…', '읽었잖아…'],
        mark: '읽씹',
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
