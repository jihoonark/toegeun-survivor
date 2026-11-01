import { defineConfig } from 'vite';

export default defineConfig({
  // itch.io / GitHub Pages 어느 경로에 올려도 동작하도록 상대 경로
  base: './',
  server: {
    // 같은 와이파이의 휴대폰에서 접속할 수 있게 네트워크 주소로도 연다
    host: true,
    port: 5180,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
