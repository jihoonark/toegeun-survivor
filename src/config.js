// 게임의 모든 수치는 이 파일 한 곳에 모은다 (GAME_SPEC.md 4장)
// 예외: 몬스터·무기·능력의 항목별 기본 수치는 src/data 의 각 항목 안에 둔다. 여기는 공통 수치와 전체 배율

export const CONFIG = {
  screen: {
    width: 480,
    height: 270,
    backgroundColor: '#1a1420',
  },

  // 층마다 다른 맵·몬스터 구성·특별 규칙·엘리트는 src/data/floors.js. 여기는 모든 층에 공통인 값

  // 내 자리 (GAME_SPEC.md 12장). 자리 이벤트는 src/data/deskEvents.js
  desk: {
    // 책상 위치는 층 데이터(floors.js map.desk)
    labelOffsetY: 40,
    // 모니터 위 알림 배지 위치 (책상 발밑 기준)
    alertOffset: { x: 12, y: -34 },
    // 책상 앞(아래쪽) 이 범위에 서 있으면 holdTime(ms) 뒤 회사 PC 화면으로
    zone: { width: 44, height: 22 },
    holdTime: 450,
    // 처음 열리는 시각(17:00 부터 분)과, 한 번 쓰면 다시 열리기까지(분)
    firstOpen: 3,
    cooldown: 8,
    // 열린 직후 이 시간(ms) 동안 책상이 화면 밖이면 가장자리 화살표
    arrowTime: 6000,
    // 모니터로 확대: 얼마나(배), 얼마 동안(ms). 모니터는 책상 발밑에서 위로 monitorOffsetY
    zoom: 4,
    zoomDuration: 380,
    returnDuration: 260,
    monitorOffsetY: -26,
    // 주인공 머리 위 진행 표시
    progress: { radius: 7, offsetY: 34, color: 0xffd23f },
    // 알림 중 책상이 화면 밖이면 가장자리 화살표
    arrow: { margin: 14, marginTop: 70, marginBottom: 34, size: 6, color: 0xffd23f },
    // 회사 PC 화면 메신저 속도(ms): 화면이 뜬 뒤, 입력 중 표시, 메시지 사이, 끝난 뒤 닫히기까지
    screen: { openDelay: 250, typing: 420, between: 200, afterChoice: 900 },
  },

  // 몬스터가 쏘는 말풍선 (팀장 잔소리). 항목별 수치는 몬스터 데이터의 attack
  enemyShot: { color: '#ffffff', back: '#a02424', hitRadius: 8, fadeTime: 300 },

  // 층 클리어 계단 (systems/Stairs.js). 계단이 생길 수 있는 곳은 층 데이터 map.stairs
  stairs: {
    // 이 범위(계단 발밑에서 위로)에 들어서면 클리어
    zone: { width: 28, height: 20 },
    // 나타날 때 커지는 크기와 시간(ms), 머리 위 "계단" 글자 높이·둥실 높이(px)·시간(ms)
    appearScale: 0.2,
    appearTime: 400,
    labelOffsetY: 40,
    labelBob: 3,
    labelBobTime: 400,
    // 계단이 화면 밖이면 가장자리 화살표
    arrow: { margin: 14, marginTop: 70, marginBottom: 34, size: 9, color: 0x5bd16a },
  },

  // 유리벽 회의실 (systems/Rooms.js). 회의실 위치는 층 데이터 map.rooms
  rooms: {
    // 벽 두께(주인공을 막는 부분), 문 틈 너비, 유리 높이(3/4 시점, px)
    wallThickness: 4,
    doorWidth: 30,
    glassHeight: 16,
    glass: 0x9fd6ea,
    glassAlpha: 0.5,
    frame: 0x4a5068,
    mullionGap: 30,
    shine: 0xffffff,
    shineAlpha: 0.6,
    shineLength: 24,
    // 회의실 안 바닥 색, 탁자·화이트보드 위치(회의실 가운데·위쪽 벽에서 px), 이름 글자
    floorColor: 0x5a6e66,
    tableOffsetY: 18,
    boardOffsetY: 22,
    nameInset: 4,
    nameColor: '#e8f0ff',
    // 문: 평소 색, 열릴 때 번쩍이는 색과 시간(ms), "회의 끝!" 글자가 문에서 떨어진 거리·떠오르는 높이(px)
    doorColor: 0x8f94a3,
    doorAlpha: 0.5,
    doorOpenColor: 0xffd23f,
    doorOpenTime: 600,
    doorFade: 500,
    labelDistance: 14,
    labelRise: 10,
  },

  // 엘리트 (항목별 기술은 src/data/elites.js, 기술 동작은 systems/Elites.js)
  elite: {
    // 기술을 쓸 대상이 없을 때 다시 노리기까지(ms)
    retry: 800,
    // 바닥 예고 원: 색, 바깥 선 투명도, 안쪽 채움 투명도(처음→실행 직전), 머리 옆 "!" 크기와 위치(발밑에서 px, 엘리트 크기 배율이 곱해진다)
    telegraph: { color: 0xe03a3a, lineAlpha: 0.9, outerLine: 1, innerLine: 2, minRadius: 1, fillFrom: 0.06, fillTo: 0.32, iconScale: 1.5, iconOffsetX: 13, iconOffsetY: 30 },
    // 대사 말풍선: 높이(발밑에서 px, 크기 배율이 곱해진다), 떠 있는 시간(ms), 사라지는 시간(ms), 색, 글자 둘레 여백(px)
    bubble: { offsetY: 54, time: 1800, fade: 300, back: '#ffffff', color: '#1a1420', padX: 3, padY: 1 },
    // 던진 몬스터가 떨어질 때 화면 흔들림
    landingShake: { duration: 120, intensity: 0.006 },
  },

  // 사무실 NPC (항목별 행동은 src/data/npcs.js)
  npc: {
    // 말풍선 높이(px), 떠 있는 시간(ms), 바탕색
    bubbleOffsetY: 48,
    bubbleTime: 1600,
    bubbleFade: 300,
    bubbleBack: '#ffffff',
    // 나타난 뒤 처음 막아 주기까지(ms), 막는 원 색, 밀린 몬스터가 쫓아오지 못하는 시간(ms)
    firstGuardDelay: 1200,
    guardColor: 0x7ec8e3,
    pushHold: 140,
    // 막아 줄 때: 주인공 앞으로 뛰어나오는 거리(px)와 속도(px/초), 충격파 퍼지는 시간(ms),
    // 화면 흔들림, 몬스터에 찍히는 "접수!" 도장 글자 (한 번에 최대 개수, 떠 있는 시간 ms)
    guardDash: { distance: 20, speed: 300 },
    guardWave: 380,
    // 머리 위로 든 서류철 높이(px)
    folderOffsetY: 34,
    guardShake: { duration: 120, intensity: 0.004 },
    // tilt: 기울기 범위(도), fromScale→1 로 slamTime(ms) 동안 쾅, fadeTime(ms) 동안 사라짐, flashColor: 찍힌 몬스터 번쩍 색
    stamp: { text: '접수!', color: '#e03a3a', max: 8, duration: 650, tilt: 15, fromScale: 2, slamTime: 120, fadeTime: 200, flashColor: 0xff6a6a },
    // 막는 원: 처음 startScale 크기에서 active 의 growPart 비율 동안 다 커짐, 채움·선 투명도, 주인공 발밑에서 위로 offsetY
    ring: { startScale: 0.4, growPart: 0.2, fillAlpha: 0.12, fillMin: 0.06, lineAlpha: 0.9, lineFade: 0.5, offsetY: 6 },
    // 등장(appearScale→1, appearTime ms), 서류철(folderFrom→folderTo, folderTime ms), 충격파(waveFrom→waveTo),
    // 걸을 때 통통(bobPeriod ms, bobHeight px), 떠날 때 사라지는 시간(leaveFade ms)
    anim: { appearScale: 0.2, appearTime: 260, folderFrom: 0.3, folderTo: 1.4, folderTime: 180, waveFrom: 0.3, waveTo: 1.3, bobPeriod: 90, bobHeight: 2, leaveFade: 400 },
    // 선배가 몬스터에 닿았다고 보는 거리(px), 한 번 맞은 뒤 다시 맞지 않는 시간(ms)
    hitRadius: 12,
    hurtCooldown: 700,
    // 머리 위 체력 칸 (칸 하나 크기와 간격, px)
    hpPip: { width: 4, height: 3, gap: 1, offsetY: -4, full: 0x5bd16a, empty: 0x3a3048 },
    // 나타나는 곳: 주인공 왼쪽(px)
    spawnOffsetX: 24,
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
    // 붙잡혔을 때("회의 중") 머리 위 글자 높이(발밑에서 px)
    tagOffsetY: 40,
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
    growth: 1.15,
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
    // 보스가 여러 장으로 흩뿌릴 때 퍼지는 거리(px)
    bossScatter: 24,
    // 동시에 바닥에 있을 수 있는 서류 수
    poolSize: 200,
  },

  // 무기 칸과 레벨
  weapons: {
    slots: 4,
    maxLevel: 5,
  },

  // 아이템 칸 (무기 칸 아래). 아이템 목록은 src/data/upgrades.js
  items: {
    slots: 4,
    // 아이템에 maxLevel 이 없을 때 최대 레벨
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
    cardRows: { badge: 12, icon: 38, name: 66, desc: 92, credit: 12, creditBottom: 5 },
    iconScale: 3,
    // 아이템 아이콘은 무기 투사체 그림보다 커서 덜 키운다
    itemIconScale: 2.5,
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
    // 17:00→18:00 을 실제로 몇 ms 동안 (3화: 1분 → 4분. 기획서 "한 판 3~5분")
    realDuration: 240000,
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
    // 무기 칸 아래 아이템 칸 (무기 칸보다 작게)
    itemSlots: { size: 16, gap: 3, offsetY: 4, iconScale: 1 },
    // 화면 아래 승진 막대
    // 게임 시작 때 조작 안내가 화면 아래에서 떨어진 거리(px). 승진 막대 위에 뜨게
    controlsHintBottom: 30,
    xpBar: { width: 240, height: 5, bottom: 10, labelGap: 6, fill: 0x7ec8e3, back: 0x3a3048, outline: 0x1a1420 },
    // 시청자 무기를 얻었을 때 시계 아래에 뜨는 "○○님의 [무기]" 알림
    creditToast: { offsetY: 22, gap: 14, duration: 2500, fade: 600 },
    // "전체 회신 폭탄!" 같은 경고 글자: 화면 높이 비율 위치, 떠 있는 시간(ms), 사라지는 시간(ms)
    // 여러 개가 동시에 뜨면 stackGap(px)씩 아래로 쌓는다
    warning: { y: 0.3, duration: 1300, fade: 500, stackGap: 30 },
    // 보스 체력 막대 (화면 아래 가운데)
    // 위쪽은 시계·알림 글자와 겹쳐서(3화: "17:30팀장", 알림과 겹침) 승진 막대 바로 위에 둔다
    // 보스와 엘리트가 같이 있으면 위로 쌓는다(stackGap px). 엘리트 막대는 eliteFill 색
    bossBar: { width: 160, height: 6, y: 236, labelGap: 2, stackGap: 22, fill: 0xe03a3a, eliteFill: 0xf08a2a, back: 0x3a3048, outline: 0x1a1420 },
  },

  // 진행 상황 저장 (systems/Progress.js): 클리어한 층을 이 브라우저에 기억하는 이름
  progress: { storageKey: 'toegeun-progress' },

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
    // 시간대별 난이도(stages), 저절로 나오는 몬스터(enemies), 몰려오는 패턴(waves)은 층마다 다르다: src/data/floors.js
    // 전체 간격 배율 (조절 패널용. 작을수록 많이 나온다)
    intervalMultiplier: 1,
    // 보스가 부르는 부하: every(ms)마다 count 마리를 보스 둘레 radius(px)에
    summonRadius: 28,
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
    // 화난 몬스터(팀장) 몸 색
    rageTint: 0xff8a8a,
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
    // 전체 효과음 크기. 0.25 는 너무 작아 PC 스피커에서 거의 안 들렸다
    volume: 0.8,
    // 같은 소리가 너무 촘촘히 겹치지 않게 하는 최소 간격(ms)
    minInterval: 40,
    // 소리 끄기 버튼 상태를 이 브라우저에 기억하는 이름
    muteStorageKey: 'toegeun-muted',
  },

  // 배경음악 (곡은 src/data/music.js)
  music: {
    // 전체 배경음악 크기 (효과음보다 작게 깔린다)
    volume: 0.35,
    // 승진 카드를 고르는 동안 이 비율로 줄인다
    duck: 0.35,
    // 크기가 바뀌는 데 걸리는 시간(초, 작을수록 빠름)
    fade: 0.15,
    // 이 시각(17:00부터 분)부터 근무 중 음악이 빨라진다
    rushFrom: 55,
    rushTempo: 1.15,
    // 음을 미리 예약해 두는 시간(초)과 예약을 확인하는 간격(ms)
    lookahead: 0.15,
    tick: 25,
    // 곡을 시작할 때 첫 음까지 여유(초)
    startDelay: 0.05,
    drums: {
      K: { gain: 0.6, from: 150, to: 45, duration: 0.12 },
      S: { gain: 0.25, highpass: 1500, duration: 0.09 },
      h: { gain: 0.08, highpass: 7000, duration: 0.03 },
    },
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
    // 원 반지름의 이 비율만큼 밀면 최고 속도 (1이면 끝까지 밀어야 최고 속도)
    fullAt: 0.6,
    // 원 밖으로 끌면 원이 손가락을 따라온다
    follow: true,
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
    // 시작 화면 엘리베이터 버튼판 (scenes/TitleScene.js). 위치는 px
    elevator: {
      titleY: 26,
      hintY: 50,
      // 버튼판 1~(rows × columns)층, 위쪽 줄이 높은 층
      rows: 5,
      columns: 3,
      panel: { x: 150, y: 62, width: 120, height: 182, radius: 6 },
      display: { y: 68, width: 72, height: 18 },
      // 버튼 반지름, 첫 버튼 위치, 버튼 사이, 누르는 범위를 그림보다 넓게(px)
      button: { radius: 11, startX: 180, startY: 104, gapX: 30, gapY: 29, touchPad: 4 },
      info: { x: 370, nameY: 110, statusY: 136, introY: 168, promptY: 222, wrap: 160 },
      colors: {
        panel: 0xc9ccd6,
        panelDark: 0x8f94a3,
        display: 0x1a1420,
        displayText: '#ff8a3a',
        lit: 0xffd23f,
        locked: 0x5a5468,
        unbuilt: 0x3a3048,
        lockedText: '#8a8498',
        selected: 0xffffff,
        clearMark: '#5bd16a',
      },
      // 잠긴 층을 누르면 흔들림, 열린 층을 누르면 눌림, 출발까지(ms)
      shake: { distance: 2, duration: 40, repeat: 2 },
      press: { scale: 0.85, duration: 80 },
      startDelay: 300,
    },
    gameInfo: {
      labelOffsetY: -12,
      infoOffsetY: 12,
    },
  },
};
