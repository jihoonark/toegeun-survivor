// 게임의 모든 수치는 이 파일 한 곳에 모은다 (GAME_SPEC.md 4장)

export const CONFIG = {
  screen: {
    width: 480,
    height: 270,
    // 화면이 기본 해상도보다 작을 때(세로 휴대폰 등) 허용하는 최소 확대 배율
    minZoom: 0.5,
    backgroundColor: '#1a1420',
  },

  colors: {
    outline: '#1a1420',
    text: '#ffffff',
    textDim: '#b8b0c8',
    accent: '#ffd23f',
  },

  ui: {
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
    titleFontSize: 32,
    bodyFontSize: 12,
    smallFontSize: 10,
    // 픽셀 해상도에서 한글이 뭉개지지 않도록 글자를 더 촘촘히 그리는 배율
    textResolution: 4,
    blinkDuration: 600,
  },
};
