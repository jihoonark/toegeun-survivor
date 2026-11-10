// 자리 이벤트 목록. 항목 하나를 추가하면 게임에 들어간다 (GAME_SPEC.md 12장 "내 자리")
// 정해진 시각에 내 자리 모니터에 알림이 뜨고, 책상 앞에 서면 회사 PC 화면으로 넘어간다
//
// 항목 필드
//   id           고유 이름 (영문)
//   name         이벤트 이름 (기록용)
//   at           17:00 부터 몇 분 뒤에 알림이 뜨는지
//   expireAfter  알림이 뜬 뒤 이 시간(분) 안에 자리에 가지 않으면 expireChoice 를 고른 것으로 본다
//   app          PC 화면에 띄울 프로그램 ('messenger')
//   from         메시지를 보낸 사람 이름 / avatar: 이름 칸 동그라미 색
//   notice       알림이 뜰 때 화면에 잠깐 보이는 글자
//   messages     상대가 보내는 말 (차례로 뜬다)
//   choices      고를 수 있는 답 [{ key, label, reply: 내가 보내는 말(없으면 안 보냄), seen: 읽음 표시 글자, result }]
//                result: { busy: 그 자리에서 꼼짝 못 하는 시간(ms), busyText, npc: 나타날 NPC id, mode: NPC 행동 }
//   expireChoice 시간 안에 안 가면 고른 것으로 칠 choices 의 key
//   credit       시청자 아이디어면 { nickname, comment }, 아니면 null

export const DESK_EVENTS = [
  {
    id: 'senior-sos',
    name: '선배의 SOS',
    at: 8,
    expireAfter: 12,
    app: 'messenger',
    from: '선배',
    avatar: '#e8743b',
    notice: '메신저 알림 1 · 내 자리로!',
    messages: ['바빠? 😅', '잠깐 이거 좀 봐줄래?', '엑셀이 또 이상해…'],
    choices: [
      {
        key: 'help',
        label: '도와주기',
        reply: '네, 바로 볼게요!',
        result: { busy: 3000, busyText: '엑셀 봐 주는 중…', npc: 'senior', mode: 'ally' },
      },
      {
        key: 'ignore',
        label: '못 본 척',
        reply: null,
        seen: '읽음',
        result: { npc: 'senior', mode: 'pester' },
      },
    ],
    expireChoice: 'ignore',
    credit: null,
  },
];

export function getDeskEvent(id) {
  const event = DESK_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`알 수 없는 자리 이벤트: ${id}`);
  return event;
}
