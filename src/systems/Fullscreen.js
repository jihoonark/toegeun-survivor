import { CONFIG } from '../config.js';

// 전체화면: 브라우저 주소창·탭을 숨겨 게임 화면을 크게 쓴다
// - 왼쪽 아래 버튼으로 켠다 (전체화면이 되면 버튼은 숨는다)
// - 휴대폰은 타이틀에서 화면을 눌러 시작할 때 자동으로 켠다 (config fullscreen.autoOnTouchStart)
// - 세로로 들고 있으면 회전 안내에 "전체화면 가로로 시작" 버튼을 띄운다 (전체화면이면 가로로 고정할 수 있다)
// - 아이폰 사파리는 전체화면 기능이 없어서, 홈 화면에 추가해 실행하는 방법을 안내한다
// 전체화면은 사람이 누른 그 순간(입력 이벤트 안)에만 켤 수 있다

const root = document.documentElement;

export const fullscreenSupported = () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fullscreenActive = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
// 홈 화면에 추가한 아이콘으로 실행했으면 이미 주소창이 없다
const standalone = () =>
  window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;

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
#fullscreen-toggle[hidden], #fullscreen-hint[hidden], #rotate-fullscreen[hidden] { display: none; }
#fullscreen-toggle svg { display: block; width: 100%; height: 100%; }
#fullscreen-hint { position: fixed; left: 50%; bottom: 48px; transform: translateX(-50%); z-index: 15; max-width: 80vw;
  padding: 8px 12px; border: 2px solid #ffd23f; border-radius: 6px; background: rgba(26, 20, 32, 0.92); color: #fff;
  font: 13px 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; text-align: center; line-height: 1.5; }
#rotate-fullscreen { padding: 10px 16px; border: 0; border-radius: 6px; background: #ffd23f; color: #1a1420;
  font: inherit; font-size: 16px; touch-action: manipulation; }
`;

// 네 귀퉁이 꺾쇠 모양 전체화면 아이콘
const ICON = `<svg viewBox="0 0 20 20" fill="none" stroke="#ffd23f" stroke-width="2.5" stroke-linecap="square">
  <path d="M2 7V2h5M13 2h5v5M18 13v5h-5M7 18H2v-5"/></svg>`;

const IOS_HINT = '아이폰은 사파리 아래쪽 공유 버튼 → "홈 화면에 추가" 후,<br>홈 화면의 아이콘으로 실행하면 전체화면으로 할 수 있어요';

export default class Fullscreen {
  // onChange: 전체화면이 켜지고 꺼질 때 (화면 배치를 다시 계산한다)
  constructor(onChange) {
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    this.button = document.createElement('button');
    this.button.id = 'fullscreen-toggle';
    this.button.setAttribute('aria-label', '전체화면');
    this.button.innerHTML = ICON;
    this.button.addEventListener('click', () => {
      if (fullscreenSupported()) requestFullscreen();
      else this.showHint(IOS_HINT);
    });
    document.body.appendChild(this.button);

    this.hint = document.createElement('div');
    this.hint.id = 'fullscreen-hint';
    this.hint.hidden = true;
    document.body.appendChild(this.hint);

    // 회전 안내 안의 버튼: 누르면 전체화면이 되면서 가로로 고정된다
    this.rotateButton = document.createElement('button');
    this.rotateButton.id = 'rotate-fullscreen';
    this.rotateButton.textContent = '전체화면 가로로 시작';
    this.rotateButton.hidden = true;
    this.rotateButton.addEventListener('click', requestFullscreen);
    document.getElementById('rotate-hint')?.appendChild(this.rotateButton);

    const changed = () => {
      this.update();
      onChange?.();
    };
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('webkitfullscreenchange', changed);
    this.update();
  }

  update() {
    // 세로 안내 중에는 안내 화면 가운데 버튼을 쓰므로 귀퉁이 버튼은 숨긴다
    this.button.hidden = fullscreenActive() || standalone() || this.rotateMode;
    if (this.button.hidden) this.hint.hidden = true;
  }

  // 세로 휴대폰 안내 중일 때. 전체화면이 되는 기기에서만 가운데 버튼을 보여 준다
  setRotateMode(on) {
    this.rotateMode = on;
    this.rotateButton.hidden = !(on && fullscreenSupported() && !fullscreenActive());
    this.update();
  }

  showHint(html) {
    this.hint.innerHTML = html;
    this.hint.hidden = false;
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => (this.hint.hidden = true), CONFIG.fullscreen.hintDuration);
  }
}
