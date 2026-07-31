// genpuzzles.js — 퍼즐 생성 + 유일해 검증 (개발 도구, 게임 번들에는 미포함)
//
// 파이프라인:
//   1. 격자를 랜덤 직사각형들로 재귀 분할
//   2. 완전탐색으로 해가 정확히 1개인지 검증  ← 통과 못하면 버린다
//   3. 협동 조작(A/B/C)을 해답 납선 위에 배치 (거리 조건 만족하는 것만)
//   4. 정적 데이터로 js/puzzles.js에 기록
//
// 런타임에는 생성기가 없다. 게임에는 검증을 통과한 결과물만 실린다.
//
// 실행: node scripts/genpuzzles.js

import {
  countSolutions, seamsFromOwner, describeSeam, vSeamId, hSeamId, cellIndex,
} from '../js/puzzle.js';
import { writeFileSync } from 'node:fs';

// 색은 정보가 아니라 장식이다 — 영역의 수는 pip(주사위 눈)으로 표시하므로
// 색이 몇 종이든 퍼즐을 읽는 데 지장이 없다.
const COLORS = ['azure', 'crimson', 'amber', 'jade', 'violet', 'rose', 'teal', 'gold'];

// 협동 조작의 두 접점은 격자 대각선의 35% 이상 떨어져야 한다.
// (혼자 두 손으로 하는 걸 물리적으로 막기 위한 조건)
const MIN_SPAN_RATIO = 0.35;

// 영역 넓이 상한. pip 패턴으로 표시 가능한 범위(2~9)로 묶는다.
const MAX_AREA = 9;

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ─── 1단계: 랜덤 직사각형 분할 ───
function splitRects(size, rng) {
  const rects = [];
  (function rec(r0, c0, h, w) {
    const area = h * w;
    const canV = w >= 2, canH = h >= 2;
    if (!canV && !canH) { rects.push({ r0, c0, h, w }); return; }
    // 넓이가 상한 이하로 내려왔으면 확률적으로 멈춘다
    if (area <= MAX_AREA && (area <= 3 || rng() < 0.4)) { rects.push({ r0, c0, h, w }); return; }
    if (canV && (!canH || rng() < 0.5)) {
      const cut = 1 + Math.floor(rng() * (w - 1));
      rec(r0, c0, h, cut); rec(r0, c0 + cut, h, w - cut);
    } else {
      const cut = 1 + Math.floor(rng() * (h - 1));
      rec(r0, c0, cut, w); rec(r0 + cut, c0, h - cut, w);
    }
  })(0, 0, size, size);
  return rects;
}

function ownerFromRects(size, rects) {
  const owner = new Int32Array(size * size).fill(-1);
  rects.forEach((R, i) => {
    for (let r = R.r0; r < R.r0 + R.h; r++) {
      for (let c = R.c0; c < R.c0 + R.w; c++) owner[cellIndex(size, r, c)] = i;
    }
  });
  return owner;
}

// ─── 납선 기하 (거리 조건 계산용) ───
function seamMid(size, id) {
  const s = describeSeam(size, id);
  return s.dir === 'v' ? { x: s.c + 1, y: s.r + 0.5 } : { x: s.c + 0.5, y: s.r + 1 };
}

function seamEnds(size, id) {
  const s = describeSeam(size, id);
  return s.dir === 'v'
    ? [{ x: s.c + 1, y: s.r }, { x: s.c + 1, y: s.r + 1 }]
    : [{ x: s.c, y: s.r + 1 }, { x: s.c + 1, y: s.r + 1 }];
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cellCenter = (size, i) => ({ x: (i % size) + 0.5, y: Math.floor(i / size) + 0.5 });

// ─── 3단계: 협동 조작 배치 ───
//
// A 이중납선: 서로 멀리 떨어진 두 해답 납선을 묶어 "동시에 그어야" 하게 만든다.
//             (한 선분의 양 끝은 1칸 거리라 혼자서도 닿으므로 앵커로 못 쓴다)
// B 긴납선:   일직선으로 연속된 해답 납선, 양 끝을 동시에 홀드
// C 잠긴영역: 색점을 잡고 있어야 그 영역 납선이 열림

function collinearRuns(size, solution) {
  const set = new Set(solution);
  const runs = [];

  for (let c = 0; c <= size - 2; c++) {
    let run = [];
    for (let r = 0; r < size; r++) {
      const id = vSeamId(size, r, c);
      if (set.has(id)) run.push(id);
      else { if (run.length >= 3) runs.push(run); run = []; }
    }
    if (run.length >= 3) runs.push(run);
  }
  for (let r = 0; r <= size - 2; r++) {
    let run = [];
    for (let c = 0; c < size; c++) {
      const id = hSeamId(size, r, c);
      if (set.has(id)) run.push(id);
      else { if (run.length >= 3) runs.push(run); run = []; }
    }
    if (run.length >= 3) runs.push(run);
  }
  return runs;
}

function placeCoop(size, seeds, solution, want) {
  const minSpan = Math.hypot(size, size) * MIN_SPAN_RATIO;
  const used = new Set();
  const coop = [];

  // ── B: 긴납선 ──
  if (want.long > 0) {
    const runs = collinearRuns(size, solution)
      .filter((run) => {
        const a = seamEnds(size, run[0])[0];
        const b = seamEnds(size, run[run.length - 1])[1];
        return dist(a, b) >= minSpan;
      })
      .sort((a, b) => b.length - a.length);

    for (const run of runs) {
      if (coop.filter((c) => c.type === 'long').length >= want.long) break;
      if (run.some((id) => used.has(id))) continue;
      run.forEach((id) => used.add(id));
      coop.push({ type: 'long', seams: run, holdMs: 800 });
    }
  }

  // ── A: 이중납선 ──
  if (want.double > 0) {
    let placed = 0;
    const free = solution.filter((id) => !used.has(id));
    for (let i = 0; i < free.length && placed < want.double; i++) {
      if (used.has(free[i])) continue;
      for (let j = i + 1; j < free.length; j++) {
        if (used.has(free[j])) continue;
        if (dist(seamMid(size, free[i]), seamMid(size, free[j])) < minSpan) continue;
        used.add(free[i]); used.add(free[j]);
        coop.push({ type: 'double', seams: [free[i], free[j]], windowMs: 250 });
        placed++;
        break;
      }
    }
  }

  // ── C: 잠긴영역 ──
  if (want.lock > 0) {
    let placed = 0;
    for (let sIdx = 0; sIdx < seeds.length && placed < want.lock; sIdx++) {
      const center = cellCenter(size, seeds[sIdx].cell);
      const far = solution.filter(
        (id) => !used.has(id) && dist(seamMid(size, id), center) >= minSpan,
      );
      if (far.length === 0) continue;
      const chosen = far.slice(0, Math.min(3, far.length));
      chosen.forEach((id) => used.add(id));
      coop.push({ type: 'lock', seed: sIdx, seams: chosen });
      placed++;
    }
  }

  return coop;
}

// ─── 조립 ───
function buildPuzzle(id, stage, rng) {
  const { size, want, regionRange } = stage;

  const rects = splitRects(size, rng);
  if (rects.length < regionRange[0] || rects.length > regionRange[1]) return null;
  if (rects.some((R) => R.h * R.w < 2 || R.h * R.w > MAX_AREA)) return null;

  // 각 직사각형 안의 임의 칸에 색점을 놓는다
  const seeds = rects.map((R, i) => ({
    cell: cellIndex(size, R.r0 + Math.floor(rng() * R.h), R.c0 + Math.floor(rng() * R.w)),
    color: COLORS[i % COLORS.length],
    size: R.h * R.w,
  }));

  const puzzle = { id, size, tier: stage.tier, seeds, coop: [], solution: [] };

  // ★ 유일해 검증 — 여기서 떨어지면 버린다
  if (countSolutions(puzzle, 2).count !== 1) return null;

  puzzle.solution = [...seamsFromOwner(size, ownerFromRects(size, rects))].sort((a, b) => a - b);
  puzzle.coop = placeCoop(size, seeds, puzzle.solution, want);

  // 요청한 협동 조작이 다 안 들어갔으면 협동 필수 조건을 못 채운 퍼즐이다
  const got = {
    double: puzzle.coop.filter((c) => c.type === 'double').length,
    long: puzzle.coop.filter((c) => c.type === 'long').length,
    lock: puzzle.coop.filter((c) => c.type === 'lock').length,
  };
  if (got.double < want.double || got.long < want.long || got.lock < want.lock) return null;

  return puzzle;
}

// ─── 난이도 곡선 (측정된 유일해 분포에 맞춰 조정) ───
const PLAN = [
  { count: 2, size: 4, regionRange: [4, 5],   want: { double: 0, long: 0, lock: 0 }, tier: '튜토리얼' },
  { count: 2, size: 4, regionRange: [4, 6],   want: { double: 1, long: 0, lock: 0 }, tier: '튜토리얼' },
  { count: 4, size: 5, regionRange: [5, 8],   want: { double: 1, long: 1, lock: 0 }, tier: '쉬움' },
  { count: 6, size: 6, regionRange: [8, 12],  want: { double: 1, long: 1, lock: 1 }, tier: '보통' },
  { count: 4, size: 7, regionRange: [10, 15], want: { double: 2, long: 1, lock: 1 }, tier: '어려움' },
];

function main() {
  const rng = makeRng(20260731);
  const puzzles = [];
  let attempts = 0;

  for (const stage of PLAN) {
    let made = 0;
    while (made < stage.count) {
      if (++attempts > 3000000) {
        console.error(`생성 실패: ${stage.tier} ${stage.size}x${stage.size} — 시도 한계 초과`);
        process.exit(1);
      }
      const id = `p${String(puzzles.length + 1).padStart(2, '0')}`;
      const p = buildPuzzle(id, stage, rng);
      if (!p) continue;
      puzzles.push(p);
      made++;
      const c = p.coop.reduce((a, x) => ({ ...a, [x.type]: (a[x.type] ?? 0) + 1 }), {});
      console.log(
        `✓ ${id} ${p.tier} ${stage.size}x${stage.size} 영역${p.seeds.length} ` +
        `납선${p.solution.length} 협동[double=${c.double ?? 0} long=${c.long ?? 0} lock=${c.lock ?? 0}]`,
      );
    }
  }

  const out =
    `// 자동 생성 파일 — scripts/genpuzzles.js가 만들고 유일해 검증을 통과한 퍼즐들.\n` +
    `// 직접 수정하지 말 것. 다시 만들려면: node scripts/genpuzzles.js\n\n` +
    `export const PUZZLES = ${JSON.stringify(puzzles)};\n`;

  writeFileSync(new URL('../js/puzzles.js', import.meta.url), out);
  console.log(`\n${puzzles.length}판 생성 완료 (시도 ${attempts}회) → js/puzzles.js`);
}

main();
