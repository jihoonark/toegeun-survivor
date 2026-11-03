// 11장 4단계: 사람이 승인한 답글만 올린다. 답글 게시는 반드시 이 스크립트로만 한다
//   node scripts/post-replies.js            올릴 답글 목록만 보여 준다 (아무것도 올리지 않음)
//   node scripts/post-replies.js --confirm  실제로 올린다
// - bot/drafts.json 에서 status 가 "approved" 인 것만 올린다 (사람이 승인하면 Claude Code가 approved 로 바꾼다)
// - 올린 댓글 ID를 bot/posted.json 에 기록해 같은 댓글에 두 번 답하지 않는다
// - 하루 최대 답글 수는 config.js 의 bot.maxRepliesPerDay
import { CONFIG } from '../src/config.js';
import { youtube } from './lib/google.js';
import { DRAFTS_FILE, POSTED_FILE, today } from './lib/paths.js';
import { readJson, writeJson } from './lib/store.js';
import { checkReply } from './lib/reply-rules.js';

const confirm = process.argv.includes('--confirm');
const drafts = readJson(DRAFTS_FILE, { items: [] });
const posted = readJson(POSTED_FILE, []);
const postedIds = new Set(posted.map((p) => p.commentId));
const kstDate = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const postedToday = posted.filter((p) => kstDate(p.postedAt) === today()).length;
const room = Math.max(0, CONFIG.bot.maxRepliesPerDay - postedToday);

const approved = drafts.items.filter((d) => d.status === 'approved');
const queue = [];
for (const d of approved) {
  const problem = postedIds.has(d.commentId) ? '이미 답글을 올린 댓글' : checkReply(d.draft);
  if (problem) console.log(`건너뜀 ${d.commentId}: ${problem}`);
  else queue.push(d);
}
const batch = queue.slice(0, room);
if (queue.length > room) console.log(`오늘 최대 ${CONFIG.bot.maxRepliesPerDay}개라서 ${queue.length - room}개는 내일로 미룹니다`);

if (!batch.length) {
  console.log('올릴 답글이 없습니다');
  process.exit(0);
}
for (const d of batch) console.log(`- [${d.author}] ${d.text.slice(0, 40)}\n  → ${d.draft}`);
if (!confirm) {
  console.log(`\n위 ${batch.length}개는 아직 올리지 않았습니다. 올리려면 --confirm 을 붙여 실행하세요`);
  process.exit(0);
}

let failed = 0;
for (const d of batch) {
  try {
    // 고정 댓글 아래 답글이면 같은 스레드에 달고, 누구에게 하는 답인지 @닉네임을 앞에 붙인다
    const text = d.parentId ? `${d.author} ${d.draft}` : d.draft;
    const reply = await youtube('POST', 'comments', { part: 'snippet' }, { snippet: { parentId: d.parentId ?? d.commentId, textOriginal: text } });
    posted.push({ commentId: d.commentId, replyId: reply.id, text, postedAt: new Date().toISOString() });
    d.status = 'posted';
    // 하나 올릴 때마다 기록해서, 중간에 멈춰도 다음 실행에서 중복으로 올리지 않는다
    writeJson(POSTED_FILE, posted);
    writeJson(DRAFTS_FILE, drafts);
    console.log(`올림 ${d.commentId}`);
  } catch (err) {
    failed++;
    console.error(`실패 ${d.commentId}: ${err.message}`);
    if (err.name === 'LoginRequiredError') break;
  }
}
console.log(`완료: ${batch.length - failed}개 올림, ${failed}개 실패`);
process.exit(failed ? 1 : 0);
