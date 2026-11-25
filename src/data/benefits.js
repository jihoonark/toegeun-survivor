// 회사 혜택 (5화, docs/5화_기획.md 1장): 몬스터를 잡거나 상사를 퇴근시키면 떨어지고, 판이 끝나도 남는다
// 항목 하나를 추가하면 게임에 들어간다
//   wallet  모이는 지갑 (WALLETS 의 키). 줍는 그림·이름은 여러 가지여도 지갑은 둘뿐
//   amount  한 번 주울 때 쌓이는 값 (config benefits.amountScale 로 전체 배율)
//   art     그림 (src/art/effects.js BENEFIT_ART 의 키)
//   drops   떨어지는 때
//     { on: 'kill', chance }   일반 몬스터를 잡을 때 chance 확률
//     { on: 'boss' }           보스·엘리트가 퇴근할 때 반드시
//     { on: 'desk' }           내 자리 퀴즈를 맞혔을 때 반드시
export const WALLETS = {
  salary: { name: '연봉', unit: '원', icon: '💵' },
  welfare: { name: '복지포인트', unit: 'P', icon: '💳' },
};

export const BENEFITS = [
  { id: 'envelope', name: '월급봉투', wallet: 'salary', amount: 300, art: 'envelope', drops: [{ on: 'kill', chance: 0.05 }] },
  { id: 'bonus', name: '성과급', wallet: 'salary', amount: 3000, art: 'bonus', drops: [{ on: 'boss' }] },
  { id: 'holiday', name: '명절 상여', wallet: 'salary', amount: 2000, art: 'holiday', drops: [{ on: 'kill', chance: 0.004 }] },
  { id: 'welfare', name: '복지포인트', wallet: 'welfare', amount: 100, art: 'welfareCard', drops: [{ on: 'desk' }, { on: 'kill', chance: 0.01 }] },
  { id: 'meal', name: '식대 쿠폰', wallet: 'welfare', amount: 50, art: 'mealTicket', drops: [{ on: 'kill', chance: 0.015 }] },
];

// 금액 표시 ("12,400원", "350P")
export function formatAmount(wallet, value) {
  return `${Math.round(value).toLocaleString('ko-KR')}${WALLETS[wallet].unit}`;
}
