// 게임의 모든 수치는 이 파일 한 곳에 모은다 (GAME_SPEC.md 4장)

export const CONFIG = {
  screen: {
    width: 480,
    height: 270,
    backgroundColor: '#1a1420',
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
