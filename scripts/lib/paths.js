// 퇴근봇 스크립트가 쓰는 경로
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const COMMENTS_DIR = path.join(ROOT, 'comments');
export const BOT_DIR = path.join(ROOT, 'bot');
export const PERSONA_FILE = path.join(BOT_DIR, 'PERSONA.md');
export const DRAFTS_FILE = path.join(BOT_DIR, 'drafts.json');
export const POSTED_FILE = path.join(BOT_DIR, 'posted.json');
export const LOG_DIR = path.join(BOT_DIR, 'logs');
// Codex(퇴근봇)가 일하는 빈 폴더. 게임 코드 폴더 밖에 둔다 (11장 보안)
export const CODEX_WORK_DIR = path.resolve(ROOT, '..', 'toegeun-bot-work');

// 오늘 날짜 (한국 시간) "2026-11-03"
export const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
