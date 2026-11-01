import { defineConfig } from 'vite';

export default defineConfig({
  // itch.io / GitHub Pages 어느 경로에 올려도 동작하도록 상대 경로
  base: './',
  server: {
    // 기본은 이 컴퓨터에서만 연다. 공인 IP로 바로 인터넷에 연결된 상태면 host: true 가 개발 서버를 인터넷 전체에 공개한다
    // 같은 와이파이의 휴대폰에서 확인할 때만 `npm run dev -- --host` 로 네트워크 주소를 연다
    host: 'localhost',
    port: 5180,
    fs: {
      // 개발 서버가 비밀 파일을 내려주지 않게 막는다 (깃 제외 목록과 같은 것들)
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', 'client_secret*.json', '*token*.json', '.oauth/**', 'comments/**'],
    },
  },
  preview: {
    host: 'localhost',
    port: 4173,
  },
});
