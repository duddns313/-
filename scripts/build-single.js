/* ===================== 단일 파일 빌드 =====================
 * 32개로 나뉜 스크립트와 CSS를 index.html에 인라인해 HTML 한 장으로 만든다.
 *
 *   node scripts/build-single.js
 *   → dist/hogwarts-shade.html
 *
 * 정적 호스팅이 안 되는 곳(아티팩트·이메일 첨부·USB)에 통째로 넘길 때 쓴다.
 * 스크립트 순서는 index.html에서 그대로 읽어오므로 여기서 따로 관리하지 않는다. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, 'hogwarts-shade.html');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* index.html의 <script src> 순서가 곧 로드 순서다 */
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

/* 서비스 워커는 단일 파일에서 등록할 수 없다 (sw.js가 따로 없으므로) */
const EXCLUDE = ['js/pwa.js'];

const missing = scripts.filter((s) => !fs.existsSync(path.join(ROOT, s)));
if (missing.length) {
  console.error('index.html이 없는 파일을 참조합니다:\n  ' + missing.join('\n  '));
  process.exit(1);
}

const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');

/* localStorage를 못 쓰는 환경(샌드박스 iframe · 시크릿 모드)에서도
 * 최소한 한 세션 안에서는 저장이 돌아가게 한다. 「기록」이 이 게임의
 * 진행도라서, 저장이 통째로 죽으면 회차 구조가 성립하지 않는다. */
const STORAGE_SHIM = `
(function () {
  try {
    const k = '__probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
  } catch (e) {
    const mem = Object.create(null);
    const shim = {
      getItem: (key) => (key in mem ? mem[key] : null),
      setItem: (key, val) => { mem[key] = String(val); },
      removeItem: (key) => { delete mem[key]; },
      clear: () => { Object.keys(mem).forEach((key) => delete mem[key]); },
    };
    try {
      Object.defineProperty(window, 'localStorage', { value: shim, configurable: true });
    } catch (e2) {
      window.__memStore = shim;
    }
    console.warn('localStorage를 쓸 수 없어 메모리에 저장합니다. 새로고침하면 기록이 사라집니다.');
  }
})();
`;

const body = scripts
  .filter((src) => EXCLUDE.indexOf(src) < 0)
  .map((src) => `/* ==== ${src} ==== */\n` + fs.readFileSync(path.join(ROOT, src), 'utf8'))
  .join('\n');

let out = html;

/* 외부 참조를 전부 걷어낸다 — 단일 파일은 자기 밖을 보면 안 된다 */
out = out.replace(/\s*<link rel="manifest"[^>]*>/g, '');
out = out.replace(/\s*<link rel="icon"[^>]*>/g, '');
out = out.replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, '');
out = out.replace(/\s*<link rel="stylesheet" href="css\/style\.css"\s*\/?>/, '\n<style>\n' + css + '\n</style>');
out = out.replace(/\s*<script src="[^"]+"><\/script>/g, '');
out = out.replace('</body>', '<script>\n' + STORAGE_SHIM + '\n' + body + '\n</script>\n</body>');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, out);

/* ── 아티팩트용 ──
 * 게시 측이 <!doctype>·<html>·<head>·<body>를 직접 씌우므로 그 껍데기를 벗긴다.
 * <title>은 남긴다 — 탭 이름과 갤러리 이름을 그것으로 읽는다. */
const inner = out
  .replace(/^[\s\S]*?<head>/, '')
  .replace(/<\/head>\s*<body>/, '')
  .replace(/<\/body>\s*<\/html>\s*$/, '')
  .replace(/^\s*<meta[^>]*>\s*$/gm, '')
  .trim();

const ARTIFACT_OUT = path.join(OUT_DIR, 'artifact.html');
fs.writeFileSync(ARTIFACT_OUT, inner);

const kb = (n) => (Buffer.byteLength(n) / 1024).toFixed(0);
console.log(`dist/hogwarts-shade.html  —  스크립트 ${scripts.length - EXCLUDE.length}개 인라인, ${kb(out)} KB (단독 실행용)`);
console.log(`dist/artifact.html        —  껍데기 제거, ${kb(inner)} KB (아티팩트 게시용)`);
