// 내 자리 퀴즈 문제. 항목 하나를 추가하면 게임에 들어간다 (시청자가 낸 문제도 그대로)
//
// 항목 필드
//   q        문제
//   choices  보기 3개
//   answer   정답 보기 번호 (0부터)
//   credit   시청자 아이디어면 { nickname, comment }, 아니면 null

export const QUIZZES = [
  { q: "'ASAP'의 회사 속 뜻은?", choices: ['가능할 때 천천히', '어제까지', '다음 주쯤'], answer: 1, credit: null },
  { q: "17:58에 온 '검토 부탁드립니다' 메일, 마감은?", choices: ['내일 아침', '다음 주', '오늘'], answer: 2, credit: null },
  { q: "'잠깐 얘기 좀 할까?'의 실제 길이는?", choices: ['잠깐', '30분 이상', '1분'], answer: 1, credit: null },
  { q: '파일 이름으로 가장 위험한 것은?', choices: ['보고서_v2', '보고서_최종', '보고서_진짜최종_수정'], answer: 2, credit: null },
  { q: "'편하게 의견 주세요' 회의에서 정답은?", choices: ['솔직한 의견', '좋은 것 같습니다', '반대합니다'], answer: 1, credit: null },
  { q: "'다음에 밥 한번 먹자'가 지켜질 확률은?", choices: ['아주 낮음', '100%', '이번 주 안에'], answer: 0, credit: null },
  { q: '전체 회신을 누르기 전에 꼭 할 일은?', choices: ['받는 사람 확인', '바로 전송', '이모지 넣기'], answer: 0, credit: null },
  { q: "'간단한 건데요'로 시작한 일의 크기는?", choices: ['간단함', '5분 컷', '간단하지 않음'], answer: 2, credit: null },
  { q: '회의실 예약이 겹쳤다. 가장 먼저 할 일은?', choices: ['그냥 들어간다', '예약 내역 확인', '복도에서 회의'], answer: 1, credit: null },
  { q: "금요일 17:50 '월요일에 봐도 돼요'의 진짜 뜻은?", choices: ['월요일에 보면 됨', '지금 봐 주면 좋겠음', '안 봐도 됨'], answer: 1, credit: null },
  { q: '엑셀에 #REF! 가 떴다. 원인은?', choices: ['참조한 셀이 사라짐', '컴퓨터 고장', '엑셀이 화남'], answer: 0, credit: null },
  { q: '퇴근 직전 가장 피해야 할 말은?', choices: ['수고하셨습니다', '혹시 시간 되세요?', '내일 뵙겠습니다'], answer: 1, credit: null },
];
