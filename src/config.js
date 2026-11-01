// 게임의 모든 수치는 이 파일 한 곳에 모은다 (GAME_SPEC.md 4장)

export const CONFIG = {
  screen: {
    width: 480,
    height: 270,
    backgroundColor: '#1a1420',
  },

  // 사무실 맵. 가구 좌표는 발밑(아래쪽 가운데) 기준 픽셀
  office: {
    worldWidth: 960,
    worldHeight: 540,
    desks: [
      // 시작 화면 네 귀퉁이 책상 묶음 (가운데는 비워 둔다)
      [300, 200], [356, 200], [604, 200], [660, 200],
      [300, 380], [356, 380], [604, 380], [660, 380],
      // 바깥쪽 책상 줄
      [100, 110], [156, 110], [804, 110], [860, 110],
      [100, 480], [156, 480], [804, 480], [860, 480],
    ],
    plants: [
      [24, 40], [936, 40], [24, 520], [936, 520],
      [480, 170], [480, 430], [250, 300], [710, 300],
    ],
  },

  // 개발용 임시 기능 (주인공이 들어오면 지운다)
  dev: {
    cameraPanSpeed: 240,
  },

  input: {
    // 동시에 인식할 터치 수 (조이스틱 + 여유 1)
    activePointers: 2,
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
