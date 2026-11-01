import { CONFIG } from '../config.js';

// 개발용 조절 패널 (GAME_SPEC.md 7장)
// ` 키로 열고 닫는다. 휴대폰처럼 키보드가 없을 때는 오른쪽 위 ⚙ 버튼으로 연다
// 슬라이더는 CONFIG 값을 바로 바꾼다. "현재 값 복사"는 바뀐 값만 config.js 형식으로 복사한다
// GameScene 이 import.meta.env.DEV 일 때만 만들므로 배포 빌드에는 나오지 않는다

const getPath = (obj, path) => path.split('.').reduce((o, k) => o[k], obj);
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

// 처음 값 (장면을 다시 시작해도 바뀐 값을 알 수 있게 모듈이 읽힐 때 한 번만 기록)
const DEFAULTS = Object.fromEntries(CONFIG.debugPanel.sliders.map((s) => [s.path, getPath(CONFIG, s.path)]));

let open = false;

const STYLE = `
#debug-panel { position: fixed; top: 8px; left: 8px; z-index: 20; width: 240px; padding: 10px 12px;
  background: rgba(26, 20, 32, 0.92); color: #fff; border: 2px solid #ffd23f; border-radius: 6px;
  font: 12px 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; touch-action: auto; user-select: none; }
#debug-panel[hidden] { display: none; }
#debug-panel h3 { margin: 0 0 8px; font-size: 13px; color: #ffd23f; }
#debug-panel label { display: block; margin: 6px 0 2px; }
#debug-panel .row { display: flex; gap: 6px; align-items: center; }
#debug-panel input[type=range] { flex: 1; }
#debug-panel .val { width: 44px; text-align: right; font-variant-numeric: tabular-nums; }
#debug-panel .changed { color: #ffd23f; }
#debug-panel button { margin-top: 10px; width: 100%; padding: 6px; font: inherit; cursor: pointer;
  background: #ffd23f; color: #1a1420; border: 0; border-radius: 4px; }
#debug-toggle { position: fixed; top: 8px; right: 8px; z-index: 20; width: 32px; height: 32px; border: 0; border-radius: 6px;
  background: rgba(26, 20, 32, 0.6); color: #ffd23f; font-size: 18px; touch-action: auto; }
`;

export default class DebugPanel {
  constructor(scene) {
    this.style = document.createElement('style');
    this.style.textContent = STYLE;
    document.head.appendChild(this.style);

    this.panel = document.createElement('div');
    this.panel.id = 'debug-panel';
    this.panel.hidden = !open;
    this.panel.innerHTML = '<h3>조절 패널 ( ` 키로 닫기)</h3>';
    // 패널을 만지는 동안 게임 조작(조이스틱·키보드)이 같이 움직이지 않게 막는다
    // (` 키는 패널 안에서 눌러도 닫히도록 통과시킨다)
    for (const type of ['pointerdown', 'keydown', 'keyup']) {
      this.panel.addEventListener(type, (e) => {
        if (e.code !== 'Backquote') e.stopPropagation();
      });
    }

    this.rows = CONFIG.debugPanel.sliders.map((s) => this.addSlider(s));

    this.copyButton = document.createElement('button');
    this.copyButton.textContent = '현재 값 복사';
    this.copyButton.addEventListener('click', () => this.copy());
    this.panel.appendChild(this.copyButton);
    document.body.appendChild(this.panel);

    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'debug-toggle';
    this.toggleButton.textContent = '⚙';
    this.toggleButton.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.toggleButton.addEventListener('click', () => this.toggle());
    document.body.appendChild(this.toggleButton);

    this.onKey = (e) => {
      if (e.code === 'Backquote') this.toggle();
    };
    window.addEventListener('keydown', this.onKey);
    scene.events.once('shutdown', () => this.destroy());
  }

  addSlider({ label, path, min, max, step }) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<label>${label}</label><div class="row"><input type="range"><span class="val"></span></div>`;
    const input = wrap.querySelector('input');
    const val = wrap.querySelector('.val');
    Object.assign(input, { min, max, step, value: getPath(CONFIG, path) });

    const refresh = () => {
      const v = getPath(CONFIG, path);
      val.textContent = String(v);
      wrap.querySelector('label').classList.toggle('changed', v !== DEFAULTS[path]);
    };
    input.addEventListener('input', () => {
      setPath(CONFIG, path, Number(input.value));
      refresh();
    });
    refresh();
    this.panel.appendChild(wrap);
    return { path };
  }

  toggle() {
    open = !open;
    this.panel.hidden = !open;
  }

  // 바뀐 값만 config.js 와 같은 중첩 모양으로 만든다
  changedText() {
    const tree = {};
    for (const { path } of this.rows) {
      const v = getPath(CONFIG, path);
      if (v === DEFAULTS[path]) continue;
      const keys = path.split('.');
      const last = keys.pop();
      keys.reduce((o, k) => (o[k] ??= {}), tree)[last] = v;
    }
    const lines = [];
    const write = (obj, depth) => {
      const pad = '  '.repeat(depth);
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'object') {
          lines.push(`${pad}${k}: {`);
          write(v, depth + 1);
          lines.push(`${pad}},`);
        } else {
          lines.push(`${pad}${k}: ${v},`);
        }
      }
    };
    write(tree, 1);
    return lines.join('\n');
  }

  async copy() {
    const text = this.changedText();
    if (!text) {
      this.flashButton('바뀐 값이 없어요');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // http 주소(휴대폰에서 PC 접속 등)에서는 clipboard API가 막혀 있어 옛 방식으로 복사한다
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    this.flashButton('복사했어요!');
  }

  flashButton(message) {
    this.copyButton.textContent = message;
    clearTimeout(this.buttonTimer);
    this.buttonTimer = setTimeout(() => (this.copyButton.textContent = '현재 값 복사'), 1200);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKey);
    clearTimeout(this.buttonTimer);
    this.panel.remove();
    this.toggleButton.remove();
    this.style.remove();
  }
}
