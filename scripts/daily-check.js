// 매일 자동 확인 (Windows 작업 스케줄러가 매일 오전 11시에 실행)
// 1. 새 댓글 가져오기 → 2. 퇴근봇 초안 → 3. Windows 알림
// - 1단계 운영이므로 절대 게시하지 않는다. 게시는 사람이 승인한 뒤 post-replies.js 로만
// - 오류가 나면 알림으로 이유를 알려 준다
// 실행 기록은 bot/logs/날짜.log
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fetchComments } from './fetch-comments.js';
import { draftReplies } from './draft-replies.js';
import { LOG_DIR, ROOT, today } from './lib/paths.js';

fs.mkdirSync(LOG_DIR, { recursive: true });
const logFile = path.join(LOG_DIR, `${today()}.log`);
const log = (msg) => fs.appendFileSync(logFile, `[${new Date().toLocaleString('ko-KR')}] ${msg}\n`);

function notify(title, body) {
  log(`알림: ${title} / ${body}`);
  spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'scripts', 'notify.ps1'), title, body], {
    windowsHide: true,
  });
}

try {
  log('시작');
  const fetched = await fetchComments();
  log(`영상 ${fetched.videos.length}개, 새 댓글 ${fetched.newCount}개`);
  const { added } = await draftReplies();
  const replies = added.filter((d) => d.status === 'pending').length;
  const review = added.filter((d) => d.category === '확인 필요').length;
  log(`초안 ${added.length}개 (답글 ${replies}, 확인 필요 ${review})`);
  if (added.length) {
    notify('퇴근봇 답글 초안 준비됨', `새 댓글 ${added.length}개 · 답글 초안 ${replies}개 · 확인 필요 ${review}개. Claude Code에게 "댓글 확인해줘"라고 하세요`);
  } else {
    notify('퇴근봇 오늘 확인 끝', `퇴근 서바이버 영상 ${fetched.videos.length}개에 새 댓글이 없어요`);
  }
} catch (err) {
  log(`오류: ${err.stack ?? err.message}`);
  notify('퇴근봇 확인 실패 (게시 안 함)', err.message);
  process.exitCode = 1;
}
