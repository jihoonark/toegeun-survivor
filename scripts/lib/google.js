// 유튜브 API 로그인과 호출 (GAME_SPEC.md 11장)
// - client_secret.json: Google Cloud 에서 받은 "데스크톱 앱" OAuth 클라이언트 (깃에 올리지 않음)
// - .oauth/token.json: 로그인 후 받은 토큰 (깃에 올리지 않음)
// 앱이 테스트 상태라 로그인은 7일마다 만료될 수 있다. 만료되면 LoginRequiredError 를 던진다
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT } from './paths.js';

const CLIENT_FILE = path.join(ROOT, 'client_secret.json');
const TOKEN_FILE = path.join(ROOT, '.oauth', 'token.json');
// 댓글 읽기와 답글 쓰기에 필요한 권한
const SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';
const API = 'https://www.googleapis.com/youtube/v3';

export class LoginRequiredError extends Error {
  constructor(reason) {
    super(`유튜브 로그인이 필요합니다 (${reason}). Claude Code에게 "퇴근봇 로그인해줘"라고 하거나 npm run bot:login 을 실행하세요`);
    this.name = 'LoginRequiredError';
  }
}

function loadClient() {
  if (!fs.existsSync(CLIENT_FILE)) throw new Error('client_secret.json 이 프로젝트 폴더에 없습니다');
  const json = JSON.parse(fs.readFileSync(CLIENT_FILE, 'utf8'));
  const c = json.installed ?? json.web;
  if (!c?.client_id || !c?.client_secret) throw new Error('client_secret.json 형식이 "데스크톱 앱" OAuth 클라이언트가 아닙니다');
  return c;
}

function saveToken(token) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2));
}

async function tokenRequest(params) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(`토큰 요청 실패: ${body.error} ${body.error_description ?? ''}`.trim());
    err.code = body.error;
    throw err;
  }
  return body;
}

// 기본 브라우저로 주소를 연다 (cmd 의 start 는 & 가 든 주소를 자르므로 쓰지 않는다)
function openBrowser(url) {
  spawn('rundll32', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore' }).unref();
}

// 처음 로그인: 이 컴퓨터에서만 받는 임시 주소로 Google 이 로그인 결과를 돌려준다
export async function login() {
  const client = loadClient();
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');
  let redirect = '';

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname !== '/') {
        res.writeHead(404).end();
        return;
      }
      const ok = url.searchParams.get('state') === state && url.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(ok ? '<h2>퇴근봇 로그인 완료. 이 창은 닫아도 됩니다.</h2>' : '<h2>로그인에 실패했습니다. 다시 시도해 주세요.</h2>');
      server.close();
      if (ok) resolve(url.searchParams.get('code'));
      else reject(new Error(`로그인 실패: ${url.searchParams.get('error') ?? 'state 불일치'}`));
    });
    server.listen(0, '127.0.0.1', () => {
      redirect = `http://127.0.0.1:${server.address().port}`;
      const auth = new URL(client.auth_uri ?? 'https://accounts.google.com/o/oauth2/v2/auth');
      auth.search = new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: redirect,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline',
        // 계정 선택 화면을 항상 띄워 채널 계정을 고를 수 있게 한다
        prompt: 'select_account consent',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
      }).toString();
      console.log('브라우저에서 로그인 창을 엽니다. 안 열리면 아래 주소를 직접 여세요:\n' + auth.toString());
      openBrowser(auth.toString());
    });
    server.on('error', reject);
  });

  const token = await tokenRequest({
    client_id: client.client_id,
    client_secret: client.client_secret,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirect,
  });
  saveToken({ ...token, expires_at: Date.now() + token.expires_in * 1000 });
}

async function accessToken() {
  if (!fs.existsSync(TOKEN_FILE)) throw new LoginRequiredError('아직 로그인하지 않음');
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  if (token.expires_at - 60000 > Date.now()) return token.access_token;
  if (!token.refresh_token) throw new LoginRequiredError('다시 로그인 필요');

  const client = loadClient();
  try {
    const fresh = await tokenRequest({
      client_id: client.client_id,
      client_secret: client.client_secret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    });
    const next = { ...token, ...fresh, expires_at: Date.now() + fresh.expires_in * 1000 };
    saveToken(next);
    return next.access_token;
  } catch (err) {
    if (err.code === 'invalid_grant') throw new LoginRequiredError('로그인 만료');
    throw err;
  }
}

// YouTube Data API 호출. 실패하면 Google 이 준 이유를 담아 던진다
export async function youtube(method, resource, params = {}, body) {
  const url = new URL(`${API}/${resource}`);
  url.search = new URLSearchParams(params).toString();
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) throw new LoginRequiredError('인증 거부');
  if (!res.ok) {
    const reason = json.error?.errors?.[0]?.reason ?? res.status;
    throw new Error(`유튜브 API 오류 (${resource}): ${reason} ${json.error?.message ?? ''}`.trim());
  }
  return json;
}

// 로그인한 채널 (계정 선택에서 고른 채널)
export async function myChannel() {
  const { items } = await youtube('GET', 'channels', { part: 'snippet,contentDetails', mine: 'true' });
  if (!items?.length) throw new Error('로그인한 계정에 유튜브 채널이 없습니다. 계정 선택 화면에서 채널 계정을 골라 다시 로그인하세요');
  const c = items[0];
  return { id: c.id, title: c.snippet.title, uploads: c.contentDetails.relatedPlaylists.uploads };
}
