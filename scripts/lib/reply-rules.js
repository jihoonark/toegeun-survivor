// 퇴근봇 답글이 지켜야 하는 형식 (bot/PERSONA.md). 초안을 받을 때와 올리기 직전에 두 번 확인한다
import { CONFIG } from '../../src/config.js';

export const CATEGORIES = ['아이디어-몬스터', '아이디어-무기', '아이디어-기타', '칭찬·응원', '질문', '불만·버그 제보', '확인 필요', '무시'];
// 답글 없이 넘기는 분류
export const NO_REPLY = ['확인 필요', '무시'];
export const SIGNATURE = '(퇴근봇 드림)';
// "채택!" 답글에만 넣을 수 있는 게임 주소
export const GAME_URL = 'https://jihoonark.github.io/toegeun-survivor/';

const EMOJI = /\p{Extended_Pictographic}/gu;
const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi;

// 문제가 있으면 이유, 없으면 null
export function checkReply(text) {
  if (typeof text !== 'string' || !text.trim()) return '답글 내용이 없음';
  const t = text.trim();
  if (!t.endsWith(SIGNATURE)) return `끝에 "${SIGNATURE}"가 없음`;
  if (t.length > CONFIG.bot.replyMaxLength) return `${CONFIG.bot.replyMaxLength}자를 넘음`;
  if ((t.match(EMOJI) ?? []).length > 1) return '이모지가 2개 이상';
  const links = (t.match(URL_PATTERN) ?? []).filter((u) => !u.startsWith(GAME_URL));
  if (links.length) return '게임 주소가 아닌 링크가 들어 있음';
  if (/@\S/.test(t)) return '다른 사람을 @로 부름';
  return null;
}
