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

  // 가구 중 주인공이 지나갈 수 없는 발밑 부분(px). 몬스터와 투사체는 그냥 지나간다
  furnitureBlock: {
    desk: { width: 44, height: 12 },
    plant: { width: 12, height: 6 },
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

  // 승진(레벨업): 몬스터가 떨어뜨린 결재 서류(경험치)를 모으면 직급이 오른다 (GAME_SPEC.md 12장)
  progression: {
    // 멘탈이 이 비율 이하면 승진 카드에 복지 카드(멘탈 회복)도 섞여 나온다
    welfareBelow: 0.5,
    ranks: ['인턴', '사원', '주임', '대리', '과장', '차장', '부장', '이사', '상무', '전무', '부사장', '사장', '회장'],
    // 레벨업 한 번 = 호봉 하나. 이만큼 호봉이 차면 다음 직급으로 승진한다
    stepsPerRank: 4,
    // 한 판 안에서 오를 수 있는 가장 높은 직급 (그 뒤로는 호봉만 오른다). 높은 직급은 층 보스(부장 등)와 겹치지 않게 남겨 둔다
    maxRankInRun: '대리',
    // n번째 레벨업에 필요한 서류 수 = firstNeed × growth^(n-1) 반올림
    firstNeed: 4,
    growth: 1.25,
  },

  // 결재 서류 줍기
  pickup: {
    // 이 거리(px) 안에 들어오면 주인공 쪽으로 빨려 온다
    magnetRadius: 80,
    // 빨려 오는 가속도(px/초²)와 최고 속도(px/초)
    pullAccel: 900,
    pullMaxSpeed: 300,
    // 이 거리 안이면 주운 것
    collectRadius: 8,
    // 처치한 자리에서 살짝 흩어지는 거리(px)
    scatter: 6,
    // 동시에 바닥에 있을 수 있는 서류 수
    poolSize: 200,
  },

  // 무기 칸과 레벨
  weapons: {
    slots: 4,
    maxLevel: 5,
  },

  // 승진 카드 화면
  levelUp: {
    cardCount: 3,
    // 화면이 뜨고 이 시간(ms) 동안은 누르지 않는다. 이동하던 손가락에 카드가 눌리지 않게
    inputDelay: 350,
    dimAlpha: 0.7,
    titleY: 0.14,
    cardsY: 0.62,
    card: { width: 128, height: 136, gap: 14 },
    // 카드 안 줄 위치: 카드 위쪽에서 떨어진 거리(px). credit 은 카드 아래쪽에서 떨어진 거리
    cardRows: { badge: 12, icon: 38, name: 66, desc: 92, credit: 12 },
    iconScale: 3,
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
    // 멘탈 바 아래 무기 칸 (아이콘 + 레벨)
    weaponSlots: { size: 20, gap: 3, offsetY: 6, iconScale: 1.4 },
    // 화면 아래 승진 막대
    // 게임 시작 때 조작 안내가 화면 아래에서 떨어진 거리(px). 승진 막대 위에 뜨게
    controlsHintBottom: 30,
    xpBar: { width: 240, height: 5, bottom: 10, labelGap: 6, fill: 0x7ec8e3, back: 0x3a3048, outline: 0x1a1420 },
    // 시청자 무기를 얻었을 때 시계 아래에 뜨는 "○○님의 [무기]" 알림
    creditToast: { offsetY: 22, gap: 14, duration: 2500, fade: 600 },
    // "전체 회신 폭탄!" 같은 경고 글자: 화면 높이 비율 위치, 떠 있는 시간(ms), 사라지는 시간(ms)
    warning: { y: 0.3, duration: 1300, fade: 500 },
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
    // 시간대별 난이도. 17:00 부터 at 분이 지나면 그 단계 값으로 서서히 바뀐다 (단계 사이는 부드럽게 이어진다)
    //   interval: 다음 적이 나오기까지 간격(ms), batch: 한 번에 나오는 수 [최소, 최대]
    //   hp / speed: 몬스터 기본 체력·속도에 곱하는 배율
    stages: [
      { at: 0, interval: 1400, batch: [1, 1], hp: 1, speed: 1 },
      { at: 15, interval: 1000, batch: [1, 2], hp: 1.15, speed: 1 },
      { at: 30, interval: 750, batch: [1, 2], hp: 1.3, speed: 1.05 },
      { at: 45, interval: 500, batch: [2, 3], hp: 1.6, speed: 1.12 },
      { at: 52, interval: 400, batch: [2, 3], hp: 1.8, speed: 1.18 },
    ],
    // 전체 간격 배율 (조절 패널용. 작을수록 많이 나온다)
    intervalMultiplier: 1,
    // 몰려오는 패턴: 그 시각(17:00 부터 분)에 한꺼번에 나온다
    //   ring: "전체 회신 폭탄!" 주인공을 빙 둘러 사방에서 / line: 한쪽에서 줄지어 (gap: 줄 간격 px)
    //   enemy: 나올 몬스터 id (없으면 그 시각에 나올 수 있는 몬스터 중에서 고른다)
    waves: [
      { at: 12, type: 'line', count: 8, gap: 16, enemy: 'email' },
      { at: 22, type: 'line', count: 10, gap: 16, enemy: 'email' },
      { at: 30, type: 'ring', count: 8 },
      { at: 38, type: 'line', count: 12, gap: 14, enemy: 'email' },
      { at: 46, type: 'line', count: 14, gap: 14, enemy: 'email' },
      { at: 50, type: 'ring', count: 16 },
    ],
    // 쪼개져 나온 몬스터가 튕겨 나가는 세기(px/초)와 시간(ms)
    splitPop: { strength: 140, duration: 160 },
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
    // labelTime 이 지난 글자가 사라지는 시간(ms)
    labelFade: 300,
    // 한 번 뛰는 시간 중 공중에 떠 있는 비율. 나머지는 착지하며 찌그러진다
    hopAirRatio: 0.75,
    // 스테이플러에 고정된 동안 몸 색 (곱해지는 색)과 몸에 박힌 철심 위치(가운데에서 x px)·기울기(도)
    stunTint: 0x8f9ab8,
    stunMark: { offsetX: 5, angle: -25 },
  },

  camera: {
    // 1이면 딱 붙어 따라가고, 작을수록 부드럽게 늦게 따라간다
    followLerp: 0.15,
  },

  // 타격감 (GAME_SPEC.md 6장)
  juice: {
    // 히트스톱: 처치하는 순간 게임이 잠깐 멈춤(ms). 한 번 걸면 cooldown(ms) 동안은 다시 걸지 않는다
    hitStop: { duration: 45, cooldown: 350 },
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
    // poolSize: 미리 만들어 돌려 쓰는 글자 수. popColor/popOffsetY: 무기별 짧은 글자("승인" 등) 색과 높이
    damageNumber: { color: '#ffd23f', size: 12, stroke: 2, rise: 14, duration: 550, poolSize: 40, popColor: '#7ec8e3', popOffsetY: 8 },
    // 무기별 맞힐 때 파편 (무기 데이터 hitFx.particle)
    hitParticles: { count: 5, speedMin: 30, speedMax: 90, lifespan: 320, gravity: 260 },
    // 투사체 잔상 (무기 데이터 trail)
    trail: { speedMin: 0, speedMax: 0, lifespan: 220, gravity: 0, alpha: 0.45, rotate: false },
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
      { label: '적 스폰 간격 배율', path: 'spawn.intervalMultiplier', min: 0.2, max: 3, step: 0.05 },
      { label: '히트스톱(ms)', path: 'juice.hitStop.duration', min: 0, max: 200, step: 5 },
      { label: '흔들림 세기', path: 'juice.shake.strength', min: 0, max: 3, step: 0.1 },
      { label: '넉백 세기', path: 'juice.knockback.strength', min: 0, max: 600, step: 10 },
    ],
  },

  // 전체화면 (주소창·탭 숨기기)
  fullscreen: {
    // 휴대폰에서 타이틀을 눌러 시작할 때 자동으로 전체화면
    autoOnTouchStart: true,
    // 아이폰 사파리: 화면 높이가 이만큼(px) 넘게 커지면 주소창이 접힌 것으로 본다
    swipeGrowThreshold: 10,
  },

  // 퇴근봇: 유튜브 댓글 가져오기·답글 (GAME_SPEC.md 11장). scripts/ 의 Node 스크립트가 읽는다
  bot: {
    // 하루에 올릴 수 있는 최대 답글 수
    maxRepliesPerDay: 20,
    // 댓글을 확인할 영상: 최근에 올린 영상 중 제목(띄어쓰기 무시)에 이 말이 들어간 것
    videoKeyword: '퇴근서바이버',
    recentVideos: 20,
    // 한 번에 가져오는 댓글 쪽수 (한 쪽 100개)
    fetchMaxPages: 5,
    // 퇴근봇이 한 번에 초안을 쓰는 댓글 수
    maxCommentsPerRun: 50,
    // 답글 최대 글자 수
    replyMaxLength: 200,
    // Codex 초안 작성 제한 시간(ms)
    codexTimeoutMs: 600000,
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
