// 배경음악 목록. 코드로 만드는 8비트 음악이라 저작권 걱정이 없다 (나중에 녹음한 음악으로 바꿀 수 있다)
// 곡 하나 = 박자(bpm), 한 박을 몇 칸으로 나누는지(stepsPerBeat), 반복 여부(loop), 악기 목록(voices), 북(drums)
//
// 악기 voices[]
//   wave      'square' | 'triangle' | 'sawtooth' | 'sine'
//   gain      이 악기 크기 (전체 크기는 config.js music.volume)
//   staccato  음 길이 중 실제로 소리 나는 비율 (1이면 끝까지, 작을수록 톡톡 끊김)
//   notes     칸마다 하나씩, 띄어쓰기로 구분. '|' 는 마디 표시라 무시한다
//             C4, F#3 처럼 음 이름 / '.' 앞 음을 한 칸 더 늘림 / '-' 쉼
// 북 drums: 같은 칸 수. K 큰북, S 작은북, h 하이햇, '-' 쉼
// 한 곡 안의 모든 줄은 칸 수가 같아야 한다

export const MUSIC = {
  // 타이틀: 잔잔하게 출근 전 한숨
  title: {
    bpm: 76,
    stepsPerBeat: 2,
    loop: true,
    voices: [
      {
        wave: 'triangle',
        gain: 0.5,
        staccato: 0.9,
        notes: `C4 E4 G4 C5 G4 E4 G4 E4 | A3 C4 E4 A4 E4 C4 E4 C4 |
                F3 A3 C4 F4 C4 A3 C4 A3 | G3 B3 D4 G4 D4 B3 D4 B3`,
      },
      {
        wave: 'square',
        gain: 0.12,
        staccato: 0.85,
        notes: `E5 . . . D5 . C5 . | C5 . . . . . . - |
                A4 . . . C5 . F5 . | D5 . . . . . . -`,
      },
      {
        wave: 'triangle',
        gain: 0.55,
        staccato: 1,
        notes: `C3 . . . . . . . | A2 . . . . . . . |
                F2 . . . . . . . | G2 . . . . . . .`,
      },
    ],
  },

  // 근무 중: 바쁘게 돌아가는 사무실. 17:50부터는 config music.rushTempo 만큼 빨라진다
  game: {
    bpm: 132,
    stepsPerBeat: 2,
    loop: true,
    voices: [
      {
        wave: 'square',
        gain: 0.16,
        staccato: 0.75,
        notes: `A4 . C5 E5 A5 . G5 E5 | F5 . E5 C5 A4 . C5 - |
                E5 . G5 E5 C5 . D5 E5 | D5 . B4 G4 B4 . D5 - |
                A4 C5 E5 A5 G5 E5 C5 E5 | F5 . A5 . G5 F5 E5 C5 |
                E5 . G5 . C6 . B5 G5 | G#5 . E5 . B4 . G#4 -`,
      },
      {
        wave: 'triangle',
        gain: 0.5,
        staccato: 0.7,
        notes: `A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 |
                C3 C4 C3 C4 C3 C4 C3 C4 | G2 G3 G2 G3 G2 G3 G2 G3 |
                A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 |
                C3 C4 C3 C4 C3 C4 C3 C4 | E2 E3 E2 E3 E2 E3 E2 E3`,
      },
    ],
    drums: `K h S h K K S h | K h S h K K S h | K h S h K K S h | K h S h K K S h |
            K h S h K K S h | K h S h K K S h | K h S h K K S h | K h S h S S S S`,
  },

  // 칼퇴 성공: 한 번만
  clear: {
    bpm: 150,
    stepsPerBeat: 2,
    loop: false,
    voices: [
      { wave: 'square', gain: 0.18, staccato: 0.9, notes: 'C5 E5 G5 C6 . . G5 C6 | . . . . . . - -' },
      { wave: 'triangle', gain: 0.5, staccato: 0.9, notes: 'C3 . . . G2 . C3 . | . . . . . . - -' },
    ],
    drums: 'K - - - K - S - | K - - - - - - -',
  },

  // 야근 확정: 한 번만, 축 처지게
  overtime: {
    bpm: 84,
    stepsPerBeat: 2,
    loop: false,
    voices: [
      { wave: 'square', gain: 0.15, staccato: 0.95, notes: 'E5 . D5 . C5 . B4 . | A4 . . . . . - -' },
      { wave: 'triangle', gain: 0.5, staccato: 0.95, notes: 'A2 . . . E2 . . . | A2 . . . . . - -' },
    ],
  },
};
