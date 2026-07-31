// browser-check.mjs — 실제 브라우저 검수 (self-check 스킬 2단계 B).
//
// headless 시뮬레이션이 못 보는 것들을 확인한다:
//   Pointer Events 다중 입력 · 협동 조작의 동시성 판정 · pointercancel ·
//   핀치줌/스크롤 차단 · 180° 회전 렌더 · 콘솔 에러 0건
//
// 실행: node scripts/browser-check.mjs   (사전에 python3 -m http.server 8099)

import { chromium } from '/tmp/claude-0/-home-user--/6fd458ef-ab8d-52f7-a771-baed0307e291/scratchpad/node_modules/playwright/index.mjs';

const URL = process.env.URL ?? 'http://127.0.0.1:8099/index.html';

let pass = 0;
const failures = [];
const ok = (cond, label, detail = '') => {
  if (cond) { pass++; return; }
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },   // 세로 폰
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();

// ── 콘솔·에러 수집 ──
const consoleErrors = [];
const pageErrors = [];
const badResponses = [];

// 이 경고는 게임이 아니라 "검수 스크립트"가 만든다 — 픽셀을 세려고
// getImageData를 반복 호출하기 때문. 제품 결함이 아니라 측정 도구의 부작용이라
// 명시적으로 걸러낸다. (다른 경고는 하나도 안 거른다)
const TEST_INDUCED = /willReadFrequently/;

page.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const text = m.text();
  if (TEST_INDUCED.test(text)) return;
  consoleErrors.push(`[${m.type()}] ${text}`);
});
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('requestfailed', (r) => consoleErrors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => {
  if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const cdp = await context.newCDPSession(page);

// ── 좌표 헬퍼: 페이지 안에서 실제 렌더 모듈을 불러 계산한다 ──
async function seamPoints(seamIds) {
  return page.evaluate(async (ids) => {
    const { computeView, seamMidpoint, seedCenter } = await import('/js/render.js');
    const canvas = document.getElementById('board');
    const rect = canvas.getBoundingClientRect();
    const size = window.__puzzle.size;
    const view = computeView(canvas, size);
    return ids.map((id) => {
      const m = seamMidpoint(view, size, id);
      return { x: rect.left + m.x, y: rect.top + m.y };
    });
  }, seamIds);
}

async function seedPoint(seedIdx) {
  return page.evaluate(async (idx) => {
    const { computeView, seedCenter } = await import('/js/render.js');
    const canvas = document.getElementById('board');
    const rect = canvas.getBoundingClientRect();
    const size = window.__puzzle.size;
    const view = computeView(canvas, size);
    const c = seedCenter(view, size, window.__puzzle.seeds[idx].cell);
    return { x: rect.left + c.x, y: rect.top + c.y };
  }, seedIdx);
}

const tap = async (p) => {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

const tapBoth = async (a, b) => {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: a.x, y: a.y, id: 1 }, { x: b.x, y: b.y, id: 2 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

const holdBoth = async (a, b, ms) => {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: a.x, y: a.y, id: 1 }, { x: b.x, y: b.y, id: 2 }],
  });
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

// 현재 퍼즐을 페이지에 노출 (테스트 전용 — 프로덕션 코드는 안 건드린다)
async function exposePuzzle(i) {
  await page.evaluate(async (idx) => {
    const { PUZZLES } = await import('/js/puzzles.js');
    window.__puzzle = PUZZLES[idx];
  }, i);
}

const seamsDrawn = () => page.evaluate(() => window.__peek?.().seams ?? -1);

console.log('── 브라우저 검수 ──');

// ═══ 1. 부팅 ═══
{
  const box = await page.locator('#board').boundingBox();
  ok(box && box.width > 100 && box.height > 100, '캔버스가 화면에 그려짐', JSON.stringify(box));

  // 캔버스가 실제로 뭔가 그렸는가 (전부 투명하면 실패)
  const nonBlank = await page.evaluate(() => {
    const c = document.getElementById('board');
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 8) lit++;
    return lit;
  });
  ok(nonBlank > 50, '캔버스에 실제로 그림이 그려짐', `밝은 픽셀 ${nonBlank}`);
}

// ═══ 2. 스크롤·줌 차단 ═══
{
  const styles = await page.evaluate(() => {
    const b = getComputedStyle(document.body);
    const c = getComputedStyle(document.getElementById('board'));
    return { bodyTouch: b.touchAction, bodyOverflow: b.overflow, canvasTouch: c.touchAction };
  });
  ok(styles.bodyTouch === 'none', 'body touch-action: none', styles.bodyTouch);
  ok(styles.canvasTouch === 'none', 'canvas touch-action: none', styles.canvasTouch);
  ok(styles.bodyOverflow === 'hidden', 'body overflow: hidden', styles.bodyOverflow);

  const vp = await page.evaluate(() =>
    document.querySelector('meta[name=viewport]').getAttribute('content'));
  ok(/user-scalable=no/.test(vp), 'viewport user-scalable=no');

  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => window.scrollY);
  ok(before === after, '휠 스크롤이 페이지를 움직이지 않음', `${before}→${after}`);
}

// ═══ 3. 180° 회전 패널 ═══
{
  const t = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.panel-b')).transform);
  // rotate(180deg) → matrix(-1, 0, 0, -1, 0, 0)
  ok(/matrix\(-1,\s*0,\s*0,\s*-1/.test(t), '위쪽 패널이 180° 회전됨', t);

  const aT = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.panel-a')).transform);
  ok(aT === 'none' || /matrix\(1,\s*0,\s*0,\s*1/.test(aT), '아래쪽 패널은 정방향', aT);
}

// ═══ 4. 보통 납선 단일 탭으로 퍼즐 완성 (p01: 협동 없음) ═══
{
  await exposePuzzle(0);
  const puzzle = await page.evaluate(() => window.__puzzle);
  ok(puzzle.coop.length === 0, 'p01은 협동 조작이 없는 튜토리얼');

  const pts = await seamPoints(puzzle.solution);
  for (const p of pts) { await tap(p); }
  await page.waitForTimeout(200);

  const overlayShown = await page.locator('[data-overlay]').isVisible();
  ok(overlayShown, 'p01 정답 납선을 다 그으면 완성 오버레이가 뜸');

  const sub = await page.locator('[data-overlay-sub]').textContent();
  ok(/1\/18/.test(sub ?? ''), '오버레이에 진행 정보가 표시됨', sub ?? '');
}

// ═══ 4b. "다음 창" 버튼이 실제로 다음 퍼즐을 연다 ═══
{
  await page.locator('[data-next]').click();
  await page.waitForTimeout(250);
  ok(!(await page.locator('[data-overlay]').isVisible()), '다음 창을 열면 오버레이가 닫힘');
  const p = await page.evaluate(() => new URLSearchParams(location.search).get('p'));
  ok(p === '2', '다음 창으로 넘어가면 URL이 갱신됨', String(p));
}

// ═══ 5. 이중납선: 혼자 탭하면 안 되고, 둘이 동시에 눌러야 된다 ═══
{
  await page.goto(`${URL}?p=3`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await exposePuzzle(2);
  const puzzle = await page.evaluate(() => window.__puzzle);
  const dbl = puzzle.coop.find((c) => c.type === 'double');
  ok(!!dbl, 'p03에 이중납선이 있음');

  const [pa, pb] = await seamPoints(dbl.seams);

  // 캔버스에 그려진 협동 납선 픽셀(금색) 개수로 판정한다
  const goldPixels = () => page.evaluate(() => {
    const c = document.getElementById('board');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 13) {
      // 금색(#d4af37) 근처
      if (d[i] > 150 && d[i + 1] > 120 && d[i + 2] < 110 && d[i + 3] > 120) n++;
    }
    return n;
  });

  const base = await goldPixels();

  // 한쪽만 탭 → 그어지면 안 된다
  await tap(pa);
  await page.waitForTimeout(120);
  await tap(pb);            // 250ms 창을 넘겨서 따로 탭
  await page.waitForTimeout(400);
  const afterSolo = await goldPixels();
  ok(afterSolo <= base * 1.6, '이중납선: 따로 탭하면 그어지지 않음', `${base} → ${afterSolo}`);

  // 둘이 동시에 → 그어져야 한다
  await tapBoth(pa, pb);
  await page.waitForTimeout(300);
  const afterBoth = await goldPixels();
  ok(afterBoth > afterSolo * 1.25, '이중납선: 동시에 누르면 그어짐', `${afterSolo} → ${afterBoth}`);
}

// ═══ 6. 긴납선: 양 끝을 동시에 800ms 홀드 ═══
{
  await page.goto(`${URL}?p=5`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await exposePuzzle(4);
  const puzzle = await page.evaluate(() => window.__puzzle);
  const lng = puzzle.coop.find((c) => c.type === 'long');
  ok(!!lng, 'p05에 긴납선이 있음');

  const ends = [lng.seams[0], lng.seams[lng.seams.length - 1]];
  const [ea, eb] = await seamPoints(ends);

  const drawnCount = () => page.evaluate(async (ids) => {
    // 렌더 대신 상태를 직접 못 보므로, 캔버스 금색 픽셀로 근사한다
    const c = document.getElementById('board');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 13) {
      if (d[i] > 150 && d[i + 1] > 120 && d[i + 2] < 110 && d[i + 3] > 120) n++;
    }
    return n;
  }, ends);

  const base = await drawnCount();

  // 짧게 홀드 → 안 된다
  await holdBoth(ea, eb, 300);
  await page.waitForTimeout(500);
  const afterShort = await drawnCount();
  ok(afterShort <= base * 1.6, '긴납선: 300ms 홀드로는 안 그어짐', `${base} → ${afterShort}`);

  // 충분히 홀드 → 그어진다
  await holdBoth(ea, eb, 1100);
  await page.waitForTimeout(300);
  const afterLong = await drawnCount();
  ok(afterLong > afterShort * 1.2, '긴납선: 800ms 이상 홀드하면 그어짐', `${afterShort} → ${afterLong}`);
}

// ═══ 7. pointercancel 이후에도 상태가 멀쩡한가 ═══
{
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: 200, y: 400, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await page.waitForTimeout(200);

  const alive = await page.evaluate(() => {
    const c = document.getElementById('board');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 8) lit++;
    return lit;
  });
  ok(alive > 50, 'pointercancel 후에도 렌더가 계속됨', `밝은 픽셀 ${alive}`);
}

// ═══ 8. 되돌리기 버튼 (양쪽) ═══
{
  const undoCount = await page.locator('[data-undo]').count();
  ok(undoCount === 2, '되돌리기 버튼이 양쪽에 하나씩', `${undoCount}개`);
  await page.locator('.panel-a [data-undo]').click();
  await page.locator('.panel-b [data-undo]').click({ force: true });
  await page.waitForTimeout(150);
  ok(pageErrors.length === 0, '되돌리기 클릭에 에러 없음');
}

// ═══ 9. 콘솔 에러 0건 ═══
{
  ok(pageErrors.length === 0, '페이지 에러 0건', pageErrors.join(' | '));
  ok(consoleErrors.length === 0, '콘솔 에러·경고 0건', consoleErrors.join(' | '));
  ok(badResponses.length === 0, 'HTTP 4xx/5xx 응답 0건', badResponses.join(' | '));
}


await browser.close();

const total = pass + failures.length;
console.log(`\n${'═'.repeat(50)}`);
if (failures.length === 0) {
  console.log(`✅ ${pass}/${total} 브라우저 검수 통과`);
} else {
  console.log(`❌ ${pass}/${total} 통과, ${failures.length}개 실패\n`);
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exit(1);
}
