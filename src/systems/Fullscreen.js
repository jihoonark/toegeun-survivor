import { CONFIG } from '../config.js';

// 전체화면: 브라우저 주소창·탭을 숨겨 게임 화면을 크게 쓴다
// - 전체화면 기능이 있는 브라우저(안드로이드·PC·아이패드)
//   - 왼쪽 아래 버튼으로 켠다 (전체화면이 되면 버튼은 숨는다)
//   - 휴대폰은 타이틀에서 화면을 눌러 시작할 때 자동으로 켠다 (config fullscreen.autoOnTouchStart)
//   - 세로로 들고 있으면 회전 안내에 "전체화면 가로로 시작" 버튼을 띄운다 (전체화면이면 가로로 고정할 수 있다)
//   - 전체화면은 사람이 누른 그 순간(입력 이벤트 안)에만 켤 수 있다
// - 아이폰 사파리는 전체화면 기능이 없다. 대신 페이지를 위로 쓸어 올리면 주소창이 얇게 접히므로
//   가로 화면에서 "위로 쓸어 올리기" 안내를 띄우고, 쓸어 올릴 수 있게 페이지에 여유 높이를 준다
//   (게임 화면 위에서는 스크롤이 막혀 있어서 게임 중에 페이지가 움직이지 않는다)

const root = document.documentElement;

export const fullscreenSupported = () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fullscreenActive = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
// 홈 화면에 추가한 아이콘으로 실행했으면 이미 주소창이 없다
const standalone = () =>
  window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const touchDevice = () => navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches;
const landscape = () => window.innerWidth > window.innerHeight;

// 입력 이벤트 안에서 불러야 한다. 안 되는 환경이면 조용히 넘어간다
export function requestFullscreen() {
  if (!fullscreenSupported() || fullscreenActive()) return;
  const request = root.requestFullscreen
    ? root.requestFullscreen({ navigationUI: 'hide' })
    : root.webkitRequestFullscreen?.();
  Promise.resolve(request)
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {});
}

const STYLE = `
#fullscreen-toggle { position: fixed; bottom: 8px; left: 8px; z-index: 15; width: 32px; height: 32px; padding: 6px;
  border: 0; border-radius: 6px; background: rgba(26, 20, 32, 0.6); touch-action: manipulation; cursor: pointer; }
#fullscreen-toggle[hidden], #swipe-hint[hidden], #rotate-fullscreen[hidden] { display: none; }
#fullscreen-toggle svg { display: block; width: 100%; height: 100%; }
#rotate-fullscreen { padding: 10px 16px; border: 0; border-radius: 6px; background: #ffd23f; color: #1a1420;
  font: inherit; font-size: 16px; touch-action: manipulation; }
html.swipe-room, html.swipe-room body { height: auto; overflow: visible; touch-action: pan-y; }
html.swipe-room body { min-height: calc(100vh + 240px); }
html.swipe-room #game { touch-action: none; }
#swipe-hint { position: fixed; inset: 0; z-index: 12; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; background: rgba(26, 20, 32, 0.8); color: #fff; touch-action: pan-y;
  font: 16px 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; text-align: center; }
#swipe-hint .arrow { font-size: 36px; color: #ffd23f; animation: swipe-up 1s ease-in-out infinite; }
#swipe-hint button { margin-top: 6px; padding: 6px 14px; border: 1px solid #b8b0c8; border-radius: 6px;
  background: transparent; color: #b8b0c8; font: inherit; font-size: 13px; touch-action: manipulation; }
@keyframes swipe-up { 0%, 100% { transform: translateY(8px); opacity: 0.5; } 50% { transform: translateY(-8px); opacity: 1; } }
`;

// 네 귀퉁이 꺾쇠 모양 전체화면 아이콘
const ICON = `<svg viewBox="0 0 20 20" fill="none" stroke="#ffd23f" stroke-width="2.5" stroke-linecap="square">
  <path d="M2 7V2h5M13 2h5v5M18 13v5h-5M7 18H2v-5"/></svg>`;

export default class Fullscreen {
  // onChange: 전체화면이 켜지고 꺼질 때 (화면 배치를 다시 계산한다)
  constructor(onChange) {
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    // 전체화면 기능이 없는 터치 기기(아이폰 사파리)는 쓸어 올려 주소창을 접는 방식
    this.swipeMode = !fullscreenSupported() && touchDevice() && !standalone();
    this.rotateMode = false;
    this.swipeDismissed = false;
    this.expandedHeight = null;

    this.button = document.createElement('button');
    this.button.id = 'fullscreen-toggle';
    this.button.setAttribute('aria-label', '전체화면');
    this.button.innerHTML = ICON;
    this.button.addEventListener('click', () => {
      if (this.swipeMode) this.showSwipeHint();
      else requestFullscreen();
    });
    document.body.appendChild(this.button);

    // 회전 안내 안의 버튼: 누르면 전체화면이 되면서 가로로 고정된다
    this.rotateButton = document.createElement('button');
    this.rotateButton.id = 'rotate-fullscreen';
    this.rotateButton.textContent = '전체화면 가로로 시작';
    this.rotateButton.hidden = true;
    this.rotateButton.addEventListener('click', requestFullscreen);
    document.getElementById('rotate-hint')?.appendChild(this.rotateButton);

    if (this.swipeMode) {
      root.classList.add('swipe-room');
      this.swipeHint = document.createElement('div');
      this.swipeHint.id = 'swipe-hint';
      this.swipeHint.innerHTML = '<div class="arrow">↑</div><div>화면을 위로 쓸어 올리면<br>게임 화면이 커져요</div><button>그냥 할게요</button>';
      this.swipeHint.querySelector('button').addEventListener('click', () => {
        this.swipeDismissed = true;
        this.update();
      });
      document.body.appendChild(this.swipeHint);
    }

    const changed = () => {
      this.update();
      onChange?.();
    };
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('webkitfullscreenchange', changed);
    this.update();
  }

  // 아이폰 사파리: 가로에서 처음 잰 높이보다 커졌으면 주소창이 접힌 것
  barsCollapsed() {
    if (!landscape()) return false;
    const h = window.innerHeight;
    if (this.expandedHeight === null || h < this.expandedHeight) this.expandedHeight = h;
    return h > this.expandedHeight + CONFIG.fullscreen.swipeGrowThreshold;
  }

  update() {
    if (this.swipeMode) {
      const collapsed = this.barsCollapsed();
      // 한 번 접히면 안내는 끝. 이후에 주소창이 다시 펼쳐지면 귀퉁이 버튼으로 다시 열 수 있다
      if (collapsed) this.swipeDismissed = true;
      this.swipeHint.hidden = this.swipeDismissed || collapsed || this.rotateMode || !landscape();
      this.button.hidden = collapsed || this.rotateMode || !this.swipeHint.hidden;
      return;
    }
    // 세로 안내 중에는 안내 화면 가운데 버튼을 쓰므로 귀퉁이 버튼은 숨긴다
    this.button.hidden = fullscreenActive() || standalone() || this.rotateMode;
  }

  showSwipeHint() {
    this.swipeDismissed = false;
    this.update();
  }

  // 화면 크기가 바뀔 때마다 main.js 의 배치 계산에서 부른다
  // 세로 휴대폰 안내 중이면 전체화면이 되는 기기에서만 가운데 버튼을 보여 준다
  setRotateMode(on) {
    this.rotateMode = on;
    this.rotateButton.hidden = !(on && fullscreenSupported() && !fullscreenActive());
    this.update();
  }
}
