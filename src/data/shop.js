// 엘리베이터 화면 두 가게 (5화, docs/5화_기획.md 2장). 항목 하나를 추가하면 가게에 들어간다
//
// 가게
//   wallet  쓰는 지갑 (data/benefits.js WALLETS 키)
//
// 항목 필드
//   shop        어느 가게 (SHOPS 키)
//   name, desc  가게에 보이는 이름과 한 줄 설명
//   prices      단계별 값. 다 사면 "최대" (영구 항목은 한 번 살 때마다 한 단계)
//   consumable  true 면 다음 한 판만 (판을 시작하면 쓰여서 없어진다). 한 판에 하나씩
//   effect      판을 시작할 때 쓰는 효과 (산 단계 수만큼 쌓인다)
//     starterDamage  시작 무기 데미지 +비율
//     maxMental      최대 멘탈 +칸
//     startMental    이번 판만 최대 멘탈 +칸 (가득 찬 채로 시작)
//     leave          멘탈이 바닥나기 직전 한 번 무적 (config shop.leaveInvulnerable ms)
//     bomb           전체 회신 폭탄을 들고 시작 (B 키 또는 오른쪽 아래 버튼)
//   unlockWeapon  사면 이 무기(data/weapons.js id)를 시작 무기로 고를 수 있다
export const SHOPS = {
  salary: { name: '💼 연봉 협상', wallet: 'salary', note: '연봉으로 사면 계속 남는다' },
  welfare: { name: '🏪 사내 편의점', wallet: 'welfare', note: '복지포인트로 사면 다음 한 판만' },
};

export const SHOP_ITEMS = [
  {
    id: 'power',
    shop: 'salary',
    name: '시작 무기 공격력',
    desc: '한 단계마다 데미지 +20%',
    prices: [1500, 2000, 2700, 3600, 4800, 6400, 8500, 11000, 14500],
    effect: { starterDamage: 0.2 },
  },
  {
    id: 'mental',
    shop: 'salary',
    name: '최대 멘탈 +1',
    desc: '멘탈 칸이 하나 늘어난다 (3번까지)',
    prices: [4000, 8000, 12000],
    effect: { maxMental: 1 },
  },
  {
    id: 'resignation',
    shop: 'salary',
    name: '📄 사직서 던지기',
    desc: '크게 관통하는 한 방. 시작 무기로 고를 수 있다',
    prices: [15000],
    unlockWeapon: 'resignation',
  },
  {
    id: 'coffeeMix',
    shop: 'welfare',
    name: '☕ 커피믹스',
    desc: '다음 판 멘탈 +2로 시작',
    prices: [150],
    consumable: true,
    effect: { startMental: 2 },
  },
  {
    id: 'leave',
    shop: 'welfare',
    name: '🎫 연차 쿠폰',
    desc: '멘탈이 바닥나기 직전 한 번 3초 무적',
    prices: [200],
    consumable: true,
    effect: { leave: 1 },
  },
  {
    id: 'bomb',
    shop: 'welfare',
    name: '💣 전체 회신 폭탄',
    desc: '하나 들고 시작 (B 키 또는 오른쪽 아래 버튼)',
    prices: [250],
    consumable: true,
    effect: { bomb: 1 },
  },
];
