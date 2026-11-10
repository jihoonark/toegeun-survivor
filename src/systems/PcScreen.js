// 회사 PC 화면 (GAME_SPEC.md 12장 "내 자리"). 도트 게임 화면과 다르게 깔끔하고 평평한 사무용 화면이라
// 캔버스가 아니라 페이지 위에 HTML 로 그린다. 게임 화면(캔버스) 크기에 맞춰 덮는다
// 지금은 메신저 하나. 자리 이벤트 데이터(src/data/deskEvents.js)대로 말이 오가고, 답을 고르면 닫힌다

const STYLE = `
#pc-screen { position: fixed; z-index: 20; display: flex; align-items: center; justify-content: center;
  background: #1a1420; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  opacity: 0; transform: scale(0.55); transition: opacity 0.18s ease-out, transform 0.22s ease-out; }
#pc-screen.show { opacity: 1; transform: scale(1); }
#pc-screen[hidden] { display: none; }
#pc-screen .bezel { width: 94%; height: 92%; background: #2e3240; border-radius: 1.2em; padding: 1.1em; box-sizing: border-box;
  display: flex; }
#pc-screen .desktop { flex: 1; background: linear-gradient(160deg, #cfe6f3, #9ecbe0); border-radius: 0.4em; position: relative;
  display: flex; align-items: center; justify-content: center; overflow: hidden; }
#pc-screen .window { width: 78%; height: 86%; background: #fff; border-radius: 0.5em; box-shadow: 0 0.4em 1.4em rgba(0,0,0,0.25);
  display: flex; flex-direction: column; overflow: hidden; }
#pc-screen .titlebar { background: #f3f4f7; border-bottom: 1px solid #e2e4ea; padding: 0.45em 0.8em; font-size: 0.85em;
  color: #555b6a; display: flex; justify-content: space-between; }
#pc-screen .titlebar .dots span { display: inline-block; width: 0.6em; height: 0.6em; border-radius: 50%; margin-left: 0.3em; background: #d6d9e0; }
#pc-screen .room { padding: 0.5em 0.9em; border-bottom: 1px solid #eef0f4; display: flex; align-items: center; gap: 0.6em; font-weight: 700; color: #2b2f3a; }
#pc-screen .avatar { width: 1.8em; height: 1.8em; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.85em; }
#pc-screen .chat { flex: 1; padding: 0.7em 0.9em; display: flex; flex-direction: column; justify-content: flex-end; gap: 0.45em; overflow: hidden; background: #f7f8fb; }
#pc-screen .msg { max-width: 70%; padding: 0.45em 0.75em; border-radius: 0.9em; font-size: 0.95em; line-height: 1.35;
  animation: pc-pop 0.16s ease-out; }
#pc-screen .msg.them { align-self: flex-start; background: #fff; border: 1px solid #e3e6ec; color: #2b2f3a; border-bottom-left-radius: 0.2em; }
#pc-screen .msg.me { align-self: flex-end; background: #ffd23f; color: #2b2f3a; border-bottom-right-radius: 0.2em; }
#pc-screen .seen { align-self: flex-start; font-size: 0.75em; color: #e03a3a; margin-left: 0.3em; }
#pc-screen .typing { align-self: flex-start; color: #9aa0ad; font-size: 0.9em; letter-spacing: 0.15em; }
#pc-screen .choices { display: flex; gap: 0.6em; padding: 0.6em 0.9em 0.8em; background: #fff; border-top: 1px solid #eef0f4; min-height: 2.4em; }
#pc-screen .choices button { flex: 1; padding: 0.55em 0; border-radius: 0.5em; border: 1px solid #d6d9e0; background: #fff;
  font: inherit; font-size: 0.95em; color: #2b2f3a; cursor: pointer; touch-action: manipulation; animation: pc-pop 0.16s ease-out; }
#pc-screen .choices button.primary { background: #3f8fe0; border-color: #3f8fe0; color: #fff; }
#pc-screen .choices button .key { opacity: 0.55; margin-right: 0.35em; font-size: 0.85em; }
@keyframes pc-pop { from { transform: translateY(0.3em); opacity: 0; } to { transform: none; opacity: 1; } }
`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default class PcScreen {
  constructor(canvas, timing) {
    this.canvas = canvas;
    this.timing = timing;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'pc-screen';
    this.root.hidden = true;
    // 화면을 누른 입력이 게임으로 넘어가지 않게
    for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup']) {
      this.root.addEventListener(type, (e) => e.stopPropagation());
    }
    document.body.appendChild(this.root);
    this.onKey = this.onKey.bind(this);
  }

  // 캔버스가 보이는 자리와 크기에 맞춘다. 글자 크기도 캔버스 너비를 따라간다
  fit() {
    const r = this.canvas.getBoundingClientRect();
    Object.assign(this.root.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      fontSize: `${r.width / 42}px`,
    });
  }

  // event: 자리 이벤트 데이터. 고른 choice 를 돌려준다
  async open(event, { onMessage } = {}) {
    this.fit();
    this.root.innerHTML = `
      <div class="bezel"><div class="desktop"><div class="window">
        <div class="titlebar"><span>사내 메신저</span><span class="dots"><span></span><span></span><span></span></span></div>
        <div class="room"><div class="avatar" style="background:${event.avatar}">${event.from[0]}</div>${event.from}</div>
        <div class="chat"></div>
        <div class="choices"></div>
      </div></div></div>`;
    this.chat = this.root.querySelector('.chat');
    this.choiceBox = this.root.querySelector('.choices');
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add('show'));
    await wait(this.timing.openDelay);

    for (const text of event.messages) {
      const typing = this.add('typing', '•••');
      await wait(this.timing.typing);
      typing.remove();
      this.add('msg them', text);
      onMessage?.();
      await wait(this.timing.between);
    }

    const choice = await this.ask(event.choices);
    if (choice.reply) this.add('msg me', choice.reply);
    if (choice.seen) this.add('seen', choice.seen);
    await wait(this.timing.afterChoice);
    this.close();
    return choice;
  }

  add(className, text) {
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    this.chat.appendChild(el);
    return el;
  }

  // 버튼을 누르거나 숫자 키 1·2 로 고른다
  ask(choices) {
    return new Promise((resolve) => {
      this.resolveChoice = (choice) => {
        this.resolveChoice = null;
        this.choices = null;
        window.removeEventListener('keydown', this.onKey);
        this.choiceBox.innerHTML = '';
        resolve(choice);
      };
      this.choices = choices;
      choices.forEach((choice, i) => {
        const button = document.createElement('button');
        if (i === 0) button.className = 'primary';
        button.innerHTML = `<span class="key">${i + 1}</span>`;
        button.append(choice.label);
        button.addEventListener('click', () => this.resolveChoice?.(choice));
        this.choiceBox.appendChild(button);
      });
      window.addEventListener('keydown', this.onKey);
    });
  }

  onKey(e) {
    const index = Number(e.key) - 1;
    const choice = this.choices?.[index];
    if (choice && !e.repeat) this.resolveChoice?.(choice);
  }

  close() {
    window.removeEventListener('keydown', this.onKey);
    this.root.classList.remove('show');
    this.root.hidden = true;
    this.root.innerHTML = '';
  }
}
