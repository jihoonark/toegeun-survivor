// 회사 PC 화면 (GAME_SPEC.md 12장 "내 자리"). 도트 게임 화면과 다르게 깔끔하고 평평한 사무용 화면이라
// 캔버스가 아니라 페이지 위에 HTML 로 그린다. 게임 화면(캔버스) 크기에 맞춰 덮는다
// 지금은 메신저 퀴즈: 누가 말을 걸고 → 퀴즈(제한 시간) → 맞히면 보상 카드 3장 중 하나 / 틀리면 벌칙 안내

const STYLE = `
#pc-screen { position: fixed; z-index: 20; display: flex; align-items: center; justify-content: center;
  background: #1a1420; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  opacity: 0; transform: scale(0.55); transition: opacity 0.18s ease-out, transform 0.22s ease-out; }
#pc-screen.show { opacity: 1; transform: scale(1); }
#pc-screen[hidden] { display: none; }
#pc-screen .bezel { width: 96%; height: 94%; background: #2e3240; border-radius: 1.1em; padding: 0.9em; box-sizing: border-box; display: flex; }
#pc-screen .desktop { flex: 1; background: linear-gradient(160deg, #cfe6f3, #9ecbe0); border-radius: 0.4em;
  display: flex; align-items: center; justify-content: center; overflow: hidden; }
#pc-screen .window { width: 88%; height: 92%; background: #fff; border-radius: 0.5em; box-shadow: 0 0.4em 1.4em rgba(0,0,0,0.25);
  display: flex; flex-direction: column; overflow: hidden; }
#pc-screen .titlebar { background: #f3f4f7; border-bottom: 1px solid #e2e4ea; padding: 0.35em 0.8em; font-size: 0.8em;
  color: #555b6a; display: flex; justify-content: space-between; }
#pc-screen .titlebar .dots span { display: inline-block; width: 0.6em; height: 0.6em; border-radius: 50%; margin-left: 0.3em; background: #d6d9e0; }
#pc-screen .room { padding: 0.4em 0.9em; border-bottom: 1px solid #eef0f4; display: flex; align-items: center; gap: 0.6em; font-weight: 700; color: #2b2f3a; }
#pc-screen .avatar { width: 1.7em; height: 1.7em; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.85em; }
#pc-screen .chat { flex: 1; min-height: 0; padding: 0.6em 0.9em; display: flex; flex-direction: column; justify-content: flex-end; gap: 0.4em; overflow: hidden; background: #f7f8fb; }
#pc-screen .msg { max-width: 78%; padding: 0.4em 0.75em; border-radius: 0.9em; font-size: 0.95em; line-height: 1.35; animation: pc-pop 0.16s ease-out; }
#pc-screen .msg.them { align-self: flex-start; background: #fff; border: 1px solid #e3e6ec; color: #2b2f3a; border-bottom-left-radius: 0.2em; }
#pc-screen .msg.quiz { font-weight: 700; border: 2px solid #3f8fe0; }
#pc-screen .msg.me { align-self: flex-end; background: #ffd23f; color: #2b2f3a; border-bottom-right-radius: 0.2em; }
#pc-screen .system { align-self: center; font-size: 0.85em; color: #e03a3a; font-weight: 700; animation: pc-pop 0.16s ease-out; }
#pc-screen .typing { align-self: flex-start; color: #9aa0ad; font-size: 0.9em; letter-spacing: 0.15em; }
#pc-screen .panel { background: #fff; border-top: 1px solid #eef0f4; padding: 0.5em 0.9em 0.7em; min-height: 2.6em; }
#pc-screen .timer { height: 0.3em; background: #e9ebf0; border-radius: 0.2em; overflow: hidden; margin-bottom: 0.45em; }
#pc-screen .timer div { height: 100%; background: #3f8fe0; transform-origin: left; }
#pc-screen .answers { display: flex; flex-direction: column; gap: 0.35em; }
#pc-screen .rewards { display: flex; gap: 0.5em; }
#pc-screen button { font: inherit; color: #2b2f3a; cursor: pointer; touch-action: manipulation; animation: pc-pop 0.16s ease-out;
  border-radius: 0.5em; border: 1px solid #d6d9e0; background: #fff; }
#pc-screen .answers button { text-align: left; padding: 0.4em 0.8em; font-size: 0.95em; }
#pc-screen .answers button:hover, #pc-screen .rewards button:hover { border-color: #3f8fe0; background: #f0f6fd; }
#pc-screen .rewards button { flex: 1; padding: 0.45em 0.3em; display: flex; flex-direction: column; align-items: center; gap: 0.15em; }
#pc-screen .rewards .icon { font-size: 1.5em; line-height: 1.1; }
#pc-screen .rewards .name { font-weight: 700; font-size: 0.9em; }
#pc-screen .rewards .desc { font-size: 0.75em; color: #6a7080; }
#pc-screen .key { opacity: 0.5; margin-right: 0.4em; font-size: 0.85em; }
@keyframes pc-pop { from { transform: translateY(0.3em); opacity: 0; } to { transform: none; opacity: 1; } }
`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

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
      fontSize: `${r.width / 44}px`,
    });
  }

  // 메신저 퀴즈. 돌려주는 값: { correct: true, reward } 또는 { correct: false }
  async quiz(event, question, { onMessage } = {}) {
    this.fit();
    this.root.innerHTML = `
      <div class="bezel"><div class="desktop"><div class="window">
        <div class="titlebar"><span>사내 메신저</span><span class="dots"><span></span><span></span><span></span></span></div>
        <div class="room"><div class="avatar" style="background:${event.avatar}">${event.from[0]}</div>${event.from}</div>
        <div class="chat"></div>
        <div class="panel"></div>
      </div></div></div>`;
    this.chat = this.root.querySelector('.chat');
    this.panel = this.root.querySelector('.panel');
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add('show'));
    await wait(this.timing.openDelay);

    await this.say(pick(event.intro), onMessage);
    await this.say(question.q, onMessage, 'msg them quiz');

    const answer = await this.ask(question.choices, event.timeLimit);
    this.add('msg me', answer === null ? '(시간 초과…)' : question.choices[answer]);
    await wait(this.timing.between);
    const correct = answer === question.answer;

    let result;
    if (correct) {
      await this.say(event.correct, onMessage);
      const reward = await this.chooseReward(event.rewards);
      this.add('msg me', `${reward.icon} ${reward.name}`);
      result = { correct: true, reward };
    } else {
      await this.say(event.wrong, onMessage);
      this.add('system', event.penalty.notice);
      result = { correct: false };
    }
    await wait(this.timing.afterChoice);
    this.close();
    return result;
  }

  async say(text, onMessage, className = 'msg them') {
    const typing = this.add('typing', '•••');
    await wait(this.timing.typing);
    typing.remove();
    this.add(className, text);
    onMessage?.();
    await wait(this.timing.between);
  }

  add(className, text) {
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    this.chat.appendChild(el);
    return el;
  }

  // 보기 버튼 (숫자 키로도). 시간이 다 되면 null
  ask(choices, timeLimit) {
    this.panel.innerHTML = '<div class="timer"><div></div></div><div class="answers"></div>';
    const bar = this.panel.querySelector('.timer div');
    const list = this.panel.querySelector('.answers');
    bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: timeLimit, fill: 'forwards' });
    return this.waitChoice(
      choices.map((text, i) => {
        const button = document.createElement('button');
        button.innerHTML = `<span class="key">${i + 1}</span>`;
        button.append(text);
        list.appendChild(button);
        return { button, value: i };
      }),
      timeLimit,
    );
  }

  chooseReward(rewards) {
    this.panel.innerHTML = '<div class="rewards"></div>';
    const list = this.panel.querySelector('.rewards');
    return this.waitChoice(
      rewards.map((reward, i) => {
        const button = document.createElement('button');
        button.innerHTML = `<span class="icon">${reward.icon}</span><span class="name"><span class="key">${i + 1}</span></span><span class="desc"></span>`;
        button.querySelector('.name').append(reward.name);
        button.querySelector('.desc').textContent = reward.desc;
        list.appendChild(button);
        return { button, value: reward };
      }),
    );
  }

  // 버튼 클릭이나 숫자 키 1~ 로 고른다. timeLimit 이 있으면 지나서 null
  waitChoice(options, timeLimit) {
    return new Promise((resolve) => {
      let timer = null;
      let finished = false;
      const done = (value) => {
        if (finished) return;
        finished = true;
        this.keyOptions = null;
        clearTimeout(timer);
        window.removeEventListener('keydown', this.onKey);
        this.panel.innerHTML = '';
        resolve(value);
      };
      this.keyOptions = options.map((o) => () => done(o.value));
      options.forEach((o, i) => o.button.addEventListener('click', this.keyOptions[i]));
      window.addEventListener('keydown', this.onKey);
      if (timeLimit) timer = setTimeout(() => done(null), timeLimit);
    });
  }

  onKey(e) {
    const choose = this.keyOptions?.[Number(e.key) - 1];
    if (choose && !e.repeat) choose();
  }

  close() {
    window.removeEventListener('keydown', this.onKey);
    this.root.classList.remove('show');
    this.root.hidden = true;
    this.root.innerHTML = '';
  }
}
