// 내 자리 이벤트 (GAME_SPEC.md 12장 "내 자리"). 항목 하나를 추가하면 게임에 들어간다
// 책상 앞에 서면 모니터로 확대되며 회사 PC 화면이 열리고, 그중 하나가 무작위로 나온다
// 한 번 쓰면 config desk.cooldown 분 뒤에 다시 열린다
//
// 지금 있는 종류: 'quiz' — 메신저로 누가 물어보고, 맞히면 보상 카드 3장 중 하나, 틀리면 벌칙
//
// 항목 필드
//   id         고유 이름 (영문)
//   app        'quiz'
//   from       메신저에서 말을 거는 사람 / avatar: 이름 동그라미 색
//   intro      퀴즈 전에 보내는 말 (하나를 무작위로)
//   timeLimit  답할 수 있는 시간(ms)
//   correct    맞혔을 때 상대가 하는 말 / wrong: 틀렸을 때
//   rewards    맞히면 고르는 보상 카드
//              { id, icon(이모지), name, desc, effect }
//              effect: { heal: 멘탈 회복, xp: 결재 서류(경험치), npc: NPC id, mode: NPC 행동 }
//   penalty    틀리거나 시간이 지나면 { notice: 메신저 마지막 줄, warning: 게임 화면 경고, enemy: 몬스터 id, count }
//   credit     시청자 아이디어면 { nickname, comment }, 아니면 null
// 퀴즈 문제는 src/data/quizzes.js

export const DESK_EVENTS = [
  {
    id: 'senior-quiz',
    app: 'quiz',
    from: '선배',
    avatar: '#e8743b',
    intro: ['바빠? 하나만 물어보자 😅', '잠깐! 이거 뭐였지?', '나 이거 헷갈려서…'],
    timeLimit: 10000,
    correct: '오 맞아! 고마워 🙏 뭐 필요한 거 있어?',
    wrong: '앗… 그거 아닌데…',
    rewards: [
      { id: 'rest', icon: '🧘', name: '칼퇴 의지', desc: '멘탈 +3', effect: { heal: 3 } },
      { id: 'papers', icon: '📑', name: '결재 서류 한 묶음', desc: '서류 20장 (거의 바로 승진)', effect: { xp: 20 } },
      { id: 'senior', icon: '🛡️', name: '선배 지원', desc: '40초 동안 5초마다 업무를 막아 줌', effect: { npc: 'senior', mode: 'guard' } },
    ],
    penalty: {
      notice: '📞 거래처에서 전화가 옵니다…',
      warning: '거래처가 쫓아옵니다!',
      enemy: 'client-call',
      count: 1,
    },
    credit: null,
  },
];
