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
