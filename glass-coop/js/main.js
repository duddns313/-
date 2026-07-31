// main.js — 진입점. 상태·입력·렌더를 잇는다.

import { PUZZLES } from './puzzles.js';
import { createState, applyIntent, checkComplete } from './puzzle.js';
import { setupCanvas, draw, GLASS, SIZE_ORDER } from './render.js';
import { createInput } from './input.js';

const canvas = document.getElementById('board');
const overlay = document.querySelector('[data-overlay]');
const overlaySub = document.querySelector('[data-overlay-sub]');
const nextBtn = document.querySelector('[data-next]');
const progressEls = [...document.querySelectorAll('[data-progress]')];
const coopEls = [...document.querySelectorAll('[data-coop]')];
const legendEls = [...document.querySelectorAll('[data-legend]')];
const undoBtns = [...document.querySelectorAll('[data-undo]')];

const COOP_LABEL = {
  double: '이중납선 · 동시에 탭',
  long:   '긴납선 · 양 끝 함께 누르기',
  lock:   '잠긴 영역 · 한 명이 잡아주기',
};

let index = 0;
let state = createState(PUZZLES[0]);
let ctx = setupCanvas(canvas);
let complete = false;

const input = createInput(canvas, () => state, (intent) => {
  if (complete) return;
  applyIntent(state, intent);
  refresh();
});

function refresh() {
  const res = checkComplete(state);
  const done = res.regions.filter((cells, rid) => {
    const seeds = res.seedsIn[rid];
    return seeds.length === 1 && !res.issues.some((i) => i.region === rid);
  }).length;

  const label = `${done} / ${state.puzzle.seeds.length}`;
  progressEls.forEach((el) => { el.textContent = label; });

  // 색 = 크기 범례. 이 판에 실제로 나오는 크기만 보여준다 (안 나오는 색은 소음)
  const usedSizes = [...new Set(state.puzzle.seeds.map((s) => s.size))].sort((a, b) => a - b);
  const legend = usedSizes.map((n) => {
    const color = GLASS[SIZE_ORDER[n - 2]] ?? '#888';
    return `<span class="legend-item"><span class="legend-dot" style="background:${color}"></span>${n}</span>`;
  });
  legendEls.forEach((el) => { el.innerHTML = legend.join(''); });

  // 남은 협동 조작 — 둘이 뭘 더 같이 해야 하는지 양쪽에 똑같이 보여준다
  const chips = state.puzzle.coop.map((c) => {
    const finished = c.seams.every((s) => state.seams.has(s));
    return `<span class="chip ${finished ? 'done' : 'todo'}">${COOP_LABEL[c.type] ?? c.type}</span>`;
  });
  coopEls.forEach((el) => { el.innerHTML = chips.join(''); });

  if (res.complete && !complete) {
    complete = true;
    overlaySub.textContent =
      `${state.puzzle.tier} · ${state.puzzle.size}×${state.puzzle.size} · ${index + 1}/${PUZZLES.length}`;
    overlay.hidden = false;
    nextBtn.textContent = index + 1 < PUZZLES.length ? '다음 창 →' : '처음부터';
  }
}

function loadPuzzle(i, { updateUrl = true } = {}) {
  index = ((i % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  state = createState(PUZZLES[index]);
  complete = false;
  overlay.hidden = true;
  input.reset();
  refresh();
  // ?p=3 으로 특정 창을 바로 열 수 있다 (이어서 하기 · 검수 양쪽에 쓴다)
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('p', String(index + 1));
    history.replaceState(null, '', url);
  }
}

/** 시작 퍼즐: ?p=N (1부터). 범위를 벗어나면 1번. */
function startIndex() {
  const raw = Number(new URLSearchParams(location.search).get('p'));
  return Number.isInteger(raw) && raw >= 1 && raw <= PUZZLES.length ? raw - 1 : 0;
}

nextBtn.addEventListener('click', () => loadPuzzle(index + 1));

undoBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (complete) return;
    applyIntent(state, { type: 'undo' });
    refresh();
  });
});

// 화면 크기가 바뀌면 캔버스 백버퍼를 다시 잡는다
const resize = () => { ctx = setupCanvas(canvas); };
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

function frame() {
  input.tick();
  if (complete) input.anim.winT = Math.min(1, input.anim.winT + 0.03);
  draw(ctx, canvas, state, input.anim);
  requestAnimationFrame(frame);
}

resize();
loadPuzzle(startIndex(), { updateUrl: false });
requestAnimationFrame(frame);

// 오프라인 플레이 (file:// 로 열었을 땐 등록하지 않는다)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 오프라인 지원만 빠진다 */ });
  });
}
