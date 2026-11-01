// 게임의 모든 수치는 이 파일 한 곳에 모은다 (GAME_SPEC.md 4장)
// 예외: 몬스터·무기·능력의 항목별 기본 수치는 src/data 의 각 항목 안에 둔다. 여기는 공통 수치와 전체 배율

export const CONFIG = {
  screen: {
    width: 480,
    height: 270,
    backgroundColor: '#1a1420',
  },

  // 사무실 맵. 가구 좌표는 발밑(아래쪽 가운데) 기준 픽셀
  // 새 가구는 src/art/office.js 에 그림을 추가하고 여기에 { type, positions } 한 줄을 넣으면 된다
  office: {
    worldWidth: 960,
    worldHeight: 540,
    furniture: [
      {
        type: 'desk',
        positions: [
          // 시작 화면 네 귀퉁이 책상 묶음 (가운데는 비워 둔다)
          [300, 200], [356, 200], [604, 200], [660, 200],
          [300, 380], [356, 380], [604, 380], [660, 380],
          // 바깥쪽 책상 줄
          [100, 110], [156, 110], [804, 110], [860, 110],
          [100, 480], [156, 480], [804, 480], [860, 480],
        ],
      },
      {
        type: 'plant',
        positions: [
          [24, 40], [936, 40], [24, 520], [936, 520],
          [480, 170], [480, 430], [250, 300], [710, 300],
        ],
      },
    ],
  },

  player: {
    speed: 90,
    walkFrameRate: 8,
    idleFrameRate: 2,
    // 충돌 판정은 발 부분만 (탑다운 3/4)
    bodyWidth: 12,
    bodyHeight: 8,
    // 투사체가 나가는 높이 (발바닥에서 위로 px)
    handHeight: 12,
    // 멘탈(체력). 0이 되면 야근 확정
    maxMental: 10,
    // 한 번 맞은 뒤 다시 맞지 않는 시간(ms)과 그동안 깜빡이는 간격(ms), 흐려질 때 투명도
    hurtCooldown: 900,
    hurtBlinkInterval: 80,
    hurtBlinkAlpha: 0.3,
  },

  // 무기별 수치는 src/data/weapons.js, 여기는 전체 배율
  combat: {
    attackSpeedMultiplier: 1,
    damageMultiplier: 1,
    // 동시에 화면에 있을 수 있는 투사체 수
    projectilePoolSize: 60,
  },

  // 그리기 순서. 바닥 위 물건은 발밑 y를 깊이로 쓰고, 날아다니는 것은 그 위, 화면 정보는 맨 위
  // (Infinity 는 쓰지 않는다: 같은 Infinity 끼리 빼면 NaN 이 되어 정렬이 깨진다)
  depth: {
    floor: -100000,
    flying: 100000,
    hud: 200000,
  },

  // 화면 시계: 17:00 에서 18:00 까지. 1화는 실제 1분 = 게임 1시간
  clock: {
    startHour: 17,
    endHour: 18,
    realDuration: 60000,
    // 이 분(分)부터 시계가 강조색으로 바뀐다
    warnMinute: 50,
  },

  // 화면 위쪽 정보 (멘탈 바, 시계, 처리한 업무 수)
  hud: {
    margin: 8,
    mentalBar: { width: 80, height: 8, labelGap: 4 },
    mentalColors: { high: 0x5bd16a, mid: 0xffd23f, low: 0xe03a3a, back: 0x3a3048, outline: 0x1a1420 },
    // 멘탈 비율이 이 아래로 내려가면 중간·낮음 색
    mentalMid: 0.6,
    mentalLow: 0.3,
    // 시청자 무기를 얻었을 때 시계 아래에 뜨는 "○○님의 [무기]" 알림
    creditToast: { offsetY: 22, gap: 14, duration: 2500, fade: 600 },
  },

  // 결과 화면
  result: {
    // 게임이 끝나고 결과 화면으로 넘어가기까지(ms)
    delay: 1400,
    // 결과 화면에서 입력을 받기 시작하기까지(ms). 마구 누르다 바로 다시 시작되지 않게
    inputDelay: 700,
    // 화면 높이에 대한 비율
    titleY: 0.2,
    subtitleY: 0.33,
    statsY: 0.46,
    statsGap: 16,
    heroY: 0.7,
    buttonsY: 0.86,
    button: { width: 110, height: 26, gap: 16 },
  },

  // 적 등장. 몬스터별 수치는 src/data/enemies.js
  spawn: {
    // 다음 적이 나오기까지 간격(ms)
    interval: 1200,
    // 화면 밖 얼마나 떨어진 곳에서 나오는지(px)
    offscreenMargin: 24,
    // 동시에 살아 있을 수 있는 최대 수
    maxAlive: 60,
    // 첫 적이 나오기까지 기다리는 시간(ms)
    firstDelay: 800,
  },

  enemy: {
    // 몬스터끼리 서로 밀어내 한 점에 겹치지 않게 한다
    separate: true,
    // credit 이름표가 머리 위로 떠 있는 높이(px)
    nameplateOffsetY: 38,
    // 한 번 뛰는 시간 중 공중에 떠 있는 비율. 나머지는 착지하며 찌그러진다
    hopAirRatio: 0.75,
  },

  camera: {
    // 1이면 딱 붙어 따라가고, 작을수록 부드럽게 늦게 따라간다
    followLerp: 0.15,
  },

  // 타격감 (GAME_SPEC.md 6장)
  juice: {
    // 히트스톱: 맞는 순간 게임이 잠깐 멈춤(ms). 처치할 때는 배율만큼 더 길게
    hitStop: { duration: 35, killMultiplier: 1.6 },
    // 화면 흔들림: strength 는 전체 배율, intensity 는 화면 크기 대비 비율
    shake: {
      strength: 1,
      kill: { duration: 90, intensity: 0.004 },
      playerHit: { duration: 160, intensity: 0.012 },
    },
    // 맞은 대상이 하얗게 번쩍이는 시간(ms)
    flash: { duration: 70 },
    // 넉백: 맞은 적이 밀려나는 속도(px/초)와 시간(ms)
    knockback: { strength: 180, duration: 110 },
    // 데미지 숫자: 튀어오르는 높이(px)와 사라지는 시간(ms)
    damageNumber: { color: '#ffd23f', size: 12, stroke: 2, rise: 14, duration: 550 },
    // 처치 시 종이 조각
    particles: { count: 9, speedMin: 40, speedMax: 120, lifespan: 500, gravity: 220 },
  },

  sound: {
    volume: 0.25,
    // 같은 소리가 너무 촘촘히 겹치지 않게 하는 최소 간격(ms)
    minInterval: 40,
  },

  // 개발용 조절 패널 (GAME_SPEC.md 7장). 배포 빌드에서는 나오지 않는다
  debugPanel: {
    sliders: [
      { label: '이동 속도', path: 'player.speed', min: 30, max: 200, step: 5 },
      { label: '공격 속도 배율', path: 'combat.attackSpeedMultiplier', min: 0.25, max: 4, step: 0.05 },
      { label: '적 스폰 간격(ms)', path: 'spawn.interval', min: 100, max: 3000, step: 50 },
      { label: '히트스톱(ms)', path: 'juice.hitStop.duration', min: 0, max: 200, step: 5 },
      { label: '흔들림 세기', path: 'juice.shake.strength', min: 0, max: 3, step: 0.1 },
      { label: '넉백 세기', path: 'juice.knockback.strength', min: 0, max: 600, step: 10 },
    ],
  },

  input: {
    // 동시에 인식할 터치 수 (조이스틱 + 여유 1)
    activePointers: 2,
  },

  // 휴대폰: 화면 아무 곳이나 누르면 그 자리에 생기는 가상 조이스틱
  joystick: {
    radius: 28,
    knobRadius: 10,
    // 이 비율보다 덜 밀면 멈춘 것으로 본다
    deadZone: 0.15,
    color: 0xffffff,
    baseAlpha: 0.25,
    knobAlpha: 0.6,
  },

  colors: {
    outline: '#1a1420',
    text: '#ffffff',
    textDim: '#b8b0c8',
    accent: '#ffd23f',
    danger: '#e03a3a',
    buttonHover: '#fff0a8',
  },

  ui: {
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
    // 480x270에서 한글 획이 읽히려면 본문 16px 안팎이 필요하다
    titleFontSize: 32,
    bodyFontSize: 16,
    smallFontSize: 12,
    titleStroke: 4,
    bodyStroke: 2,
    // 작은 글자는 외곽선이 획을 덮어 오히려 읽기 어렵다
    smallStroke: 0,
    blinkDuration: 600,
    // 게임 시작 시 조작 안내가 떠 있는 시간과 사라지는 시간(ms)
    hintDuration: 3000,
    hintFade: 800,
    blinkMinAlpha: 0.2,

    // 화면 높이에 대한 비율로 배치
    title: {
      nameY: 0.35,
      subtitleY: 0.5,
      promptY: 0.72,
      // 화면 아래에서 떨어뜨리는 거리(px)
      creditBottom: 12,
    },
    gameInfo: {
      labelOffsetY: -12,
      infoOffsetY: 12,
    },
  },
};
