// JSON 파일 읽기·쓰기 (없으면 기본값)
import fs from 'node:fs';
import path from 'node:path';

export function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // 쓰는 도중 꺼져도 파일이 깨지지 않게 임시 파일에 쓴 뒤 바꿔 끼운다
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(tmp, file);
}
