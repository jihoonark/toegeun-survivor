// 11장 1단계: 최신 영상들의 새 댓글을 comments/날짜.json 에 저장한다
//   node scripts/fetch-comments.js                 최근 영상 중 제목에 "퇴근서바이버"가 들어간 것 전부 (쇼츠 포함)
//   node scripts/fetch-comments.js --title 1화     그중 제목에 "1화"가 들어간 영상만
//   node scripts/fetch-comments.js --video <영상ID>
// 새 댓글 = 전에 가져온 적 없고, 채널이 아직 답하지 않았고, 채널 본인 댓글이 아닌 것
// 채널이 고정한 "답글로 아이디어를 남겨 주세요" 댓글 아래의 시청자 답글도 댓글 하나로 가져온다
//   (이런 댓글은 parentId 에 고정 댓글 ID가 들어가고, 답글도 그 스레드에 단다)
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CONFIG } from '../src/config.js';
import { youtube, myChannel } from './lib/google.js';
import { COMMENTS_DIR, POSTED_FILE, today } from './lib/paths.js';
import { readJson, writeJson } from './lib/store.js';

const SEEN_FILE = path.join(COMMENTS_DIR, 'seen.json');
const squash = (s) => s.replace(/\s+/g, '');

async function pickVideos(channel, { videoId, title }) {
  if (videoId) {
    const { items } = await youtube('GET', 'videos', { part: 'snippet', id: videoId });
    if (!items?.length) throw new Error(`영상을 찾을 수 없습니다: ${videoId}`);
    return [{ id: videoId, title: items[0].snippet.title }];
  }
  const { items } = await youtube('GET', 'playlistItems', {
    part: 'snippet',
    playlistId: channel.uploads,
    maxResults: String(CONFIG.bot.recentVideos),
  });
  const keyword = squash(CONFIG.bot.videoKeyword);
  const videos = (items ?? [])
    .map((i) => ({ id: i.snippet.resourceId.videoId, title: i.snippet.title }))
    .filter((v) => squash(v.title).includes(keyword) && (!title || v.title.includes(title)));
  if (!videos.length) throw new Error(`최근 영상 ${CONFIG.bot.recentVideos}개 중 제목에 "${title ?? CONFIG.bot.videoKeyword}"이(가) 들어간 영상이 없습니다`);
  return videos;
}

const toComment = (c, video, parentId = null) => ({
  id: c.id,
  // 고정 댓글 아래 답글이면 그 고정 댓글 ID. 퇴근봇 답글도 이 스레드에 달린다
  parentId,
  videoId: video.id,
  videoTitle: video.title,
  author: c.snippet.authorDisplayName,
  text: c.snippet.textDisplay,
  publishedAt: c.snippet.publishedAt,
  likeCount: c.snippet.likeCount,
});

// 한 영상의 댓글 스레드 전부 (쪽수 제한 있음)
async function threadsOf(videoId) {
  const threads = [];
  let pageToken;
  for (let page = 0; page < CONFIG.bot.fetchMaxPages; page++) {
    const res = await youtube('GET', 'commentThreads', {
      part: 'snippet,replies',
      videoId,
      order: 'time',
      maxResults: '100',
      textFormat: 'plainText',
      ...(pageToken && { pageToken }),
    });
    threads.push(...(res.items ?? []));
    pageToken = res.nextPageToken;
    if (!pageToken) break;
  }
  return threads;
}

// 스레드의 답글 전부 (commentThreads 에는 최대 5개만 딸려 오므로 따로 받는다)
async function repliesOf(parentId) {
  const replies = [];
  let pageToken;
  for (let page = 0; page < CONFIG.bot.fetchMaxPages; page++) {
    const res = await youtube('GET', 'comments', {
      part: 'snippet',
      parentId,
      maxResults: '100',
      textFormat: 'plainText',
      ...(pageToken && { pageToken }),
    });
    replies.push(...(res.items ?? []));
    pageToken = res.nextPageToken;
    if (!pageToken) break;
  }
  return replies;
}

export async function fetchComments(options = {}) {
  const channel = await myChannel();
  const videos = await pickVideos(channel, options);
  const isMine = (c) => c.snippet.authorChannelId?.value === channel.id;

  const seen = new Set(readJson(SEEN_FILE, { ids: [] }).ids);
  const posted = new Set(readJson(POSTED_FILE, []).map((p) => p.commentId));
  const skip = (id) => seen.has(id) || posted.has(id);
  const fresh = [];

  for (const video of videos) {
    for (const thread of await threadsOf(video.id)) {
      const top = thread.snippet.topLevelComment;
      if (isMine(top)) {
        // 채널 댓글 아래 시청자 답글: 채널이 그 뒤에 답을 단 적 없는 것만
        if (!thread.snippet.totalReplyCount) continue;
        const replies = await repliesOf(top.id);
        replies.sort((a, b) => a.snippet.publishedAt.localeCompare(b.snippet.publishedAt));
        replies.forEach((r, i) => {
          const answered = replies.slice(i + 1).some((later) => isMine(later) && later.snippet.textDisplay.includes(r.snippet.authorDisplayName));
          if (!isMine(r) && !answered && !skip(r.id)) fresh.push(toComment(r, video, top.id));
        });
        continue;
      }
      const answered = (thread.replies?.comments ?? []).some(isMine);
      if (!answered && !skip(top.id)) fresh.push(toComment(top, video));
    }
  }

  // 같은 날 여러 번 가져오면 한 파일에 이어 붙인다
  const file = path.join(COMMENTS_DIR, `${today()}.json`);
  const saved = readJson(file, { comments: [] });
  const known = new Set(saved.comments.map((c) => c.id));
  saved.fetchedAt = new Date().toISOString();
  saved.comments.push(...fresh.filter((c) => !known.has(c.id)));
  writeJson(file, saved);
  fresh.forEach((c) => seen.add(c.id));
  writeJson(SEEN_FILE, { ids: [...seen] });

  return { channel: channel.title, videos, newCount: fresh.length, file };
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--video') opts.videoId = argv[++i];
    else if (argv[i] === '--title') opts.title = argv[++i];
  }
  return opts;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchComments(parseArgs(process.argv.slice(2)))
    .then((r) => {
      console.log(`[${r.channel}] 영상 ${r.videos.length}개, 새 댓글 ${r.newCount}개 → ${path.relative(process.cwd(), r.file)}`);
      r.videos.forEach((v) => console.log(`  - ${v.title}`));
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
