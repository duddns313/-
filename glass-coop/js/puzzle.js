// puzzle.js — 순수 퍼즐 로직.
// 브라우저 API(DOM·Canvas·Pointer)를 일절 참조하지 않는다.
// 덕분에 Node에서 브라우저 없이 그대로 테스트되고, 나중에 intent를
// 네트워크로 실어 보내면 이 파일을 안 고치고 원격 협동이 된다.
//
// 규칙 (직사각형 분할 — Shikaku 계열):
//   ① 모든 영역은 색점을 정확히 1개 포함한다
//   ② 영역의 칸 수 = 색점에 표시된 수
//   ③ 모든 영역은 직사각형이다
//
// ③이 없으면 해가 유일하지 않다. 랜덤 분할 3000개를 검증했을 때 유일해가
// 0개였고, 직사각형 제약을 넣자 4x4 28% / 7x7 4.6%로 올라갔다.

// ─────────────────────────────────────────────────────────────
// 납선(seam) 인덱싱
//
// 세로 납선: 셀 (r,c)와 (r,c+1) 사이.  c ∈ [0, size-2]  → id = r*(size-1) + c
// 가로 납선: 셀 (r,c)와 (r+1,c) 사이.  r ∈ [0, size-2]  → id = size*(size-1) + r*size + c
// ─────────────────────────────────────────────────────────────

export function seamCount(size) {
  return 2 * size * (size - 1);
}

export function vSeamId(size, r, c) {
  return r * (size - 1) + c;
}

export function hSeamId(size, r, c) {
  return size * (size - 1) + r * size + c;
}

/** 납선 id를 좌표로. 렌더·디버그용. */
export function describeSeam(size, id) {
  const vCount = size * (size - 1);
  if (id < vCount) {
    return { dir: 'v', r: Math.floor(id / (size - 1)), c: id % (size - 1) };
  }
  const rest = id - vCount;
  return { dir: 'h', r: Math.floor(rest / size), c: rest % size };
}

export const cellIndex = (size, r, c) => r * size + c;
export const cellRow = (size, i) => Math.floor(i / size);
export const cellCol = (size, i) => i % size;

/** 인접한 두 셀 사이의 납선 id. 인접하지 않으면 -1. */
export function seamBetween(size, a, b) {
  const ar = cellRow(size, a), ac = cellCol(size, a);
  const br = cellRow(size, b), bc = cellCol(size, b);
  if (ar === br && Math.abs(ac - bc) === 1) return vSeamId(size, ar, Math.min(ac, bc));
  if (ac === bc && Math.abs(ar - br) === 1) return hSeamId(size, Math.min(ar, br), ac);
  return -1;
}

/** 셀의 상하좌우 이웃 (격자 밖은 제외). */
export function neighbors(size, i) {
  const r = cellRow(size, i), c = cellCol(size, i);
  const out = [];
  if (r > 0) out.push(cellIndex(size, r - 1, c));
  if (r < size - 1) out.push(cellIndex(size, r + 1, c));
  if (c > 0) out.push(cellIndex(size, r, c - 1));
  if (c < size - 1) out.push(cellIndex(size, r, c + 1));
  return out;
}

// ─────────────────────────────────────────────────────────────
// 상태
// ─────────────────────────────────────────────────────────────

/**
 * puzzle = {
 *   id, size, tier,
 *   seeds:    [{ cell, color, size }],     // size = 영역 칸 수 (2..9, pip으로 표시)
 *   coop:     [{ type:'double', seams:[a,b], windowMs }
 *             |{ type:'long',   seams:[...], holdMs }
 *             |{ type:'lock',   seed: idx, seams:[...] }],
 *   solution: [seamId, ...]
 * }
 */
export function createState(puzzle) {
  return {
    puzzle,
    seams: new Set(),
    history: [],
  };
}

/** 이 납선이 묶인 협동 조작. 안 묶였으면 null. */
export function coopFor(puzzle, seamId) {
  for (const c of puzzle.coop ?? []) {
    if (c.seams.includes(seamId)) return c;
  }
  return null;
}

/**
 * 규칙상 이 납선을 지금 토글할 수 있는가.
 *
 * 물리적 동시성(거리·타이밍) 판정은 input.js가 하고, 여기서는 "규칙상
 * 허용되는가"만 본다 — 그래야 headless로 검증할 수 있다.
 *
 * ctx = { partners, holdMs, heldSeeds:Set, byPointer, seedHeldBy:Map }
 */
export function canToggle(puzzle, seamId, ctx = {}) {
  const coop = coopFor(puzzle, seamId);
  if (!coop) return { ok: true };

  const partners = ctx.partners ?? 1;

  if (coop.type === 'double') {
    if (partners < 2) return { ok: false, reason: 'need-two-pointers' };
    return { ok: true };
  }

  if (coop.type === 'long') {
    if (partners < 2) return { ok: false, reason: 'need-two-pointers' };
    if ((ctx.holdMs ?? 0) < (coop.holdMs ?? 800)) return { ok: false, reason: 'hold-too-short' };
    return { ok: true };
  }

  if (coop.type === 'lock') {
    const held = ctx.heldSeeds ?? new Set();
    if (!held.has(coop.seed)) return { ok: false, reason: 'region-locked' };
    // 색점을 잡은 손가락으로는 편집할 수 없다 — 반드시 상대가 조작해야 한다.
    const holder = ctx.seedHeldBy?.get(coop.seed);
    if (holder !== undefined && holder === ctx.byPointer) {
      return { ok: false, reason: 'holder-cannot-edit' };
    }
    return { ok: true };
  }

  return { ok: true };
}

/** intent를 적용한다. 허용되지 않으면 상태를 그대로 두고 rejected를 돌려준다. */
export function applyIntent(state, intent) {
  if (intent.type === 'toggleSeam') {
    const check = canToggle(state.puzzle, intent.seam, intent.ctx);
    if (!check.ok) return { state, rejected: check.reason };

    state.history.push(new Set(state.seams));
    if (state.seams.has(intent.seam)) state.seams.delete(intent.seam);
    else state.seams.add(intent.seam);
    return { state, rejected: null };
  }

  if (intent.type === 'toggleGroup') {
    // 이중납선처럼 여러 납선이 한 번에 그어지는 경우
    const check = canToggle(state.puzzle, intent.seams[0], intent.ctx);
    if (!check.ok) return { state, rejected: check.reason };

    state.history.push(new Set(state.seams));
    const allOn = intent.seams.every((s) => state.seams.has(s));
    for (const s of intent.seams) {
      if (allOn) state.seams.delete(s);
      else state.seams.add(s);
    }
    return { state, rejected: null };
  }

  if (intent.type === 'undo') {
    if (state.history.length === 0) return { state, rejected: 'nothing-to-undo' };
    state.seams = state.history.pop();
    return { state, rejected: null };
  }

  if (intent.type === 'reset') {
    state.history.push(new Set(state.seams));
    state.seams = new Set();
    return { state, rejected: null };
  }

  return { state, rejected: 'unknown-intent' };
}

// ─────────────────────────────────────────────────────────────
// 영역 계산 · 완성 판정
// ─────────────────────────────────────────────────────────────

/** 현재 납선 배치로 격자를 영역들로 나눈다 (flood fill). */
export function computeRegions(size, seams) {
  const total = size * size;
  const regionOf = new Int32Array(total).fill(-1);
  const regions = [];

  for (let start = 0; start < total; start++) {
    if (regionOf[start] !== -1) continue;
    const id = regions.length;
    const cells = [];
    const stack = [start];
    regionOf[start] = id;

    while (stack.length) {
      const cur = stack.pop();
      cells.push(cur);
      for (const nb of neighbors(size, cur)) {
        if (regionOf[nb] !== -1) continue;
        if (seams.has(seamBetween(size, cur, nb))) continue; // 납선이 막고 있음
        regionOf[nb] = id;
        stack.push(nb);
      }
    }
    regions.push(cells);
  }

  return { regionOf, regions };
}

/** 이 셀 묶음이 빈틈 없는 직사각형인가. */
export function isRectangle(size, cells) {
  let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
  for (const i of cells) {
    const r = cellRow(size, i), c = cellCol(size, i);
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  return (maxR - minR + 1) * (maxC - minC + 1) === cells.length;
}

/**
 * 완성 판정. 규칙 3개를 전부 검사하고 어긴 항목을 함께 돌려준다.
 *   ① 모든 영역은 색점을 정확히 1개 포함
 *   ② 영역 칸 수 = 색점의 수
 *   ③ 모든 영역은 직사각형
 */
export function checkComplete(state) {
  const { size, seeds } = state.puzzle;
  const { regionOf, regions } = computeRegions(size, state.seams);

  const seedsIn = regions.map(() => []);
  seeds.forEach((seed, idx) => {
    seedsIn[regionOf[seed.cell]].push(idx);
  });

  const issues = [];
  regions.forEach((cells, rid) => {
    const inside = seedsIn[rid];
    if (inside.length === 0) {
      issues.push({ region: rid, rule: 1, kind: 'no-seed' });
    } else if (inside.length > 1) {
      issues.push({ region: rid, rule: 1, kind: 'multi-seed', seeds: inside });
    } else if (cells.length !== seeds[inside[0]].size) {
      issues.push({
        region: rid, rule: 2, kind: 'wrong-size',
        seed: inside[0], expected: seeds[inside[0]].size, actual: cells.length,
      });
    } else if (!isRectangle(size, cells)) {
      issues.push({ region: rid, rule: 3, kind: 'not-rectangle', seed: inside[0] });
    }
  });

  return {
    complete: issues.length === 0,
    regions,
    regionOf,
    seedsIn,
    issues,
    solvedRegions: regions.length - issues.length,
    totalRegions: seeds.length,
  };
}

// ─────────────────────────────────────────────────────────────
// 해 탐색 (유일해 검증 — 개발 도구와 테스트에서 쓴다)
// ─────────────────────────────────────────────────────────────

/** 이 셀을 포함하고 넓이가 area인 모든 직사각형. */
export function rectsFor(size, cell, area) {
  const r = cellRow(size, cell), c = cellCol(size, cell);
  const out = [];
  for (let h = 1; h <= area; h++) {
    if (area % h) continue;
    const w = area / h;
    if (h > size || w > size) continue;
    for (let r0 = Math.max(0, r - h + 1); r0 <= Math.min(r, size - h); r0++) {
      for (let c0 = Math.max(0, c - w + 1); c0 <= Math.min(c, size - w); c0++) {
        out.push({ r0, c0, h, w });
      }
    }
  }
  return out;
}

/**
 * 해가 몇 개인지 센다. limit개를 찾으면 즉시 멈춘다.
 * 유일해 확인은 limit=2로 부르고 결과가 1인지 보면 된다.
 *
 * 후보 직사각형이 적은 색점부터 배치하면 가지치기가 빨리 걸린다.
 */
export function countSolutions(puzzle, limit = 2) {
  const { size, seeds } = puzzle;
  const total = size * size;
  const owner = new Int32Array(total).fill(-1);
  const solutions = [];

  const cands = seeds.map((s) => rectsFor(size, s.cell, s.size));
  const order = seeds.map((_, i) => i).sort((a, b) => cands[a].length - cands[b].length);

  function place(k) {
    if (solutions.length >= limit) return;
    if (k === order.length) {
      for (let i = 0; i < total; i++) if (owner[i] === -1) return;
      solutions.push(Int32Array.from(owner));
      return;
    }
    const idx = order[k];
    for (const R of cands[idx]) {
      let free = true;
      for (let r = R.r0; r < R.r0 + R.h && free; r++) {
        for (let c = R.c0; c < R.c0 + R.w; c++) {
          if (owner[r * size + c] !== -1) { free = false; break; }
        }
      }
      if (!free) continue;

      for (let r = R.r0; r < R.r0 + R.h; r++) {
        for (let c = R.c0; c < R.c0 + R.w; c++) owner[r * size + c] = idx;
      }
      place(k + 1);
      for (let r = R.r0; r < R.r0 + R.h; r++) {
        for (let c = R.c0; c < R.c0 + R.w; c++) owner[r * size + c] = -1;
      }
      if (solutions.length >= limit) return;
    }
  }

  place(0);
  return { count: solutions.length, solutions };
}

/** 셀 소유권 배열로부터 정답 납선 집합을 만든다. */
export function seamsFromOwner(size, owner) {
  const seams = new Set();
  for (let i = 0; i < size * size; i++) {
    for (const nb of neighbors(size, i)) {
      if (nb > i && owner[nb] !== owner[i]) seams.add(seamBetween(size, i, nb));
    }
  }
  return seams;
}
