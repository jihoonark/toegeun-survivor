import { isMuted, setMuted } from './SoundOut.js';

// 오른쪽 아래 소리 켜기/끄기 버튼 (효과음과 배경음악을 함께 끈다)
// 출퇴근길처럼 소리 없이 하는 사람이 많아서, 어느 화면에서든 바로 누를 수 있게 페이지 위에 둔다

const STYLE = `
#sound-toggle { position: fixed; bottom: 8px; right: 8px; z-index: 15; width: 32px; height: 32px; padding: 6px;
  border: 0; border-radius: 6px; background: rgba(26, 20, 32, 0.6); touch-action: manipulation; cursor: pointer; }
#sound-toggle svg { display: block; width: 100%; height: 100%; }
`;

// 스피커 + 소리 물결 / 스피커 + X
const SPEAKER = '<path d="M3 7h3l5-4v14l-5-4H3z" fill="#ffd23f" stroke="none"/>';
const ON = `<svg viewBox="0 0 20 20" fill="none" stroke="#ffd23f" stroke-width="2" stroke-linecap="round">${SPEAKER}
  <path d="M14 7a4 4 0 0 1 0 6M16.5 4.5a7.5 7.5 0 0 1 0 11"/></svg>`;
const OFF = `<svg viewBox="0 0 20 20" fill="none" stroke="#ffd23f" stroke-width="2" stroke-linecap="round">${SPEAKER}
  <path d="M14 7l5 6M19 7l-5 6"/></svg>`;

export default class SoundToggle {
  constructor() {
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    this.button = document.createElement('button');
    this.button.id = 'sound-toggle';
    // 버튼을 누른 입력이 게임(조이스틱·타이틀 시작)으로 넘어가지 않게 한다
    for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup']) {
      this.button.addEventListener(type, (e) => e.stopPropagation());
    }
    this.button.addEventListener('click', () => {
      setMuted(!isMuted());
      this.render();
    });
    document.body.appendChild(this.button);
    this.render();
  }

  render() {
    const muted = isMuted();
    this.button.innerHTML = muted ? OFF : ON;
    this.button.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
  }
}
