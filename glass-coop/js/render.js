// render.js — Canvas 2D 그리기.
// 퍼즐 로직은 건드리지 않는다. 상태를 읽어서 그리기만 한다.

import { describeSeam, cellRow, cellCol, computeRegions, isRectangle } from './puzzle.js';

// ★ 색이 곧 크기다 (2→6). 보라·파랑·초록·호박·진홍 순의 스펙트럼이라
// 몇 판만 하면 "이 색은 몇" 이 몸에 붙는다. 같은 색이 반복되며 창에 리듬이 생긴다.
export const GLASS = {
  violet:  '#8f6fd8',   // 2
  azure:   '#4a9eda',   // 3
  jade:    '#3fb08a',   // 4
  amber:   '#e8a33d',   // 5
  crimson: '#d9455f',   // 6
};

export const SIZE_ORDER = ['violet', 'azure', 'jade', 'amber', 'crimson'];

const LEAD = '#7d8593';        // 보통 납선
const LEAD_COOP = '#d4af37';   // 협동 납선 (금색)
const LEAD_GHOST = '#2b3140';  // 아직 안 그은 자리

// ── 구슬 링 ──
// 크기만큼의 구슬을 원 둘레에 고르게 박는다 (보석 세팅처럼).
// 회전해도 읽히는 이유는 대칭이 아니라 "센다"는 행위가 방향과 무관하기 때문 —
// 그래서 주사위 눈 배치를 쓸 필요가 없고, 링이 훨씬 보기 좋다.
function beadRing(n) {
  const out = [];
  const start = -Math.PI / 2;                    // 12시 방향부터
  for (let i = 0; i < n; i++) {
    const a = start + (i * 2 * Math.PI) / n;
    out.push([Math.cos(a), Math.sin(a)]);
  }
  return out;
}

/** 격자 ↔ 화면 좌표 변환 정보. 입력 판정도 같은 값을 쓴다. */
export function computeView(canvas, size) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const pad = Math.min(w, h) * 0.06;
  const board = Math.min(w, h) - pad * 2;
  const cell = board / size;
  return {
    cell,
    ox: (w - board) / 2,
    oy: (h - board) / 2,
    board,
    toScreen: (gx, gy) => ({ x: (w - board) / 2 + gx * cell, y: (h - board) / 2 + gy * cell }),
    toGrid: (px, py) => ({ gx: (px - (w - board) / 2) / cell, gy: (py - (h - board) / 2) / cell }),
  };
}

export function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** 납선 id → 화면상의 선분 양 끝점 */
export function seamSegment(view, size, id) {
  const s = describeSeam(size, id);
  return s.dir === 'v'
    ? [view.toScreen(s.c + 1, s.r), view.toScreen(s.c + 1, s.r + 1)]
    : [view.toScreen(s.c, s.r + 1), view.toScreen(s.c + 1, s.r + 1)];
}

export function seamMidpoint(view, size, id) {
  const [a, b] = seamSegment(view, size, id);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function seedCenter(view, size, cell) {
  return view.toScreen(cellCol(size, cell) + 0.5, cellRow(size, cell) + 0.5);
}

/**
 * anim = {
 *   pending: Set<seamId>,          // 짝을 기다리는 협동 납선
 *   gauge:   Map<coopIndex, 0..1>, // 긴납선 홀드 진행도
 *   unlocked:Set<seedIdx>,         // 지금 잡혀서 열린 영역
 *   winT:    0..1,                 // 완성 연출 진행도
 * }
 */
export function draw(ctx, canvas, state, anim) {
  const { puzzle } = state;
  const size = puzzle.size;
  const view = computeView(canvas, size);
  const W = canvas.clientWidth, H = canvas.clientHeight;

  ctx.clearRect(0, 0, W, H);

  const status = computeRegions(size, state.seams);
  const seedOfRegion = new Map();
  puzzle.seeds.forEach((s, i) => {
    const rid = status.regionOf[s.cell];
    if (!seedOfRegion.has(rid)) seedOfRegion.set(rid, []);
    seedOfRegion.get(rid).push(i);
  });

  // ── 유리 칸 채우기 ──
  // 규칙을 다 만족한 영역만 색이 진하게 들어온다 → 진행 상황이 눈으로 보인다
  status.regions.forEach((cells, rid) => {
    const seeds = seedOfRegion.get(rid) ?? [];
    const solved =
      seeds.length === 1 &&
      cells.length === puzzle.seeds[seeds[0]].size &&
      isRectangle(size, cells);
    const color = seeds.length === 1 ? (GLASS[puzzle.seeds[seeds[0]].color] ?? '#5a6c7a') : null;

    for (const i of cells) {
      const p = view.toScreen(cellCol(size, i), cellRow(size, i));
      if (solved && color) {
        const g = ctx.createLinearGradient(p.x, p.y, p.x + view.cell, p.y + view.cell);
        g.addColorStop(0, hexA(color, 0.55 + 0.25 * (anim.winT ?? 0)));
        g.addColorStop(1, hexA(color, 0.28 + 0.2 * (anim.winT ?? 0)));
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.028)';
      }
      ctx.fillRect(p.x, p.y, view.cell, view.cell);
    }
  });

  // ── 격자 보조선 (아주 흐리게) ──
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i++) {
    const a = view.toScreen(i, 0), b = view.toScreen(i, size);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const c = view.toScreen(0, i), d = view.toScreen(size, i);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
  }

  // ── 협동 납선의 "아직 안 그은 자리" 표시 ──
  // 어디에 협동이 필요한지 미리 보여야 둘이 계획을 세울 수 있다
  for (const coop of puzzle.coop) {
    for (const id of coop.seams) {
      if (state.seams.has(id)) continue;
      const [a, b] = seamSegment(view, size, id);
      ctx.strokeStyle = LEAD_GHOST;
      ctx.lineWidth = Math.max(3, view.cell * 0.09);
      ctx.lineCap = 'round';
      ctx.setLineDash([view.cell * 0.13, view.cell * 0.13]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── 그어진 납선 ──
  const coopSeams = new Set(puzzle.coop.flatMap((c) => c.seams));
  for (const id of state.seams) {
    const [a, b] = seamSegment(view, size, id);
    const isCoop = coopSeams.has(id);
    ctx.strokeStyle = isCoop ? LEAD_COOP : LEAD;
    ctx.lineWidth = Math.max(3, view.cell * (isCoop ? 0.13 : 0.1));
    ctx.lineCap = 'round';
    if (isCoop) {
      ctx.shadowColor = hexA(LEAD_COOP, 0.6);
      ctx.shadowBlur = view.cell * 0.25;
    }
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── 이중납선: 짝을 기다리는 중이면 맥동 + 상대 앵커 가리키기 ──
  const t = performance.now() / 1000;
  for (const coop of puzzle.coop) {
    if (coop.type !== 'double') continue;
    const waiting = coop.seams.filter((s) => anim.pending?.has(s));
    if (waiting.length === 0) continue;

    const pulse = 0.55 + 0.45 * Math.sin(t * 7);
    for (const id of coop.seams) {
      const m = seamMidpoint(view, size, id);
      const isWaiting = anim.pending.has(id);
      ctx.beginPath();
      ctx.arc(m.x, m.y, view.cell * (isWaiting ? 0.3 : 0.24) * (isWaiting ? pulse * 0.5 + 0.75 : 1), 0, Math.PI * 2);
      ctx.strokeStyle = hexA(LEAD_COOP, isWaiting ? 0.95 : 0.4 + 0.4 * pulse);
      ctx.lineWidth = Math.max(2, view.cell * 0.05);
      ctx.stroke();
    }
    // 두 앵커를 잇는 안내선
    const m0 = seamMidpoint(view, size, coop.seams[0]);
    const m1 = seamMidpoint(view, size, coop.seams[1]);
    ctx.strokeStyle = hexA(LEAD_COOP, 0.16 + 0.14 * pulse);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── 긴납선: 홀드 게이지가 선을 따라 차오른다 ──
  puzzle.coop.forEach((coop, ci) => {
    if (coop.type !== 'long') return;
    const g = anim.gauge?.get(ci) ?? 0;
    if (g <= 0) return;
    const segs = coop.seams.map((id) => seamSegment(view, size, id));
    const total = coop.seams.length;
    const filled = g * total;
    segs.forEach(([a, b], i) => {
      const amt = Math.max(0, Math.min(1, filled - i));
      if (amt <= 0) return;
      ctx.strokeStyle = LEAD_COOP;
      ctx.lineWidth = Math.max(4, view.cell * 0.15);
      ctx.lineCap = 'round';
      ctx.shadowColor = hexA(LEAD_COOP, 0.8);
      ctx.shadowBlur = view.cell * 0.3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + (b.x - a.x) * amt, a.y + (b.y - a.y) * amt);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  });

  // ── 색점 (색 원 + pip) ──
  puzzle.seeds.forEach((seed, idx) => {
    const c = seedCenter(view, size, seed.cell);
    const r = view.cell * 0.36;
    const color = GLASS[seed.color] ?? '#9aa';
    const lockCoop = puzzle.coop.find((k) => k.type === 'lock' && k.seed === idx);
    const unlocked = anim.unlocked?.has(idx);

    // 원판
    const g = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.1, c.x, c.y, r);
    g.addColorStop(0, hexA(color, 0.98));
    g.addColorStop(1, hexA(color, 0.72));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();

    // 잠긴 영역이면 테두리로 표시 (잡히면 밝게 열린다)
    if (lockCoop) {
      const pulse = unlocked ? 1 : 0.5 + 0.5 * Math.sin(t * 3);
      ctx.strokeStyle = hexA(LEAD_COOP, unlocked ? 1 : 0.45 + 0.35 * pulse);
      ctx.lineWidth = Math.max(2.5, view.cell * 0.07);
      ctx.setLineDash(unlocked ? [] : [view.cell * 0.1, view.cell * 0.08]);
      ctx.beginPath(); ctx.arc(c.x, c.y, r + view.cell * 0.08, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 구슬 링 — 개수가 곧 영역의 칸 수. 세는 행위라 방향과 무관하다.
    const beads = beadRing(seed.size);
    const br = r * 0.615;                 // 링 반지름
    const bead = r * 0.145;               // 구슬 반지름
    for (const [px, py] of beads) {
      const bx = c.x + px * br, by = c.y + py * br;
      // 살짝 파인 자리 (구슬이 유리에 박힌 느낌)
      ctx.beginPath();
      ctx.arc(bx, by, bead * 1.32, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8,11,17,0.34)';
      ctx.fill();

      const bg = ctx.createRadialGradient(bx - bead * 0.35, by - bead * 0.4, bead * 0.1, bx, by, bead);
      bg.addColorStop(0, 'rgba(255,252,244,0.96)');
      bg.addColorStop(1, 'rgba(214,196,150,0.82)');
      ctx.beginPath();
      ctx.arc(bx, by, bead, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
    }
  });

  return { view, status };
}

/** #rrggbb + alpha → rgba() */
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
