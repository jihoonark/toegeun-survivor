// 게임의 모든 수치는 이 파일 한 곳에 모은다 (GAME_SPEC.md 4장)

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
    // 시작할 때 가진 무기 (src/data/weapons.js 의 id)
    startWeapons: ['americano'],
  },

  // 무기별 수치는 src/data/weapons.js, 여기는 전체 배율
  combat: {
    attackSpeedMultiplier: 1,
    damageMultiplier: 1,
    // 동시에 화면에 있을 수 있는 투사체 수
    projectilePoolSize: 60,
  },

  // 그리기 순서. 바닥 위 물건은 발밑 y를 깊이로 쓰고, 날아다니는 것은 그 위에 그린다
  depth: {
    flying: 100000,
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
  },

  camera: {
    // 1이면 딱 붙어 따라가고, 작을수록 부드럽게 늦게 따라간다
    followLerp: 0.15,
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
