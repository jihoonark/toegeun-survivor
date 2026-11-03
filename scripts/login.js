// 퇴근봇 유튜브 로그인 (처음 한 번, 그리고 7일마다 만료되면 다시)
//   node scripts/login.js
// 브라우저 계정 선택 화면에서 반드시 "채널 계정"을 고른다
import { login, myChannel } from './lib/google.js';

try {
  await login();
  const channel = await myChannel();
  console.log(`로그인 완료: "${channel.title}" 채널`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
